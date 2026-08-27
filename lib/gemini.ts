import { AnswerMatch, FilePayload, Question, UnmatchedAnswer } from './types';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function model() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to your environment variables (see .env.example).'
    );
  }
  return key;
}

async function callGemini(opts: {
  systemInstruction: string;
  parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  >;
  responseSchema: Record<string, unknown>;
}) {
  const url = `${API_BASE}/${model()}:generateContent?key=${apiKey()}`;

  const body = {
    system_instruction: { parts: [{ text: opts.systemInstruction }] },
    contents: [{ role: 'user', parts: opts.parts }],
    generationConfig: {
      temperature: 0.15,
      responseMimeType: 'application/json',
      responseSchema: opts.responseSchema
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate) {
    const blockReason = data.promptFeedback?.blockReason;
    throw new Error(
      `Gemini returned no candidates${blockReason ? ` (blocked: ${blockReason})` : ''}.`
    );
  }
  const textPart = candidate.content?.parts?.find((p: any) => typeof p.text === 'string');
  if (!textPart) {
    throw new Error('Gemini response did not contain text content.');
  }
  try {
    return JSON.parse(textPart.text);
  } catch (e) {
    throw new Error(`Failed to parse Gemini JSON output: ${(e as Error).message}`);
  }
}

const boundingBoxSchema = {
  type: 'object',
  properties: {
    ymin: { type: 'number' },
    xmin: { type: 'number' },
    ymax: { type: 'number' },
    xmax: { type: 'number' }
  },
  required: ['ymin', 'xmin', 'ymax', 'xmax']
};

const questionSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'string', description: 'The top-level question number as printed, e.g. "11"' },
          subpart: { type: 'string', description: 'Sub-part label if any, e.g. "a". Empty string if none.' },
          displayLabel: { type: 'string', description: 'Human readable label, e.g. "11 (a)" or "3"' },
          text: { type: 'string', description: 'Full question text, verbatim' },
          maxMarks: { type: 'number', description: 'Marks allotted if printed, else -1' },
          page: { type: 'number', description: '1-indexed page number the question appears on' }
        },
        required: ['number', 'subpart', 'displayLabel', 'text', 'maxMarks', 'page']
      }
    }
  },
  required: ['questions']
};

const analysisSchema = {
  type: 'object',
  properties: {
    answers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questionId: { type: 'string' },
          status: { type: 'string', enum: ['answered', 'unanswered'] },
          answerText: { type: 'string' },
          regions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                boundingBox: boundingBoxSchema
              },
              required: ['page', 'boundingBox']
            }
          },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          outOfOrder: { type: 'boolean' },
          grading: {
            type: 'object',
            properties: {
              score: { type: 'number', description: 'Marks awarded, -1 if unanswered/ungradeable' },
              maxScore: { type: 'number', description: 'Max marks for this question, -1 if unknown' },
              verdict: { type: 'string', enum: ['correct', 'partially_correct', 'incorrect', 'ungraded'] },
              feedback: { type: 'string', description: '1-3 sentence feedback for the student' }
            },
            required: ['score', 'maxScore', 'verdict', 'feedback']
          }
        },
        required: ['questionId', 'status', 'answerText', 'regions', 'confidence', 'outOfOrder', 'grading']
      }
    },
    unmatchedAnswers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          boundingBox: boundingBoxSchema,
          text: { type: 'string' },
          note: { type: 'string' }
        },
        required: ['page', 'boundingBox', 'text', 'note']
      }
    }
  },
  required: ['answers', 'unmatchedAnswers']
};

function filePart(file: FilePayload) {
  return { inlineData: { mimeType: file.mimeType, data: file.base64 } };
}

export async function extractQuestions(file: FilePayload): Promise<Question[]> {
  const systemInstruction = `You are an expert exam-paper parser. You will be given a scanned question paper (PDF or image, possibly multiple pages). Extract EVERY question in the exact order they are printed.

Rules:
- Treat labelled sub-parts as SEPARATE entries. E.g. "11 (a)" and "11 (b)" are two entries, each with number="11" and subpart="a"/"b".
- If a question has no sub-part, set subpart to an empty string "".
- Preserve original numbering exactly as printed (including roman numerals, letters, or decimal schemes) in the "number" field.
- "displayLabel" should be a short human-readable label such as "11 (a)" or "Q3" or "2".
- Copy question text verbatim (OCR it faithfully), including any sub-instructions, but exclude repeated page headers/footers.
- If marks are printed (e.g. "[5 marks]" or "(5)"), extract as maxMarks; otherwise use -1.
- Record the 1-indexed page number the question starts on.
- Do not invent questions that are not present. Do not skip any question, including short ones like "Define X." or fill-in-the-blank items.
- Output strictly matches the provided JSON schema.`;

  const parts = [filePart(file), { text: 'Extract all questions from this question paper.' }];
  const result = await callGemini({ systemInstruction, parts, responseSchema: questionSchema });

  const questions: Question[] = (result.questions || []).map((q: any, idx: number) => {
    const subpart = q.subpart && String(q.subpart).trim() ? String(q.subpart).trim() : null;
    const number = String(q.number ?? '').trim();
    const id = `q_${idx}_${number}${subpart ? `_${subpart}` : ''}`.replace(/[^a-zA-Z0-9_]/g, '');
    return {
      id: id || `q_${idx}`,
      number,
      subpart,
      displayLabel: q.displayLabel || `${number}${subpart ? ` (${subpart})` : ''}`,
      text: q.text || '',
      maxMarks: typeof q.maxMarks === 'number' && q.maxMarks >= 0 ? q.maxMarks : null,
      page: typeof q.page === 'number' && q.page > 0 ? q.page : 1
    };
  });

  return questions;
}

