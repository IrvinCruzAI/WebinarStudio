# WebinarRev V1 Specification Lock

**Version:** 1.0
**Last Updated:** 2026-01-19
**Status:** LOCKED - Do not modify without approval

## Overview

WebinarRev V1 transforms the webinar generation system from a 5-deliverable asset generator into a framework-first construction system powered by the 21-block Vernon Framework.

## Non-Negotiables

1. **Preserve legacy app behavior** - No breaking changes to existing functionality
2. **All V1 code lives under `src/webinarrev_v1/`** - Complete namespace isolation
3. **Feature flag: `VITE_WEBINARREV_V1_ENABLED`** (default false)
4. **Do not modify existing database tables** - Legacy tables remain unchanged
5. **IndexedDB for content; localStorage for metadata only** - Large content stays out of localStorage
6. **Contracts are locked** - Zod `.strict()` everywhere; snake_case only
7. **`validated=true` means schema + crosslinks pass** - Never lie about validation status
8. **Export gating is strict** - Client exports sanitized; WR9 excluded from client packages
9. **Version constant: V1 = 1** - All artifacts use version=1

## Deliverables (WR1-WR9)

### PREFLIGHT
Readiness check with risk flags enum. Blocks pipeline when status='blocked'.

**Risk Flags Enum:**
- `offer_missing`
- `icp_missing`
- `proof_missing`
- `cta_unclear`
- `mechanism_unclear`

### WR1: Client Profile Dossier
Parsed intake + cleaned transcript + structured notes + themes + speaker insights

### WR2: Framework 21 Blocks
**THE ENGINE.** 21 blocks (B01-B21) with strict 7/7/7 phase mapping:
- Beginning: B01-B07
- Middle: B08-B14
- End: B15-B21

Each block contains:
- block_id (B01-B21, exact)
- phase (beginning/middle/end)
- title, purpose
- talk_track_md, speaker_notes_md
- transition_in, transition_out
- timebox_minutes (1-60)
- proof_insertion_points[]
- objections_handled[]

### WR3: Landing Page Copy
Headlines, bullets, agenda preview, proof blocks, speaker bio, CTA blocks, FAQ, who it's for/not for

**Critical Field:** `cta_block.link_placeholder` (export-blocking)

### WR4: Email Sequence
8-10 emails with IDs E01-E10
- send_rules with placeholders (from_name, from_email, reply_to)
- Each email: id, timing, subject, preview_text, body_markdown, cta

**Critical Fields:** from_email_placeholder, from_name_placeholder

### WR5: Social Posts
6-18 posts with IDs S01-S18
- LinkedIn posts (hook, body, cta_line)
- X/Twitter posts
- Last chance blurbs

### WR6: Run-of-Show
Timeline with crosslinks to WR2 block_ids
- total_duration_minutes
- timeline segments with start_minute, end_minute, block_id reference
- **Validation:** block_id must exist in WR2, start < end, max(end) <= duration

### WR7: Execution Checklist
Pre/live/post webinar tasks with IDs:
- CL_pre_### (pre-webinar tasks)
- CL_live_### (during webinar tasks)
- CL_post_### (post-webinar tasks)

### WR8: Gamma Deck Prompt
AI prompt for generating presentation deck in Gamma

### WR9: Deterministic QA Readiness Report
**INTERNAL ONLY - excluded from client exports**
- readiness_score (computed deterministically)
- pass (score >= 70)
- blocking_reasons[]
- validation_results (all WR1-WR8)
- placeholder_scan results
- recommended_next_actions (AI-generated suggestions only)

## ID Rules

- `project_id`: `wrproj_<uuid>`
- `run_id`: `run_<uuid>`
- `deliverable_id`: `PREFLIGHT | WR1 | WR2 | WR3 | WR4 | WR5 | WR6 | WR7 | WR8 | WR9`
- `artifact_id`: `${project_id}:${run_id}:${deliverable_id}:v1`
- `block_id`: B01-B21 (exactly 21, unique, sequential)
- `email_id`: E01-E10 (8-10 emails)
- `social_id`: S01-S18 (6-18 posts)
- `checklist_id`: CL_pre_###, CL_live_###, CL_post_###

## CTA Enum

**Locked values:**
- `book_call`
- `buy_now`
- `hybrid`

Note: "apply" is a UI alias for "book_call" only

## Placeholder Taxonomy

