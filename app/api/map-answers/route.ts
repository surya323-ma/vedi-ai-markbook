import { NextRequest, NextResponse } from 'next/server';
import { analyzeAnswers } from '@/lib/gemini';
import { AnalyzeResult, FilePayload, Question } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const answerSheet: FilePayload = body.answerSheet;
    const questions: Question[] = body.questions;

    if (!answerSheet?.base64) {
      return NextResponse.json({ error: 'answerSheet file is required.' }, { status: 400 });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'questions array is required.' }, { status: 400 });
    }

    const { answers, unmatchedAnswers } = await analyzeAnswers(answerSheet, questions);

    const answered = answers.filter((a) => a.status === 'answered').length;
    const graded = answers.filter((a) => a.grading.score !== null && a.grading.maxScore !== null);
    const totalScore = graded.length ? graded.reduce((s, a) => s + (a.grading.score || 0), 0) : null;
    const maxScore = graded.length ? graded.reduce((s, a) => s + (a.grading.maxScore || 0), 0) : null;

    const result: Pick<AnalyzeResult, 'answers' | 'unmatchedAnswers' | 'summary'> = {
      answers,
      unmatchedAnswers,
      summary: {
        totalQuestions: questions.length,
        answered,
        unanswered: questions.length - answered,
        totalScore,
        maxScore
      }
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('map-answers error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
