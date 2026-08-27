'use client';

import { AnalyzeResult } from '@/lib/types';

export default function SummaryBar({ summary, onReset }: { summary: AnalyzeResult['summary']; onReset: () => void }) {
  const pct =
    summary.totalScore !== null && summary.maxScore ? Math.round((summary.totalScore / summary.maxScore) * 100) : null;

  return (
    <div className="flex flex-wrap items-center gap-6 border-b border-ink-200 bg-white px-6 py-4">
      <div>
        <h1 className="font-display text-lg font-semibold leading-none text-ink-900">Markbook</h1>
        <p className="mt-1 text-xs text-ink-400">Question ↔ answer mapping</p>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-5">
        <Stat label="Questions" value={String(summary.totalQuestions)} />
        <Stat label="Answered" value={String(summary.answered)} tone="correct" />
        <Stat label="Unanswered" value={String(summary.unanswered)} tone="unanswered" />
        {pct !== null && (
          <div className="flex items-center gap-2 rounded-full border border-pen/30 bg-pen/5 px-3 py-1.5">
            <span className="font-mono text-sm font-bold text-pen">{summary.totalScore}</span>
            <span className="text-xs text-ink-400">/ {summary.maxScore}</span>
            <span className="text-xs font-medium text-pen">({pct}%)</span>
          </div>
        )}
        <button
          onClick={onReset}
          className="focus-ring rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
        >
          New assessment
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'correct' | 'unanswered' }) {
  const color = tone === 'correct' ? 'text-mark-correct' : tone === 'unanswered' ? 'text-mark-unanswered' : 'text-ink-900';
  return (
    <div className="text-center">
      <p className={`font-mono text-lg font-bold leading-none ${color}`}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-ink-400">{label}</p>
    </div>
  );
}
