'use client';

import clsx from 'clsx';
import { AnswerMatch, Question } from '@/lib/types';

interface Props {
  questions: Question[];
  answersById: Record<string, AnswerMatch>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function VerdictBadge({ answer }: { answer?: AnswerMatch }) {
  if (!answer || answer.status === 'unanswered') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-mark-unanswered/10 px-2 py-0.5 text-[11px] font-medium text-mark-unanswered">
        <span className="h-1.5 w-1.5 rounded-full bg-mark-unanswered" /> Unanswered
      </span>
    );
  }
  const v = answer.grading.verdict;
  const map: Record<string, { label: string; cls: string }> = {
    correct: { label: 'Correct', cls: 'text-mark-correct bg-mark-correct/10' },
    partially_correct: { label: 'Partial', cls: 'text-mark-partial bg-mark-partial/10' },
    incorrect: { label: 'Incorrect', cls: 'text-mark-incorrect bg-mark-incorrect/10' },
    ungraded: { label: 'Answered', cls: 'text-ink-600 bg-ink-100' }
  };
  const m = map[v] || map.ungraded;
  return (
    <span className={clsx('flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', m.cls)}>
      {m.label}
    </span>
  );
}

export default function QuestionList({ questions, answersById, selectedId, onSelect }: Props) {
  return (
    <div className="h-full overflow-y-auto">
      <ul className="divide-y divide-paper-line">
        {questions.map((q) => {
          const answer = answersById[q.id];
          const isSelected = selectedId === q.id;
          return (
            <li key={q.id}>
              <button
                onClick={() => onSelect(q.id)}
                className={clsx(
                  'focus-ring flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors',
                  isSelected ? 'bg-pen/[0.06]' : 'hover:bg-ink-50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={clsx(
                      'font-mono text-sm font-semibold shrink-0',
                      isSelected ? 'text-pen' : 'text-ink-800'
                    )}
                  >
                    {q.displayLabel}
                  </span>
                  <p className="line-clamp-1 flex-1 text-sm text-ink-600">{q.text}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <VerdictBadge answer={answer} />
                  {answer?.outOfOrder && (
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
                      Out of order
                    </span>
                  )}
                  {answer?.regions && answer.regions.length > 1 && (
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
                      Spans {answer.regions.length} regions
                    </span>
                  )}
                  {answer?.grading.score !== null && answer?.grading.maxScore !== null && (
                    <span className="ml-auto font-mono text-xs font-semibold text-ink-700">
                      {answer?.grading.score}/{answer?.grading.maxScore}
                    </span>
                  )}
                </div>
              </button>

              {isSelected && (
                <div className="animate-pop-in space-y-3 border-t border-dashed border-paper-line bg-white px-4 py-4">
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ink-400">Question</p>
                    <p className="text-sm text-ink-700">{q.text}</p>
                    {q.maxMarks !== null && (
                      <p className="mt-1 text-xs text-ink-400">Max marks: {q.maxMarks}</p>
                    )}
                  </div>

                  {answer?.status === 'answered' ? (
                    <>
                      <div>
                        <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                          Transcribed answer
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-ink-700">{answer.answerText || '—'}</p>
                      </div>
                      {answer.grading.feedback && (
                        <div className="rounded-lg border-l-4 border-pen bg-pen/5 px-3 py-2">
                          <p className="mb-0.5 font-mono text-[10px] uppercase tracking-widest text-pen">
                            Feedback
                          </p>
                          <p className="text-sm text-ink-800">{answer.grading.feedback}</p>
                        </div>
                      )}
                      <p className="text-[11px] text-ink-400">Match confidence: {answer.confidence}</p>
                    </>
                  ) : (
                    <p className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-500">
                      No matching answer was found on the answer sheet for this question.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
