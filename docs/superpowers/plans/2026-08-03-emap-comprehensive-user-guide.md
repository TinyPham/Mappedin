# E-Map Comprehensive User Guide Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a professional, reproducible Vietnamese Word user guide and verified PDF for the Long Thanh Airport 3D Map, with complete role-based coverage and real UI screenshots annotated by red rectangles and matching number badges.

**Architecture:** Use Playwright against the current Vite application to capture deterministic desktop, tablet, mobile, kiosk, and admin states. Add annotations as DOM overlays before capture so the original screenshot remains faithful to the application. Store guide content as structured Python data, generate DOCX with `python-docx` including native TOC/SEQ/REF fields, then use Microsoft Word COM to update all dynamic fields, repaginate, and export PDF. Verify the artifacts and render the PDF for visual inspection.

**Tech Stack:** Vite/TypeScript application, Playwright 1.59, Node.js, Python 3.14, Pillow, python-docx, Microsoft Word COM, PyMuPDF, PowerShell, CSV.

**Base commit:** `8f939db` (approved design specification committed on top of application commit `733e7c5`).

---

## File structure

### Create

- `docs/user-guide/README.md` — artifact inventory, update workflow, and reproducibility instructions.
- `docs/user-guide/Huong-dan-su-dung-He-thong-Ban-do-3D-Long-Thanh.docx` — primary Word deliverable.
- `docs/user-guide/Huong-dan-su-dung-He-thong-Ban-do-3D-Long-Thanh.pdf` — visual review/share copy.
- `docs/user-guide/images/*.png` — annotated screenshots used by the guide.
- `docs/user-guide/source/feature-matrix.csv` — finite requirements-to-evidence matrix.
- `docs/user-guide/source/screenshot-manifest.json` — screenshot IDs, viewport, scenario, annotations, caption, and output path.
- `docs/user-guide/source/verify_user_guide.py` — verification scaffold created before document generation and completed during final QA.
- `docs/user-guide/source/mock-api-fixtures.mjs` — deterministic sanitized API responses used only in screenshot sessions.
- `docs/user-guide/source/capture-guide.mjs` — Playwright capture and DOM-annotation harness.
- `docs/user-guide/source/guide_content.py` — structured Vietnamese guide content.
- `docs/user-guide/source/build_user_guide.py` — DOCX generator and layout helpers.
- `docs/user-guide/source/finalize_word.ps1` — Word field update and PDF export.
- `docs/user-guide/source/rendered-pages/*.png` — temporary/rendered PDF review pages; retain a contact sheet and remove individual renders only if the final README documents regeneration.
- `docs/user-guide/source/contact-sheet.png` — final visual QA overview.
- `docs/user-guide/source/requirements-docs.txt` — pinned documentation-build Python dependencies.

### Modify

- None of the application runtime files. Documentation capture must not change `main/`, `src/`, `backend/`, or `database/`.

## Task 1: Establish the finite feature and evidence matrix

**Files:**

- Create: `docs/user-guide/source/feature-matrix.csv`
- Create: `docs/user-guide/source/screenshot-manifest.json`
- Create: `docs/user-guide/README.md`
- Create: `docs/user-guide/source/verify_user_guide.py`

- [ ] **Step 1: Create the artifact directories**

Create `docs/user-guide/images`, `docs/user-guide/source`, and `docs/user-guide/source/rendered-pages` with explicit paths.

- [ ] **Step 2: Write the feature matrix**

Use CSV columns:

```text
feature_id,role,chapter,procedure,evidence_type,screenshot_id,verification,status,notes
```

Include every feature identified in the approved spec. `status` starts as `pending`; every row must later become `verified`.

- [ ] **Step 3: Write the screenshot manifest**

Each entry must have:

```json
{
  "id": "public-search-results",
  "role": "public",
  "viewport": { "width": 1440, "height": 900 },
  "scenario": "search-results",
  "output": "images/03-02-public-search-results.png",
  "caption": "Kết quả tìm kiếm và nhãn tầng",
  "annotations": [
    { "number": 1, "selector": "#location-search", "label": "Ô tìm kiếm" },
    { "number": 2, "selector": "#search-results", "label": "Danh sách kết quả" }
  ]
}
```

Every annotation must contain both a rectangle target and a numbered badge.

- [ ] **Step 4: Populate the complete capture list**

Target 40–45 screenshots:

- Public desktop: 15–17.
- Tablet portrait/landscape: at least 3.
- Mobile: 7–9.
- Kiosk runtime and error states: 5–7.
- Admin: 9–11.
- Operations/troubleshooting: UI evidence where material; use verified code blocks/tables for inherently text-only command procedures.

