# Markbook — AI Assessment Extraction & Answer Mapping

Upload a question paper and one student's handwritten answer sheet. Markbook extracts every
question (in printed order, with labelled sub-parts as separate entries), locates the student's
answer for each one on the answer sheet, highlights the exact region it was written in, and grades
it with short feedback.

## How it works

**Flow:** Question Extraction → Answer Extraction & Mapping → Highlighting → Grading

1. **Upload** — the teacher drops in a question paper and an answer sheet (PDF or image, JPG/PNG/WEBP).
2. **Extract questions** (`/api/extract-questions`) — the question paper file is sent to Gemini
   directly (Gemini reads PDFs/images natively, no server-side rasterization needed) with a prompt
   that requires every question and labelled sub-part (`11 (a)`, `11 (b)`, ...) to be returned as a
   separate entry, in the original printed numbering and order, as structured JSON
   (`responseSchema` enforced).
3. **Map & grade answers** (`/api/map-answers`) — the answer sheet file plus the extracted question
   list (id, label, text, max marks) are sent to Gemini in a single call. The model is asked to:
   - find each question's answer anywhere on the sheet (handles answers given out of order),
   - mark questions with no attempt as `unanswered`,
   - return a tight bounding box (0–1000 normalized coordinates, Gemini's native convention) for
     every region the answer appears in — an answer can span multiple regions/pages,
   - collect any handwritten content that doesn't match a known question into `unmatchedAnswers`,
   - grade each answered question (score / max, verdict, 1–3 sentence feedback).
4. **Display** — the left panel lists every question like a markbook ledger (status, marks,
   out-of-order flag, multi-region flag). Clicking a question jumps the right-hand viewer to the
   correct page of the answer sheet and draws a red highlighter box over the exact answer region
   (rendered with `react-pdf` for PDFs, natively for images). Unmatched handwriting is listed
   separately and can also be focused on the viewer.

Only two Gemini calls are made per assessment, which keeps it comfortably inside a free-tier quota.

## Tech stack

- **Framework:** Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **AI model:** Google Gemini (`gemini-2.5-flash` by default — vision + native PDF understanding +
  structured JSON output + bounding-box grounding). Any Gemini model name can be swapped in via
  `GEMINI_MODEL`.
- **PDF rendering (highlighting):** `react-pdf` / `pdfjs-dist` on the client
- **Storage:** none — everything lives in browser/React state and function memory for the duration
  of the request. No database, no auth, per the assignment constraints.

## Local setup

```bash
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY
npm run dev
```

Get a free Gemini API key at https://aistudio.google.com/app/apikey.

## Deploying to Render

1. Push this repo to GitHub.
2. In Render: **New → Web Service**, connect the repo (the included `render.yaml` blueprint will
   pre-fill the settings — or set them manually):
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
   - Environment: Node
3. Add the environment variable `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in the Render
   dashboard.
4. Deploy. Render's free web-service plan is sufficient — there's no database or persistent
   storage to provision.

## Assumptions & limitations

- **One answer sheet, one student per run**, per the assignment scope — no batch grading.
- **Grading is AI-generated** and meant as a first-pass aid for the teacher, not a final grade;
  the model can misjudge subjective/long-form answers, and OCR of messy handwriting is imperfect.
- **Bounding boxes** come directly from the vision model's grounding rather than a separate OCR
  layer; very cramped or overlapping handwriting can occasionally produce a loosely-fit box.
- Very long question papers/answer sheets (dozens of pages) increase latency and may approach
  free-tier token/response limits — the app targets typical single-subject school assessments
  (a few pages each).
- If the extraction step returns very low-confidence matches, the teacher should treat unmatched
  or low-confidence entries as needing manual review rather than ground truth.
- No authentication or persistence: closing the tab clears the session, consistent with the
  "no database required" constraint.
