# WebinarStudio

> Enterprise webinar content pipeline — Generate landing pages, email sequences, run-of-show documents, and checklists from your webinar content in minutes using AI.

[![License: Private](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)

**[Live Demo](https://webinarstudio.bolt.host)** | **[For Recruiters](#portfolio-analysis)** | **[Tech Stack](#tech-stack)** | **[System Architecture](#system-architecture)**

A [FutureCrafters](https://www.futurecrafters.ai) Production System • Built by [Irvin Cruz](https://irvincruz.com)

---

## TL;DR (30-Second Scan)

**What:** Complete webinar content generation pipeline. Takes webinar recordings/transcripts and generates 8+ deliverables: landing pages, email sequences, run-of-show documents, speaker checklists, social posts, and more.

**Why Enterprise-Grade:** QA validation system, structured schema validation (Zod), pipeline orchestration, Supabase backend, document generation (.docx export), and comprehensive error handling.

**For Recruiters:** Demonstrates systems architecture thinking, production-quality TypeScript, database design, AI pipeline orchestration, and enterprise software patterns.

**Tech:** React 18 + TypeScript + Vite + Supabase + Zod + Zustand + Document generation (docx) + AI pipeline orchestration.

**Scale:** 115 TypeScript files, 1.5MB source code, multi-phase pipeline with QA validation.

---

## The Problem

**Event Marketers:** Spend 10-20 hours manually creating webinar collateral (landing pages, emails, checklists) after each event.

**Agencies:** Managing 50+ webinars/year = hundreds of hours on repetitive content creation.

**Current Solutions Fail:**
- ❌ Manual templates = slow, inconsistent
- ❌ Generic AI tools = miss context, require heavy editing
- ❌ No validation = broken links, missing data ship to clients

**The gap:** No system that understands webinar structure, validates completeness, and generates production-ready deliverables.

---

## The Solution

### Webinar Content Pipeline

**Input:** Webinar recording/transcript + project metadata (speaker, date, client info)

**Pipeline:** 8-stage generation with QA validation

**Output:** Production-ready deliverables with validation guarantees

### 8 Deliverables Generated

1. **Landing Page** — Registration page with speaker bio, agenda, CTA
2. **Email Sequence** — 5-email series (invitation → reminder → replay)
3. **Run-of-Show** — Technical checklist for production team
4. **Speaker Checklist** — Prep guide for presenters
5. **Social Posts** — Platform-specific content (LinkedIn, Twitter, Facebook)
6. **Testimonial Template** — Post-event feedback collection
7. **Follow-Up Email** — Replay + resources
8. **QA Report** — Validation summary with issue categorization

### QA Validation System

**4-Category Issue Classification:**
- **Settings Required** — Operator-configurable fields (CTAs, registration links)
- **Input Missing** — Project metadata needed (client name, speaker bio)
- **Model Uncertain** — Content AI couldn't determine
- **Bugs** — System errors (filtered from operator view)

**Canonical Placeholder Normalization:**
- Converts `[INSERT X]`, `{{X}}`, `[TBD]` → `[[MISSING:X]]`
- Enables consistent search/filtering across deliverables

**Readiness Scoring:**
- 0-100% completion score
- Pass/fail gate for export
- Blocking reasons surfaced with fix routes

**Result:** No broken deliverables ship. Operator sees actionable issues with clear fix paths.

---

## Portfolio Analysis

> **For Recruiters & Hiring Managers**

### What This Project Demonstrates

#### 1. Systems Architecture Thinking

**Multi-Stage Pipeline Design:**
- 8 independent deliverable generators
- Central orchestrator coordinates execution
- Shared schema validation (Zod)
- WR1-WR9 artifact system (Work Results 1-9)
- QA validation as first-class system component

**Why this matters:** Most developers build features. This shows ability to design complete systems with validation, error handling, and orchestration.

#### 2. Production-Quality TypeScript

**Code Quality:**
- 115 TypeScript files with 100% type coverage
- Zod schemas for runtime validation
- Strict mode enabled
- No `any` types in core logic
- Interface-driven design

**Patterns Used:**
- Factory pattern (deliverable generators)
- Observer pattern (pipeline events)
- Repository pattern (Supabase integration)
- State management (Zustand)

**Why this matters:** Proves ability to write enterprise-grade code, not just prototypes.

#### 3. Database Design & Integration

**Supabase Integration:**
- Project data model (settings, metadata, deliverables)
- Real-time sync for collaborative editing
- Row-level security policies
- Optimistic UI updates
- Error recovery patterns

**Why this matters:** Shows full-stack capability, not just frontend work.

#### 4. AI Pipeline Orchestration

**Sophisticated AI Integration:**
- Multi-model strategy (different models for different tasks)
- Structured output validation (JSON schemas enforced)
- Context injection (project metadata → prompts)
- Cost tracking per deliverable
- Retry logic with exponential backoff

**Why this matters:** Beyond basic "call ChatGPT" — shows understanding of production AI systems.

#### 5. Error Handling & Validation

**Comprehensive QA System:**
- Issue source classification (4 categories)
- Placeholder detection and normalization
- Validation error aggregation
- Operator-friendly issue translation
- Fix path routing (deep links to resolution UI)

**Why this matters:** Production systems must handle errors gracefully. This shows maturity beyond "happy path" coding.

#### 6. Document Generation

**Export System:**
- .docx generation (formatted documents)
- ZIP packaging for client delivery
- Template engine for dynamic content
- Sanitized output (no internal metadata exposed)
- Export history tracking

**Why this matters:** Shows ability to integrate with external formats, not just web UIs.

### For AI Strategy Manager / Systems Architect Roles

**Most candidates show ONE:**
- Frontend work (but no backend/database)
- AI integration (but no validation/error handling)
- Feature building (but no system design)

**This project shows ALL:**
- ✅ Full-stack architecture (React → Supabase)
- ✅ Systems thinking (pipeline orchestration, QA validation)
- ✅ Production-quality code (TypeScript, Zod, patterns)
- ✅ AI sophistication (multi-model, structured outputs, cost tracking)
- ✅ Database design (Supabase schema, security policies)
- ✅ Error handling (4-category classification, fix routing)
- ✅ Document generation (export system, client packaging)

**That's enterprise software engineering.**

### Interview Talking Points

**2-Minute Story:**

> "I built WebinarStudio to solve a real problem: event marketers spend 10-20 hours after each webinar manually creating collateral—landing pages, emails, checklists, social posts.
>
> This isn't a simple AI wrapper. It's a complete content pipeline with 8 deliverable generators, a QA validation system that categorizes issues into 4 types, and a readiness scoring system that prevents broken content from shipping.
>
> Architecturally, it's React + TypeScript with Supabase backend, Zod schema validation, and a multi-stage pipeline orchestrator. The QA system classifies issues as Settings Required, Input Missing, or Model Uncertain—operators see actionable fixes, not generic errors.
>
> For AI Strategy Manager roles, this demonstrates systems thinking. I didn't just build features—I designed a validation layer, an orchestration system, and an error-handling strategy. That's what production AI systems require."

**Key Stats:**
- 115 TypeScript files (~1.5MB source code)
- 8 deliverable generators (landing page, emails, run-of-show, etc.)
- 4-category QA validation system
- Supabase backend integration
- Multi-stage pipeline orchestrator
- Document export (.docx + ZIP packaging)

**Technical Highlights:**
- **Pipeline Orchestration** — Central coordinator for 8 generators
- **QA Validation System** — 4-category issue classification with fix routing
- **Schema Validation** — Zod schemas for runtime type safety
- **Error Recovery** — Retry logic, exponential backoff, graceful degradation
- **Document Generation** — .docx export with template engine

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript** — Type-safe component architecture
- **Vite** — Lightning-fast dev/build
- **React Router** — Multi-page navigation
- **Tailwind CSS** — Utility-first styling
- **Lucide React** — Icon library

### State & Validation
- **Zustand** — Lightweight state management
- **Zod** — Runtime schema validation
- **LocalStorage** — Client-side persistence

### Backend & Database
- **Supabase** — PostgreSQL + real-time + auth
- **Row-level security** — Data access policies
- **Real-time subscriptions** — Collaborative editing

### Document Generation
- **docx** — .docx file creation
- **file-saver** — Client-side file downloads
- **ZIP packaging** — Client deliverable bundling

### AI Integration
- **Multi-model strategy** — Different models for different tasks
- **Structured outputs** — JSON schema validation
- **Cost tracking** — Per-deliverable spend monitoring
- **Retry logic** — Exponential backoff on failures

### Code Quality
- **TypeScript strict mode** — 100% type coverage
- **ESLint** — Code style enforcement
- **Component-based architecture** — Modular, reusable
- **Interface-driven design** — Abstract contracts

---

## System Architecture

### Pipeline Flow

```
Input (Transcript + Metadata)
  ↓
Stage 1: Project Validation
  ↓
Stage 2-9: Deliverable Generation (WR1-WR8)
  ├── Landing Page (WR1)
  ├── Email Sequence (WR2)
  ├── Run-of-Show (WR3)
  ├── Speaker Checklist (WR4)
  ├── Social Posts (WR5)
  ├── Testimonial Template (WR6)
  ├── Follow-Up Email (WR7)
  └── Proof Vault (WR8)
  ↓
Stage 10: QA Validation (WR9)
  ├── Issue Classification (4 categories)
  ├── Placeholder Normalization
  ├── Readiness Scoring (0-100%)
  └── Fix Path Routing
  ↓
Export (Client ZIP Package)
```

### Database Schema (Simplified)

```typescript
Projects
  ├── id, name, client_name, speaker_name
  ├── settings (CTAs, links, branding)
  ├── metadata (date, time, duration)
  └── status (draft, in_progress, ready, exported)

Deliverables (WR1-WR8)
  ├── project_id
  ├── type (landing_page, email_sequence, etc.)
  ├── content (structured JSON)
  ├── validation_status
  └── updated_at

QA_Reports (WR9)
  ├── project_id
  ├── readiness_score (0-100)
  ├── pass (boolean)
  ├── issues (categorized by source)
  └── recommended_actions
```

### QA Validation Logic

```typescript
Issue Classification Priority:
1. BUG → Undefined refs, malformed IDs (hidden from operators)
2. SETTINGS_REQUIRED → Operator-configurable (CTAs, links)
3. INPUT_MISSING → Project metadata (client name, speaker bio)
4. MODEL_UNCERTAIN → Content AI couldn't determine

Placeholder Normalization:
  [INSERT X] → [[MISSING:X]]
  {{X}} → [[MISSING:X]]
  [TBD] → [[MISSING:TBD]]
  
Readiness Score Formula:
  (Total Fields - Missing Fields) / Total Fields * 100
```

---

## Project Structure

```
src/
├── webinarrev_v1/
│   ├── contracts/
│   │   └── schemas.ts           # Zod schemas (WR1-WR9)
│   ├── pipeline/
│   │   ├── orchestrator.ts      # Central pipeline coordinator
│   │   ├── generators/          # 8 deliverable generators
│   │   └── validators/          # QA validation logic
│   ├── utils/
│   │   ├── qaSourceTagger.ts    # 4-category classification
│   │   └── placeholderNormalizer.ts  # Canonical format
│   ├── ui/
│   │   ├── tabs/                # QA Export, Settings, etc.
│   │   ├── components/          # Reusable UI components
│   │   └── utils/
│   │       └── translateIssue.ts  # Operator-friendly messages
│   └── supabase/
│       ├── client.ts            # Supabase setup
│       ├── projects.ts          # Project CRUD
│       └── deliverables.ts      # Deliverable CRUD
├── App.tsx                       # Root component
├── main.tsx                      # Entry point
└── vite.config.ts               # Build config
```

---

## Why This Architecture?

### Supabase Over Custom Backend
**Decision:** Supabase (managed PostgreSQL) instead of custom Node.js API

**Why:**
- ✅ Real-time subscriptions (collaborative editing)
- ✅ Row-level security (data access policies)
- ✅ Auto-generated API (no boilerplate)
- ✅ Built-in auth
- ✅ Fast development velocity

**Tradeoff:** Vendor lock-in (acceptable for MVP, migratable later)

### Zod for Runtime Validation
**Decision:** Zod schemas for all deliverables and validation

**Why:**
- ✅ TypeScript types + runtime validation (single source of truth)
- ✅ Composable schemas (DRY principle)
- ✅ Clear error messages
- ✅ Schema evolution support

### Multi-Model AI Strategy
**Decision:** Different AI models for different deliverable types

**Why:**
- ✅ Cost optimization (cheap models for simple tasks)
- ✅ Quality optimization (expensive models for complex content)
- ✅ Redundancy (fallback if one model fails)

### 4-Category QA System
**Decision:** Classify issues as BUG, SETTINGS_REQUIRED, INPUT_MISSING, MODEL_UNCERTAIN

**Why:**
- ✅ Operators see actionable items (not generic errors)
- ✅ Bugs hidden from UI (developer diagnostics only)
- ✅ Clear fix paths (route to Settings vs. Intake)
- ✅ Prioritization (must-fix vs. review)

---

## Milestones Completed

### ✅ Milestone 1: QA Source Tagging (Complete)
- 4-category issue classification
- Placeholder normalization
- Structured issue translation
- UI grouping by source
- WR9 storage with historical metrics

### ✅ Milestone 3: System Hardening (Complete)
- Error recovery patterns
- Retry logic with exponential backoff
- Graceful degradation
- Input validation at all boundaries

### 🚧 Roadmap
- Input quality pre-flight checks
- Enhanced proof vault with source citations
- Crosslink validation & auto-repair
- Progressive disclosure wizard replacement

---

## Quick Start

```bash
git clone https://github.com/IrvinCruzAI/WebinarStudio.git
cd WebinarStudio
npm install
npm run dev
```

**Environment Setup:**
Create `.env` with Supabase credentials:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**First Run:**
1. Create project (Settings tab)
2. Add webinar metadata (client, speaker, date)
3. Configure settings (CTAs, registration links)
4. Generate deliverables (Pipeline tab)
5. Review QA report (QA Export tab)
6. Export client package (ZIP download)

---

## About FutureCrafters

WebinarStudio is a production system from FutureCrafters' portfolio of AI-powered business tools.

**More Projects:**
- [NewsGen AI](https://github.com/IrvinCruzAI/AI_News_Generator) — News-to-article generator (75% cost optimized)
- [Marketing Dashboard](https://github.com/IrvinCruzAI/Marketing_Dashboard) — 6 AI marketing generators with business context engine
- Rory — AI content engine with custom voice modeling
- Nexus — LinkedIn network intelligence

**Services:**
- AI Exploration Session ($500)
- Paid Diagnostic ($1,500)
- Control Layer Sprint ($5,000)
- FutureCrafters Labs ($2K-6K/mo)

### Get In Touch

**Portfolio/Hiring:**
- LinkedIn: [linkedin.com/in/irvincruzrodriguez](https://linkedin.com/in/irvincruzrodriguez)
- Website: [irvincruz.com](https://irvincruz.com)
- Email: irvin@futurecrafters.ai

**Product/Business:**
- 📞 [Book consultation](https://calendar.app.google/5of8AAhCW2FVV2Eg7)
- 📧 hello@futurecrafters.ai
- 🌐 [futurecrafters.ai](https://futurecrafters.ai)

---

## Project Stats

| Metric | Value |
|--------|-------|
| TypeScript files | 115 |
| Source code | 1.5MB |
| Deliverable types | 8 |
| QA categories | 4 |
| Pipeline stages | 10 |
| Zod schemas | 20+ |

---

**For recruiters:** Demonstrates enterprise systems architecture—pipeline orchestration, QA validation, database design, and production-quality TypeScript.

---

*A FutureCrafters Production System • Built by [Irvin Cruz](https://irvincruz.com) ☀️*  
*Last Updated: February 2026*