- [ ] **Step 5: Validate the matrix and manifest shape**

Run a short Node validation that rejects duplicate screenshot IDs, missing required fields, non-approved viewport profiles, empty annotation lists, duplicate annotation numbers, or fewer than 35 screenshots.

Expected: PASS with zero validation errors.

- [ ] **Step 6: Create the verification scaffold**

Add `verify_user_guide.py` with `--structure-only`. At this stage it validates paths and the matrix/manifest schema, and deliberately reports a clear failure when DOCX/PDF do not yet exist. Task 7 extends the same file with complete checks.

- [ ] **Step 7: Commit**

```powershell
git add docs/user-guide/README.md docs/user-guide/source/feature-matrix.csv docs/user-guide/source/screenshot-manifest.json docs/user-guide/source/verify_user_guide.py
git commit -m "docs: define E-Map guide feature and screenshot matrix"
```

## Task 2: Build the deterministic screenshot harness

**Files:**

- Create: `docs/user-guide/source/mock-api-fixtures.mjs`
- Create: `docs/user-guide/source/capture-guide.mjs`

- [ ] **Step 1: Implement mock API fixtures**

Provide sanitized fixture responses for public reads, flights, admin session, kiosk public config, kiosk admin list, and handled error states. Do not include credentials, secrets, production customer data, or write-through endpoints.

- [ ] **Step 2: Implement DOM annotation helpers**

Add a fixed overlay root with `pointer-events:none`. For every annotation:

- Read `getBoundingClientRect()` from the selector.
- Draw a transparent rectangle with `3px solid #D92D20`.
- Add a white circular badge with red border/text and the matching number.
- Add a compact white/red label only when the manifest supplies one.
- Keep overlay z-index above the app and below no required screenshot content.

- [ ] **Step 3: Implement scenario preparation**

Provide named scenario functions for startup, search, category, location details, route form, route result, simulation, settings, flight modal, tutorial, mobile layouts, kiosk, kiosk error, login, area information, classification, area color, model editing, and kiosk admin.

Use real application controls and map canvas. Fixture or inject only the minimum sanitized data needed to put the current UI in a deterministic state.

- [ ] **Step 4: Add capture safeguards**

- Start with a fresh browser context for each role/state group.
- Clear localStorage/cookies unless the scenario explicitly needs them.
- Disable animation only after the intended state is established.
- Wait for the loading overlay to disappear and the map canvas to contain rendered pixels.
- Fail if an annotation selector is missing or has zero size.
- Fail if any network request attempts a write method to the real backend.

- [ ] **Step 5: Run one red-green smoke capture**

First run a manifest entry with an intentionally invalid selector and confirm the harness fails. Restore the valid selector and rerun.

Expected: first run FAIL with `annotation target not visible`; second run creates a readable PNG and exits 0.

- [ ] **Step 6: Commit**

```powershell
git add docs/user-guide/source/mock-api-fixtures.mjs docs/user-guide/source/capture-guide.mjs
git commit -m "docs: add deterministic annotated screenshot harness"
```

## Task 3: Capture and review public desktop, tablet, and mobile evidence

**Files:**

- Create: `docs/user-guide/images/01-*.png` through public/mobile image groups.
- Modify: `docs/user-guide/source/feature-matrix.csv`
- Modify: `docs/user-guide/source/screenshot-manifest.json` only when real layout requires a selector or framing correction.

- [ ] **Step 1: Start only the Vite frontend**

```powershell
$stdout = Join-Path $env:TEMP 'emap-guide-vite.stdout.log'
$stderr = Join-Path $env:TEMP 'emap-guide-vite.stderr.log'
$vite = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','dev') -WorkingDirectory 'D:\E-Map-Website\ERP-Mappedin' -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/ | Select-Object StatusCode
```

Expected: frontend listens on `http://127.0.0.1:3000`; no production database writes occur.

Record `$vite.Id`. After the final capture, resolve and stop only that exact process tree; do not stop unrelated Node processes.

- [ ] **Step 2: Capture desktop scenarios**

Cover overview, sidebar/search, results, categories, location details, route construction, route result, instruction list, simulation, settings, flight modal, tutorial, floor/language, and camera controls.

- [ ] **Step 3: Capture tablet scenarios**

Capture at `820 × 1180` and `1180 × 820`, including controls, route form, and flight/settings modal.

- [ ] **Step 4: Capture mobile scenarios**

Capture at `390 × 844`, including overview, search/category controls, location detail, directions, route preview/simulation, floor/language, settings, flight modal, and guide button.

