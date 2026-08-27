'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnswerRegion, BoundingBox } from '@/lib/types';

const Document = dynamic(() => import('react-pdf').then((m) => m.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then((m) => m.Page), { ssr: false });

interface HighlightBox {
  page: number;
  box: BoundingBox;
  color: 'pen' | 'amber';
  label?: string;
}

interface Props {
  file: File;
  mimeType: string;
  regions: AnswerRegion[];
  extraBoxes?: HighlightBox[];
  onPageCount?: (n: number) => void;
}

export default function AnswerViewer({ file, mimeType, regions, extraBoxes = [], onPageCount }: Props) {
  const [numPages, setNumPages] = useState(1);
  const [page, setPage] = useState(1);
  const [workerReady, setWorkerReady] = useState(mimeType !== 'application/pdf');
  const containerRef = useRef<HTMLDivElement>(null);
  const isPdf = mimeType === 'application/pdf';

  const fileUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    if (!isPdf) return;
    import('react-pdf').then(({ pdfjs }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      setWorkerReady(true);
    });
  }, [isPdf]);

  useEffect(() => {
    if (regions.length > 0) {
      setPage(regions[0].page);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [regions]);

  const boxesForPage: HighlightBox[] = [
    ...regions.filter((r) => r.page === page).map((r) => ({ page, box: r.boundingBox, color: 'pen' as const })),
    ...extraBoxes.filter((b) => b.page === page)
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
        <span className="font-mono text-xs uppercase tracking-widest text-ink-400">Answer sheet</span>
        {numPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              className="focus-ring rounded-md px-2 py-1 text-sm text-ink-500 hover:bg-ink-100 disabled:opacity-30"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              ←
            </button>
            <span className="font-mono text-xs text-ink-500">
              Page {page} / {numPages}
            </span>
            <button
              className="focus-ring rounded-md px-2 py-1 text-sm text-ink-500 hover:bg-ink-100 disabled:opacity-30"
              onClick={() => setPage((p) => Math.min(numPages, p + 1))}
              disabled={page >= numPages}
              aria-label="Next page"
            >
              →
            </button>
          </div>
        )}
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-ink-100/60 p-6">
        <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-pop">
          {isPdf ? (
            workerReady && (
              <Document
                file={fileUrl}
                onLoadSuccess={({ numPages: n }: { numPages: number }) => {
                  setNumPages(n);
                  onPageCount?.(n);
                }}
                loading={<div className="p-16 text-center text-sm text-ink-400">Loading page…</div>}
                error={<div className="p-16 text-center text-sm text-mark-incorrect">Couldn&apos;t render this PDF.</div>}
              >
                <Page pageNumber={page} width={640} renderAnnotationLayer={false} renderTextLayer={false} />
              </Document>
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl} alt="Answer sheet" className="block w-full" />
          )}

          {boxesForPage.map((hb, i) => (
            <HighlightOverlay key={i} box={hb.box} color={hb.color} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HighlightOverlay({ box, color }: { box: BoundingBox; color: 'pen' | 'amber' }) {
  const style = {
    top: `${box.ymin / 10}%`,
    left: `${box.xmin / 10}%`,
    width: `${(box.xmax - box.xmin) / 10}%`,
    height: `${(box.ymax - box.ymin) / 10}%`
  };
  const borderColor = color === 'pen' ? '#c23b3b' : '#b8862b';
  const fillColor = color === 'pen' ? 'rgba(194,59,59,0.14)' : 'rgba(184,134,43,0.14)';

  return (
    <div
      className="pointer-events-none absolute animate-pop-in rounded-sm"
      style={{
        ...style,
        border: `2.5px solid ${borderColor}`,
        background: fillColor,
        boxShadow: `0 0 0 3px ${borderColor}22`
      }}
    >
      <span
        className="absolute -top-3 -left-1 h-2 w-2 rounded-full"
        style={{ background: borderColor }}
      />
    </div>
  );
}
