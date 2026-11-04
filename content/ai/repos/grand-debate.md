# The Grand Debate '26: the repository

- Repository: https://github.com/mukhtar-x/GrandDebatePortal
- Main language: TypeScript
- Last pushed: 2026-11-04

## README

# The Grand Debate '26 Portal

The Grand Debate '26 is a website and registration portal for The Literary Club (TLC),
FAST-NUCES Karachi. It combines public event information, delegate registration and status
lookup, document access, and an authenticated organiser dashboard.

> **Operational status:** Core website and portal functionality is implemented in the
> repository. This README describes the code, not a production readiness certification.
> No production deployment or production database has been validated as part of this work.

## Event information

| Detail | Information |
| --- | --- |
| Dates | 18–20 November 2026 |
| Daily timings | 8:00 AM–4:00 PM |
| Venue | FAST-NUCES Karachi Main Campus, National Highway |
| Audience | School and university students |
| Registration types | Solo delegate or delegation of 4–7 |
| Committees | UNSC, DISEC, PAC, UN Women, PNA |
| Allocation target | Within 1–3 business days after payment confirmation |
| Refunds | Registrations are final and non-refundable |

The event date, rates, registration windows, contacts, and committee choices are application
data and should be re-confirmed with organisers before launch.

## Features and implementation status

### Implemented in the code

- Public home, committee, registration, applicant portal, archive, and admin pages.
- Solo and delegation registration forms; delegation size is limited to 4–7 people.
- Server-side validation of delegate data, phone numbers, preferences, and pricing.
- Early-bird and regular fee calculation using the `Asia/Karachi` registration-window rules.
- Payment-receipt upload and resubmission. Files are type-checked by content, size-limited,
  and stored in MongoDB GridFS; image receipts are normalized before storage.
- OCR and receipt review signals, including hashes, duplicate/editing indicators, and an
  optional vision-model second opinion. AI results are advisory and do not confirm payments.
- Application lookup by registration email and application ID, with payment and delegate
  status information.
- Admin sign-in, application/roster review, payment confirmation or action-required response,
  receipt viewing/reanalysis, CSV export, and committee/delegate management.
- Committee creation/editing, capacity tracking, delegate allocation, waitlisting, and
  allocation removal.
- Static public event rulebook and committee study-guide PDFs under `public/docs/`.
- Seed script and API tests for development workflows.

### Implemented but requiring operational setup or verification

- MongoDB-backed registration, receipt storage, status lookup, and organiser operations
  require a reachable MongoDB deployment.
- Admin access requires individual accounts in `ADMIN_USERS`.
- Optional receipt AI analysis requires a provider key and model. It is disabled unless both
  are configured.
- Deployment configuration, production database behavior, backups, monitoring, and end-to-end
  operation have not been certified here.

### Not implemented or awaiting organiser confirmation

- Transactional email delivery uses Google SMTP with OAuth2 when the mail environment variables
  are configured. Delivery failures are logged and do not roll back registration or payment
  operations; there is not yet a durable retry queue.
- Payment account title and transfer instructions need organiser approval.
- Final agendas, committee levels/capacities, and any other event-specific committee details
  need confirmation. A seat count of `0` means unlimited in the admin interface.
- Sponsor content and final event copy need confirmation.
- Production deployment, monitoring, backups, privacy/retention policy, and a live operational
  test remain to be completed.
- Review the homepage against the final event brief before launch; any additional campaign
  sections requested by organisers should be tracked and implemented separately.

## Technology

- **Next.js 16 App Router**, React 19, and TypeScript.
- **MongoDB** with **Mongoose** for applications, delegates, payments, committees, rate limits,
  and receipt metadata/files.
- **Tailwind CSS 4** and project-specific CSS for the visual system.
- **Sharp** for receipt-image processing; **Tesseract.js** and English trained data for OCR;
  **unpdf** for PDF text extraction.
- Optional OpenAI-compatible vision endpoint for receipt second-opinion checks.
- ESLint 9, TypeScript, `tsx` scripts, and Node's test/assert utilities.

The application is a Next.js Node application, not a static export. Interactive browser
features are kept in client components; pages, data access, and API handlers run on the
server. `next.config.ts` enables React Compiler, Cache Components and partial prefetching,
adds security headers, and includes Tesseract worker/data files in API function tracing.

## Architecture and data flow

```text
Browser
  ├── Public pages and registration/status client components
  └── /admin dashboard
          │ same-origin requests
          ▼
Next.js App Router pages and Route Handlers (src/app)
  ├── src/lib: validation, pricing, auth, receipt processing, database and mail
  ├── src/models: Mongoose schemas
  └── MongoDB
       ├── application/delegate/payment/committee records
       └── GridFS bucket "receipts" for uploaded payment files
```

### Source layout

| Location | Responsibility |
| --- | --- |
| `src/app/page.tsx` | Public landing page |
| `src/app/(portal)/` | Shared public shell and committees, registration, portal, and archive pages |
| `src/app/admin/` | Organiser dashboard page and styles |
| `src/app/api/` | Registration, status, committee, and admin Route Handlers |
| `src/components/registration/` | Registration form and its field sections |
| `src/components/portal/` | Applicant status lookup and receipt resubmission UI |
| `src/components/admin/` | Admin dashboard and application/committee workflows |
| `src/components/shared/` | Site header, navigation, intro, hero, and footer |
| `src/data/` | Event and committee display data |
| `

(README cut short here)
