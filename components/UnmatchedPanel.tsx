'use client';

import { UnmatchedAnswer } from '@/lib/types';

interface Props {
  items: UnmatchedAnswer[];
  onFocus: (item: UnmatchedAnswer) => void;
}

export default function UnmatchedPanel({ items, onFocus }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="border-t border-ink-200 bg-ink-950 px-4 py-3.5">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
        Unmatched content on answer sheet ({items.length})
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i}>
            <button
              onClick={() => onFocus(item)}
              className="focus-ring flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5"
            >
              <span className="mt-0.5 rounded bg-mark-partial/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-mark-partial">
                p.{item.page}
              </span>
              <span className="flex-1 text-xs text-ink-200">
                <span className="line-clamp-1 text-ink-100">{item.text || 'Unlabeled handwriting'}</span>
                <span className="block text-ink-400">{item.note}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
