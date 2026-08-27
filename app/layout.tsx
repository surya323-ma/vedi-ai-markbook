import type { Metadata } from 'next';
import { Source_Serif_4, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const display = Source_Serif_4({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display'
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body'
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'Markbook — AI Assessment Mapping',
  description: "Upload a question paper and a student's answer sheet. Markbook extracts every question, finds every answer, and highlights exactly where it was written."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink-900 font-body antialiased">{children}</body>
    </html>
  );
}
