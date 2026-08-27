'use client';

import { useRef, useState, DragEvent } from 'react';
import clsx from 'clsx';
import { ACCEPTED_EXT, ACCEPTED_TYPES } from '@/lib/fileUtils';

interface Props {
  label: string;
  hint: string;
  accentIndex: '01' | '02';
  file: File | null;
  onChange: (file: File | null) => void;
}

export default function UploadCard({ label, hint, accentIndex, file, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const previewUrl = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!ACCEPTED_TYPES.includes(f.type) && !ACCEPTED_EXT.includes('.' + f.name.split('.').pop()?.toLowerCase())) {
      alert('Please upload a PDF, PNG, JPG, or WEBP file.');
      return;
    }
    onChange(f);
  }

  return (
    <div
      className={clsx(
        'relative flex flex-col rounded-2xl border-2 border-dashed p-6 transition-colors',
        dragging ? 'border-pen bg-pen/5' : 'border-ink-200 bg-white/70',
        file && 'border-solid border-ink-800 bg-white'
      )}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className="font-mono text-xs tracking-widest text-pen">{accentIndex}</span>
          <h3 className="font-display text-xl font-semibold text-ink-900">{label}</h3>
          <p className="mt-1 text-sm text-ink-500">{hint}</p>
        </div>
        {file && (
          <button
            onClick={() => onChange(null)}
            className="focus-ring rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-pen"
            aria-label={`Remove ${label}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="focus-ring flex flex-1 flex-col items-center justify-center gap-2 rounded-xl py-10 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-700">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v10M10 3l-4 4M10 3l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 15v1a1 1 0 001 1h12a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-medium text-ink-800">Drop a file or click to browse</span>
          <span className="text-xs text-ink-400">PDF, PNG, JPG, or WEBP</span>
        </button>
      ) : (
        <div className="flex flex-1 items-center gap-4 rounded-xl bg-paper-dim p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-200 bg-white">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-mono text-[10px] font-semibold uppercase text-pen">PDF</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">{file.name}</p>
            <p className="text-xs text-ink-400">{(file.size / 1024 / 1024).toFixed(2)} MB · ready</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 text-mark-correct">
            <circle cx="9" cy="9" r="8.2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M5.5 9.3l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