**Critical Placeholders (export-blocking):**
- `link_placeholder`
- `from_email_placeholder`
- `from_name_placeholder`
- `reply_to_placeholder`
- WR3 proof_blocks with needs_source=true

**Non-critical Placeholders (warning only):**
- `{{...}}` template syntax
- `[TBD]`
- `[INSERT ...]`
- Generic placeholder text

## Validation Rules

### Schema Validation
- All schemas enforce `.strict()` - no extra fields allowed
- All field names use snake_case (never camelCase)
- Required fields must be present and non-empty where specified

### Crosslink Validation
- **WR6 → WR2:** Every timeline block_id must exist in WR2.blocks[]
- **WR6 time bounds:** start_minute < end_minute, max(end_minute) <= total_duration_minutes
- **WR4 email IDs:** Must match E01-E10 pattern, count 8-10, unique
- **WR5 social IDs:** Must match S01-S18 pattern, count 6-18, unique
- **WR7 checklist IDs:** Must match CL_pre_###, CL_live_###, CL_post_### patterns, unique

### Dependency Depth
- **WR6 requires WR2 to be VALID** (not just present)
- Missing dependency = hard fail
- Schema failure blocks crosslink validation (prevents runtime crashes)

### Validation Truthfulness
- `validated=true` ONLY when both schema AND crosslinks pass
- Edit invalidates until revalidation completes
- Never trust metadata - always recompute for exports

## Readiness Scoring (Deterministic)

```
Starting score: 100

Penalties:
- Schema failure: -15 per deliverable
- Crosslink failure: -20 per deliverable
- Critical placeholder: -25 each
- Non-critical placeholder: -5 each

Final score: max(0, score)
Pass threshold: >= 70
```

## Patch List (Complete 39 Patches)

### A) Safety + Isolation
1. Feature flag routing: VITE_WEBINARREV_V1_ENABLED (default false)
2. Namespace isolation: all V1 under src/webinarrev_v1/, legacy untouched
3. Do not migrate DB tables

### B) IDs + Enums
4. Canonical IDs: project_id, run_id, deliverable IDs WR1–WR9
5. block_id strict B01–B21 + phase mapping 7/7/7
6. email_id E01–E10 + count 8–10
7. social_id S01–S18 + count 6–18
8. checklist item IDs: CL_pre_### / CL_live_### / CL_post_###
9. CTA enum locked: "book_call" | "buy_now" | "hybrid"
10. Version policy: V1 constant version = 1

### C) Storage Architecture
11. Inputs in IndexedDB (no localStorage transcripts)
12. Artifacts in IndexedDB (no localStorage artifact JSON)
13. localStorage metadata only (wrv1_projects)
14. Atomic write discipline (IDB success → then metadata pointer update)
15. Storage-missing poisoning (pointer exists but content missing ⇒ validated=false)

### D) Contracts and Validation
16. Zod .strict() everywhere; snake_case only
17. Preflight dual schema: AI schema (no risk_flags) + stored schema (with enum risk_flags)
18. Risk flags enum locked
19. Unified validateDeliverable() entry point (schema + crosslink merged)
20. "validated=true" only when schema + crosslink pass

### E) Crosslinks
21. WR2 blocks: count=21, IDs exact, unique, phase enforced
22. WR6 timeline refs must exist in WR2
23. WR6 time bounds: start<end, max(end) ≤ duration
24. WR4/WR5 ID range + uniqueness rules
25. WR7 item ID formats and uniqueness rules
26. Crosslink dependency enforcement: WR6 requires WR2 present
27. Dependency depth: WR6 requires WR2 to be valid, not merely present
28. Schema-guard: never run crosslink logic if schema failed