- [ ] **Step 5: Inspect every image at original resolution**

Reject images with clipped badges, unreadable text, loading overlays, empty WebGL canvas, overlapping labels, or more than five annotations.

- [ ] **Step 6: Mark corresponding matrix rows `verified`**

Each row records the exact screenshot ID or a text-only verification reason.

- [ ] **Step 7: Commit**

```powershell
git add docs/user-guide/images docs/user-guide/source/feature-matrix.csv docs/user-guide/source/screenshot-manifest.json
git commit -m "docs: capture public E-Map guide screenshots"
```

## Task 4: Capture kiosk and admin evidence

**Files:**

- Create: remaining `docs/user-guide/images/*.png`
- Modify: `docs/user-guide/source/feature-matrix.csv`

- [ ] **Step 1: Capture kiosk runtime**

Show the normalized kiosk URL, readonly origin, destination selection, route, Home/Reset behavior, and retained `mode`/`kioskId` after navigation changes.

- [ ] **Step 2: Capture kiosk error states**

Show inactive/unknown kiosk and generic unavailable state. Use sanitized fixture responses and do not expose backend details in the UI.

- [ ] **Step 3: Capture admin authentication states**

Show login, password visibility control, authenticated admin tools/session bar, and logout/view-only state. Use fixture auth; never enter a real password.

- [ ] **Step 4: Capture admin modules**

Cover area information, multilingual tabs, upload/preview, classification, area color, model picker/controls, and kiosk management/preview. All saves are intercepted; no request may mutate the real backend.

- [ ] **Step 5: Include the legacy-admin warning evidence only if useful**

Do not teach the `admin.html` workflow. Prefer a warning box in the document; omit a screenshot if it adds no user value.

- [ ] **Step 6: Inspect all images and mark matrix rows `verified`**

Expected: every kiosk/admin feature has evidence and every screenshot annotation has rectangle + badge + matching legend text.

- [ ] **Step 7: Commit**

```powershell
git add docs/user-guide/images docs/user-guide/source/feature-matrix.csv
git commit -m "docs: capture kiosk and admin guide screenshots"
```

## Task 5: Write the complete Vietnamese guide content

**Files:**

- Create: `docs/user-guide/source/guide_content.py`

- [ ] **Step 1: Define structured content primitives**

Use records for chapter, section, paragraph, numbered steps, bullets, note, tip, warning, figure, table, and page break. Figure records reference manifest IDs rather than raw paths.

- [ ] **Step 2: Write front matter**

Include title, version `1.0`, release date, the neutral document-owner label `Đơn vị quản lý hệ thống`, revision history, intended audience, symbol conventions, and quick-start summary.

- [ ] **Step 3: Write public-user chapters**

For every main procedure include purpose, prerequisites, numbered steps, expected result, figure, figure legend, and relevant note. Use office-style Vietnamese: direct, respectful, short sentences, and no unexplained technical jargon.

- [ ] **Step 4: Write mobile/tablet and kiosk chapters**

Separate touch gestures and responsive placement from desktop behavior. Keep kiosk in-shift use separate from admin configuration; tell kiosk staff when to escalate.

- [ ] **Step 5: Write admin chapters**

Explain permission boundaries and risky operations. Never provide credentials. Add explicit verification-after-save guidance where UI success feedback may be unreliable.

- [ ] **Step 6: Write operations and troubleshooting**

Use the current ports `3000/3002`, correct commands, URL parameter table, decision-oriented troubleshooting, FAQ, glossary, known limitations, and handover checklist.

- [ ] **Step 7: Cross-check against feature matrix**

Every matrix row must map to a chapter/procedure in content. No runtime feature may be claimed if the audit found it stored but not applied.

- [ ] **Step 8: Commit**

```powershell
git add docs/user-guide/source/guide_content.py
git commit -m "docs: write comprehensive Vietnamese E-Map guide content"
```

## Task 6: Build the professional DOCX generator

**Files:**

- Create: `docs/user-guide/source/requirements-docs.txt`
- Create: `docs/user-guide/source/build_user_guide.py`
- Create: `docs/user-guide/source/finalize_word.ps1`

- [ ] **Step 1: Pin and install documentation dependencies**

`requirements-docs.txt` must pin compatible versions of `python-docx`, `Pillow`, and `PyMuPDF`. The README must also check and document Playwright browser availability and Microsoft Word installation. Install Python dependencies into the active environment without modifying the application package files.

```powershell
python -m pip install -r docs\user-guide\source\requirements-docs.txt
```

- [ ] **Step 2: Write a failing DOCX structure check**