export async function analyzeAnswers(
  answerSheet: FilePayload,
  questions: Question[]
): Promise<{ answers: AnswerMatch[]; unmatchedAnswers: UnmatchedAnswer[] }> {
  const systemInstruction = `You are an expert exam grader analyzing a student's handwritten answer sheet (PDF or image, possibly multiple pages). You are given the list of questions (with ids) from the question paper.

Your job:
1. For each question id, find the student's answer anywhere in the answer sheet, even if answered out of order or on a later/earlier page than expected. Set "outOfOrder" to true if the answer appears in a position inconsistent with the printed question order.
2. If a question was not attempted anywhere, set status="unanswered", answerText="", regions=[], confidence="low", grading.verdict="ungraded", grading.score=-1.
3. For answered questions, transcribe the handwritten answer text as best you can (OCR handwriting), and determine the exact region(s) on the page image where the answer is written. An answer MAY span multiple pages/regions — include one entry per contiguous region in "regions".
4. Bounding boxes: use normalized coordinates on a 0-1000 scale for the given page image, in the order ymin, xmin, ymax, xmax (top-left origin), tightly cropping just the handwritten answer region (not the whole page).
5. Grade each answered question fairly based on the question text and the transcribed answer: give a score out of maxMarks (if maxMarks is -1/unknown, use a score out of 10), a verdict (correct / partially_correct / incorrect), and 1-3 sentences of constructive feedback.
6. Any handwritten content on the answer sheet that does NOT correspond to any known question (e.g. rough work, an answer to a question number that doesn't exist in the paper, or unlabeled content you cannot confidently match) should go into "unmatchedAnswers" with a bounding box, transcribed text, and a short note explaining why it's unmatched.
7. Never fabricate an answer for a question that was not attempted.

Output strictly matches the provided JSON schema. questionId values MUST exactly match the ids given in the question list.`;

  const questionsForPrompt = questions.map((q) => ({
    id: q.id,
    displayLabel: q.displayLabel,
    text: q.text,
    maxMarks: q.maxMarks ?? -1
  }));

  const parts = [
    { text: `Questions (id, label, text, maxMarks):\n${JSON.stringify(questionsForPrompt, null, 2)}` },
    filePart(answerSheet),
    { text: 'This is the student answer sheet. Map, transcribe, locate, and grade the answers per the instructions.' }
  ];

  const result = await callGemini({ systemInstruction, parts, responseSchema: analysisSchema });

  const knownIds = new Set(questions.map((q) => q.id));

  const answers: AnswerMatch[] = (result.answers || [])
    .filter((a: any) => knownIds.has(a.questionId))
    .map((a: any) => ({
      questionId: a.questionId,
      status: a.status === 'answered' ? 'answered' : 'unanswered',
      answerText: a.answerText || '',
      regions: Array.isArray(a.regions)
        ? a.regions.map((r: any) => ({
            page: typeof r.page === 'number' && r.page > 0 ? r.page : 1,
            boundingBox: normalizeBox(r.boundingBox)
          }))
        : [],
      confidence: ['high', 'medium', 'low'].includes(a.confidence) ? a.confidence : 'medium',
      outOfOrder: !!a.outOfOrder,
      grading: {
        score: typeof a.grading?.score === 'number' && a.grading.score >= 0 ? a.grading.score : null,
        maxScore:
          typeof a.grading?.maxScore === 'number' && a.grading.maxScore >= 0 ? a.grading.maxScore : null,
        verdict: ['correct', 'partially_correct', 'incorrect', 'ungraded'].includes(a.grading?.verdict)
          ? a.grading.verdict
          : 'ungraded',
        feedback: a.grading?.feedback || ''
      }
    }));

  // Ensure every question has an entry, even if the model omitted one.
  const answeredIds = new Set(answers.map((a) => a.questionId));
  for (const q of questions) {
    if (!answeredIds.has(q.id)) {
      answers.push({
        questionId: q.id,
        status: 'unanswered',
        answerText: '',
        regions: [],
        confidence: 'low',
        outOfOrder: false,
        grading: { score: null, maxScore: q.maxMarks, verdict: 'ungraded', feedback: '' }
      });
    }
  }

  const unmatchedAnswers: UnmatchedAnswer[] = (result.unmatchedAnswers || []).map((u: any) => ({
    page: typeof u.page === 'number' && u.page > 0 ? u.page : 1,
    boundingBox: normalizeBox(u.boundingBox),
    text: u.text || '',
    note: u.note || ''
  }));

  return { answers, unmatchedAnswers };
}

function normalizeBox(box: any) {
  const clamp = (n: any) => Math.max(0, Math.min(1000, typeof n === 'number' ? n : 0));
  return {
    ymin: clamp(box?.ymin),
    xmin: clamp(box?.xmin),
    ymax: clamp(box?.ymax ?? 1000),
    xmax: clamp(box?.xmax ?? 1000)
  };
}
