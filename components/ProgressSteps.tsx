'use client';

import clsx from 'clsx';

export interface Step {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

export default function ProgressSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-ink-200 bg-white p-8 shadow-card animate-pop-in">
      <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest text-ink-400">
        Marking in progress
      </p>
      <ol className="space-y-5">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center gap-4">
            <span
              className={clsx(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold transition-colors',
                step.status === 'done' && 'border-mark-correct bg-mark-correct/10 text-mark-correct',
                step.status === 'active' && 'border-pen bg-pen/10 text-pen',
                step.status === 'pending' && 'border-ink-200 text-ink-300',
                step.status === 'error' && 'border-mark-incorrect bg-mark-incorrect/10 text-mark-incorrect'
              )}
            >
              {step.status === 'done' ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7.3l2.5 2.5L11 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : step.status === 'error' ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span
              className={clsx(
                'text-sm',
                step.status === 'active' && 'font-semibold text-ink-900',
                step.status === 'pending' && 'text-ink-400',
                (step.status === 'done' || step.status === 'error') && 'text-ink-700'
              )}
            >
              {step.label}
            </span>
            {step.status === 'active' && (
              <span className="ml-auto flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pen [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pen [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pen" />
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