Before the builder exists, run `verify_user_guide.py --structure-only` and confirm it fails because the DOCX is missing.

- [ ] **Step 3: Implement Word styles and page setup**

Create A4 sections, margins, Aptos/Arial fonts, Heading 1–3 styles, caption style, table styles, note/tip/warning boxes, image sizing, page-break rules, and landscape sections for genuinely wide content only.

- [ ] **Step 4: Implement Word fields and cross-references**

Insert fields for table of contents, list of figures, caption sequence (`SEQ`), bookmark-backed figure references (`REF`), `PAGE`, and `NUMPAGES`. Add header title/version and footer release date plus `Trang X/Y`.

- [ ] **Step 5: Render structured content and figures**

Resolve every figure ID through the screenshot manifest. Add `Hình X.Y – ...` captions and numbered legends that exactly match badges in the image.

- [ ] **Step 6: Implement Word finalization**

`finalize_word.ps1` must open Word invisibly, update fields in all stories, repaginate, save DOCX, export PDF, close the document, and always quit/release Word in `finally`.

- [ ] **Step 7: Generate DOCX and PDF**

```powershell
python docs\user-guide\source\build_user_guide.py
powershell -ExecutionPolicy Bypass -File docs\user-guide\source\finalize_word.ps1
```

Expected: both deliverables exist, Word opens DOCX without repair, and PDF page count is plausible for the content.

- [ ] **Step 8: Commit**

```powershell
git add docs/user-guide/source/requirements-docs.txt docs/user-guide/source/build_user_guide.py docs/user-guide/source/finalize_word.ps1 docs/user-guide/*.docx docs/user-guide/*.pdf
git commit -m "docs: generate professional E-Map Word user guide"
```

## Task 7: Verify content, layout, security, and reproducibility

**Files:**

- Modify: `docs/user-guide/source/verify_user_guide.py`
- Create: `docs/user-guide/source/contact-sheet.png`
- Modify: `docs/user-guide/README.md`
- Modify: generated guide artifacts only if verification finds issues.

- [ ] **Step 1: Implement artifact verification**

Verify:

- At least 35 valid PNG screenshots.
- Every manifest output exists and opens with Pillow.
- Every annotation has rectangle metadata, a unique badge number, and matching legend text.
- All feature-matrix rows are `verified`.
- DOCX ZIP/XML contains headings, TOC/list-of-figures fields, `SEQ` captions, bookmark-backed `REF` cross-references, header/footer, `PAGE`, and `NUMPAGES`.
- PDF opens with PyMuPDF, has no blank pages, and has a non-trivial page count.
- Extracted text contains every required chapter title.
- Files contain no `.env` values, password hash, JWT/API secret, cookie, or connection string.

- [ ] **Step 2: Render every PDF page**

Render at a readable scale with PyMuPDF and build a numbered contact sheet. Inspect all pages for clipping, orphaned captions/headings, stretched images, unexpected blanks, broken tables, or unreadable screenshots.

- [ ] **Step 3: Run a clean reproducibility build**

Move the generated DOCX/PDF to a validated temporary directory, rerun capture-independent document generation/finalization, and compare page count plus required XML/text checks. Restore only the newly verified outputs.

- [ ] **Step 4: Run the full verification command**

```powershell
python docs\user-guide\source\verify_user_guide.py
```

Expected: exit 0 with screenshot count, verified feature count, DOCX checks, PDF page count, and secret scan all passing.

- [ ] **Step 5: Re-read the approved spec line by line**

Record each acceptance criterion and its evidence in the verification output/README. Do not mark completion from test success alone.

- [ ] **Step 6: Update README and commit final verified artifacts**

```powershell
git add docs/user-guide
git commit -m "docs: verify and finalize E-Map user guide"
```

## Task 8: Final independent review

**Files:** Read-only review of the spec, plan, generated DOCX/PDF, images, matrix, and scripts.

- [ ] **Step 1: Dispatch a spec-compliance reviewer**

Reviewer confirms every approved requirement is represented in the artifacts and matrix.

- [ ] **Step 2: Resolve all compliance issues and re-review**

No open compliance issue is accepted.

- [ ] **Step 3: Dispatch a document-quality reviewer**

Reviewer inspects wording, role clarity, screenshot legibility, annotation consistency, layout, and security/reproducibility scripts.

- [ ] **Step 4: Resolve all quality issues and re-review**

Rerun `verify_user_guide.py` after every material correction.

- [ ] **Step 5: Run final fresh verification**

```powershell
git status --short
python docs\user-guide\source\verify_user_guide.py
```

Expected: only intentional scoped changes, verification exit 0, and no missing deliverable.