### F) Placeholders + Readiness
29. Placeholder taxonomy (link_placeholder, from_email_placeholder, {{, TBD, etc.)
30. WR3 proof_blocks needs_source=true counts as placeholder
31. WR6 critical scan scope only client-visible fields
32. Placeholder return shape locked: {total_count, critical_count, locations[]}
33. Placeholder scanner signatures include artifact_id context
34. Placeholder scanning filters to WR1–WR8 only (exclude PREFLIGHT/WR9)

### G) Pipeline Reliability
35. Concurrency max 2 + stable ordering batches
36. Retry stability: retries happen "in place"
37. Cancel support + AbortController aborts in-flight calls
38. Repair loop bounded + repair prompt truncation
39. Repair prompts do not re-embed transcript

## Pipeline Stages

```
Stage 1: PREFLIGHT (must pass to continue)
Stage 2: WR1
Stage 3: WR2
Stage 4: WR3, WR4, WR5 (parallel, max 2 concurrent)
Stage 5: WR6, WR7, WR8 (parallel, max 2 concurrent, requires WR2)
Stage 6: WR9 (deterministic, requires all WR1-WR8)
```

## Storage Schema

### IndexedDB: `wrv1_storage`

**Store: transcripts**
```typescript
{
  key: project_id,
  value: {
    intake_transcript?: string,
    build_transcript: string,
    created_at: number // epoch ms
  }
}
```

**Store: artifacts**
```typescript
{
  key: artifact_id, // ${project_id}:${run_id}:${deliverable_id}:v1
  value: {
    content: unknown,
    validated: boolean,
    generated_at: number, // epoch ms
    edited_at?: number // epoch ms
  }
}
```

### localStorage: `wrv1_projects`

```typescript
{
  project_id: string,
  run_id: string,
  title: string,
  status: 'preflight_blocked' | 'generating' | 'review' | 'ready' | 'failed',
  created_at: number,
  updated_at: number,
  settings: {
    cta_mode: 'book_call' | 'buy_now' | 'hybrid',
    audience_temperature: 'cold' | 'warm' | 'hot',
    webinar_length_minutes: number
  },
  deliverable_pointers: {
    [deliverable_id]: {
      artifact_id: string,
      validated: boolean,
      generated_at: number,
      edited_at?: number
    }
  }
}
```

## Export Rules

### Client Export (Gated)
- Only enabled when `computeExportEligibility()` returns canExport=true
- Must sanitize all content (allowlist approach)
- Exclude WR9 completely
- Remove all internal fields: qa, meta, validated, generated_at, edited_at
- Formats: Sanitized JSON, DOCX, ZIP

### Operator Export (Always Available)
- Includes WR9
- Includes all internal fields
- Debug/internal use only
- Formats: Raw JSON, DOCX with metadata

## Acceptance Tests

1. ✅ Preflight blocks pipeline when status = 'blocked'
2. ✅ WR2 contains exactly 21 blocks with correct phase mapping (7/7/7)
3. ✅ WR6 timeline block_id references must exist in valid WR2
4. ✅ Editing any deliverable triggers revalidation + placeholder rescan
5. ✅ Client export only enabled when fresh eligibility passes
6. ✅ WR9 excluded from client ZIP
7. ✅ No internal fields in client export (no qa, meta, validated, timestamps)
8. ✅ validated=true only when schema + crosslinks pass
9. ✅ Max 2 concurrent AI calls enforced
10. ✅ Large transcripts stored in IndexedDB (not localStorage)
11. ✅ Atomic writes: IDB success before metadata update
12. ✅ Missing content poisons validation status

## Do Not Invent Fields

**CRITICAL RULE:** If a field is not explicitly defined in the schemas below, it does NOT exist.

Do not add:
- "helpful" extra fields
- "convenience" properties
- "metadata" that's not specified
- Alternative naming (stick to exact snake_case names)

This prevents schema drift and validation failures.

## Anti-Patterns to Avoid

1. ❌ Re-embedding transcripts in repair prompts
2. ❌ Using localStorage for large content
3. ❌ Trusting metadata without IDB verification
4. ❌ Setting validated=true before crosslink check
5. ❌ Inventing new placeholder patterns
6. ❌ Running crosslink validation when schema failed
7. ❌ Including WR9 in client exports
8. ❌ More than 2 concurrent AI calls
9. ❌ Modifying legacy database tables
10. ❌ Breaking feature flag isolation

## Success Criteria

WebinarRev V1 is "done" when:

1. ✅ V1 produces WR1–WR9 with deterministic QA and readiness scoring
2. ✅ 21-block board is central UX (7/7/7, jump-to-block navigation)
3. ✅ Client export produces clean ZIP of DOCX with zero internal leakage
4. ✅ Cancel/retry/parsing robustness prevents stuck jobs
5. ✅ All 39 patches implemented and tested
6. ✅ Legacy app continues working unchanged with flag off
7. ✅ Export gating prevents shipping incomplete/invalid packages
8. ✅ Placeholder governance catches critical missing values
9. ✅ Edit workflow maintains validation truthfulness
10. ✅ Proof vault + Framework21 board are centerpiece features

---

**END OF SPECIFICATION**

This document is the single source of truth for WebinarRev V1 implementation.
Do not deviate without explicit approval.
