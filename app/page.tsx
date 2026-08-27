'use client';

import { useMemo, useState } from 'react';
import UploadCard from '@/components/UploadCard';
import ProgressSteps, { Step } from '@/components/ProgressSteps';
import QuestionList from '@/components/QuestionList';
import AnswerViewer from '@/components/AnswerViewer';
import SummaryBar from '@/components/SummaryBar';
import UnmatchedPanel from '@/components/UnmatchedPanel';
import { readFileAsBase64 } from '@/lib/fileUtils';
import { AnalyzeResult, AnswerMatch, UnmatchedAnswer } from '@/lib/types';

type Stage = 'upload' | 'processing' | 'results' | 'error';

const STEP_LABELS = [
  'Reading the question paper',
  'Extracting questions in order',
  'Reading the answer sheet',
  'Mapping answers & locating regions',
  'Grading & writing feedback'
];

export default function Page() {
  const [stage, setStage] = useState<Stage>('upload');
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [answerSheetFile, setAnswerSheetFile] = useState<File | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedUnmatched, setFocusedUnmatched] = useState<UnmatchedAnswer | null>(null);

  const steps: Step[] = STEP_LABELS.map((label, i) => ({
    label,
    status: i < stepIndex ? 'done' : i === stepIndex ? 'active' : stage === 'error' && i === stepIndex ? 'error' : 'pending'
  }));

  const canStart = !!questionPaperFile && !!answerSheetFile;

  async function handleStart() {
    if (!questionPaperFile || !answerSheetFile) return;
    setStage('processing');
    setErrorMessage('');
    setStepIndex(0);

    try {
      const qpPayload = await readFileAsBase64(questionPaperFile);
      setStepIndex(1);

      const qRes = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionPaper: qpPayload })
      });
      const qData = await qRes.json();
      if (!qRes.ok) throw new Error(qData.error || 'Failed to extract questions.');
      setStepIndex(2);

      const asPayload = await readFileAsBase64(answerSheetFile);
      setStepIndex(3);

      const aRes = await fetch('/api/map-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerSheet: asPayload, questions: qData.questions })
      });
      setStepIndex(4);
      const aData = await aRes.json();
      if (!aRes.ok) throw new Error(aData.error || 'Failed to map answers.');

      const finalResult: AnalyzeResult = {
        questions: qData.questions,
        answers: aData.answers,
        unmatchedAnswers: aData.unmatchedAnswers,
        summary: aData.summary
      };
      setResult(finalResult);
      setSelectedId(finalResult.questions[0]?.id ?? null);
      setStage('results');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setStage('error');
    }
  }

  function reset() {
    setStage('upload');
    setQuestionPaperFile(null);
    setAnswerSheetFile(null);
    setResult(null);
    setSelectedId(null);
    setFocusedUnmatched(null);
  }

  const answersById = useMemo(() => {
    const map: Record<string, AnswerMatch> = {};
    result?.answers.forEach((a) => (map[a.questionId] = a));
    return map;
  }, [result]);

  const selectedAnswer = selectedId ? answersById[selectedId] : undefined;
  const activeRegions = focusedUnmatched
    ? [{ page: focusedUnmatched.page, boundingBox: focusedUnmatched.boundingBox }]
    : selectedAnswer?.regions || [];

  if (stage === 'results' && result && answerSheetFile) {
    return (
      <main className="flex h-screen flex-col">
        <SummaryBar summary={result.summary} onReset={reset} />
        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[minmax(0,420px)_1fr]">
          <div className="flex flex-col overflow-hidden border-r border-ink-200 bg-white">
            <QuestionList
              questions={result.questions}
              answersById={answersById}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setFocusedUnmatched(null);
              }}
            />
            <UnmatchedPanel items={result.unmatchedAnswers} onFocus={(item) => setFocusedUnmatched(item)} />
          </div>
          <AnswerViewer
            file={answerSheetFile}
            mimeType={answerSheetFile.type || 'application/pdf'}
            regions={activeRegions}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
        {stage !== 'processing' && (
          <div className="mb-10 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-pen">Markbook</span>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
              Every answer, mapped
              <br /> to its question.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm text-ink-500">
              Upload a question paper and a student&apos;s answer sheet. Markbook finds every answer, shows
              exactly where it was written, and grades it for you.
            </p>
          </div>
        )}

        {stage === 'processing' ? (
          <ProgressSteps steps={steps} />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <UploadCard
                label="Question paper"
                hint="The exam or worksheet with all questions."
                accentIndex="01"
                file={questionPaperFile}
                onChange={setQuestionPaperFile}
              />
              <UploadCard
                label="Answer sheet"
                hint="One student's handwritten responses."
                accentIndex="02"
                file={answerSheetFile}
                onChange={setAnswerSheetFile}
              />
            </div>

            {stage === 'error' && (
              <div className="mt-5 rounded-xl border border-mark-incorrect/30 bg-mark-incorrect/5 px-4 py-3 text-sm text-mark-incorrect">
                {errorMessage}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="focus-ring rounded-full bg-ink-900 px-8 py-3 text-sm font-semibold text-paper shadow-pop transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
              >
                Mark this assessment →
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
