import { NextRequest, NextResponse } from 'next/server';
import { extractQuestions } from '@/lib/gemini';
import { FilePayload } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const questionPaper: FilePayload = body.questionPaper;

    if (!questionPaper?.base64) {
      return NextResponse.json({ error: 'questionPaper file is required.' }, { status: 400 });
    }

    const questions = await extractQuestions(questionPaper);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions could be extracted from this file. Try a clearer scan or a different file.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error('extract-questions error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
