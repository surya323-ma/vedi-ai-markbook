export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface Question {
  id: string;
  number: string;
  subpart: string | null;
  displayLabel: string;
  text: string;
  maxMarks: number | null;
  page: number;
}

export type AnswerStatus = 'answered' | 'unanswered';
export type Verdict = 'correct' | 'partially_correct' | 'incorrect' | 'ungraded';
export type Confidence = 'high' | 'medium' | 'low';

export interface Grading {
  score: number | null;
  maxScore: number | null;
  verdict: Verdict;
  feedback: string;
}

export interface AnswerRegion {
  page: number;
  boundingBox: BoundingBox;
}

export interface AnswerMatch {
  questionId: string;
  status: AnswerStatus;
  answerText: string;
  regions: AnswerRegion[];
  confidence: Confidence;
  outOfOrder: boolean;
  grading: Grading;
}

export interface UnmatchedAnswer {
  page: number;
  boundingBox: BoundingBox;
  text: string;
  note: string;
}

export interface AnalyzeResult {
  questions: Question[];
  answers: AnswerMatch[];
  unmatchedAnswers: UnmatchedAnswer[];
  summary: {
    totalQuestions: number;
    answered: number;
    unanswered: number;
    totalScore: number | null;
    maxScore: number | null;
  };
}

export interface FilePayload {
  base64: string;
  mimeType: string;
  name: string;
  pageCount: number;
}
