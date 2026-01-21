# Script Mode Implementation Complete

## Overview
Script Mode transforms the Framework Builder into a linear, readable webinar script view that presenters can use directly. It's a derived view only - no new deliverables, no schema changes, and WR2 remains the single source of truth.

## Files Created

### Utilities
- `/src/webinarrev_v1/utils/timestampComputer.ts` - Computes running timestamps from WR2/WR6
- `/src/webinarrev_v1/utils/stageDirectionsFormatter.ts` - Formats stage directions from block fields

### UI Components
- `/src/webinarrev_v1/ui/components/InlineMissingInfoCallout.tsx` - Friendly placeholder callouts
- `/src/webinarrev_v1/ui/components/ScriptBlockCard.tsx` - Individual block renderer for script view
- `/src/webinarrev_v1/ui/components/ScriptModeView.tsx` - Main script view container

### Export
- `/src/webinarrev_v1/export/scriptMarkdownGenerator.ts` - Clean markdown export generator

## Files Modified

- `/src/webinarrev_v1/ui/tabs/FrameworkBuilderTab.tsx` - Added Board/Script mode toggle

## UI Features

### Mode Toggle
Located in Framework Builder header, next to Regenerate button:
- **Board** button (shows existing kanban board view)
- **Script** button (shows new linear script view)

### Script View Features
1. **Jump Navigation** - Sidebar with B01-B21 for quick block access
2. **Search** - Filter and highlight text across all blocks
3. **Copy Script** - One-click copy to clipboard with clean markdown
4. **Download Script** - Export as .md file
5. **Edit Integration** - Click "Edit Block" opens existing BlockDetailSlideout
6. **Timestamp Display** - Shows computed timestamps from WR6 or WR2
7. **Missing Info Detection** - Inline callouts with "Fix" buttons that route to correct tab

### Script Format (per block)

Each block displays:
- **Header**: Block ID, title, phase badge, timebox, timestamp
- **What to Say**: Rendered markdown from talk_track_md
- **Stage Directions**: Human-readable formatting of purpose + transitions
- **Proof Points**: Bulleted list if present
- **Objections to Address**: Bulleted list if present
- **Transition**: Single line exit transition
- **Technical Details**: Collapsible section with raw metadata

## Sample Markdown Output

```markdown
# Webinar Script: My Webinar Project

Generated on 1/21/2026

---

## Table of Contents

- [B01: Opening Hook](#b01-opening-hook)
- [B02: The Big Outcome](#b02-the-big-outcome)
...

---

## B01: Opening Hook

**Phase:** Beginning | **Duration:** 3 min | **Timestamp:** 0:00 - 3:00

### What to Say

Welcome everyone! I'm thrilled you're here today. Over the next 60 minutes, we're going to dive deep into the exact framework that helped our clients achieve [specific outcome].

By the end of this session, you'll walk away with three actionable strategies you can implement immediately.

### Stage Directions

**Purpose:** Capture attention and set clear expectations for the session

**Enter:** Start with high energy and genuine enthusiasm

**Exit:** Smoothly transition into agenda overview

### Proof Points

- Client success story from Sarah J.
- Case study showing 3x revenue increase in 90 days

---

## B02: The Big Outcome

**Phase:** Beginning | **Duration:** 3 min | **Timestamp:** 3:00 - 6:00

### What to Say

Here's what we're going to accomplish today. By the end of this webinar, you'll have a complete understanding of how to [main transformation].

You'll see exactly how [mechanism] works, why it's more effective than traditional approaches, and how to customize it for your specific situation.

### Stage Directions

**Purpose:** Define the transformation attendees will achieve

**Enter:** Build momentum from the opening hook

**Exit:** Transition into introducing the core methodology

---

```

## Source of Truth Rules

✅ Content order: WR2.blocks in block_id order (B01-B21)
✅ Per-block timebox: WR2.timebox_minutes always displayed
✅ Timestamps: Computed from WR6 timeline if available, else from WR2 cumulative timeboxes
✅ No raw field paths or validation keys shown in Script Mode
✅ All edits write to WR2 only via existing BlockDetailSlideout

## Edge Cases Handled

- Missing blocks: Shows error banner with list of missing block IDs
- Malformed WR2: Validates 21 blocks present before rendering
- WR6 timeline reconciliation failure: Falls back to WR2 silently with info notice
- Placeholder tokens: Translates to friendly callouts like "Missing: Registration link"
- Search with no results: Shows helpful empty state

## Export Behavior

- **Copy Script**: Copies clean markdown to clipboard (no internal fields)
- **Download Script**: Saves .md file with project name
- **Existing ZIP Export**: Unchanged - Script Mode adds operator convenience only

## Integration

- Clicking "Edit Block" opens existing BlockDetailSlideout
- Changes save to WR2 and Script Mode updates immediately (reactive)
- "Fix" buttons in missing info callouts route to Project Setup or relevant tab
- Search highlights matching text in yellow
- Jump navigation scrolls smoothly to selected block

## Acceptance Criteria Met

✅ Script Mode renders B01-B21 end-to-end with no missing blocks
✅ Copy produces readable markdown with no internal keys/paths
✅ Editing any block updates Script Mode immediately
✅ No new deliverables created
✅ No schema changes made
✅ No export ZIP regressions
✅ Timestamps compute correctly from WR6 or WR2 fallback
✅ Missing info shows friendly callouts with fix actions

## Technical Notes

- Uses react-markdown for talk_track_md rendering
- Reuses existing translateIssue utility for placeholder detection
- Leverages existing BlockDetailSlideout for all edits
- Timestamps support fractional minutes (e.g., 3.5 minutes = 3:30)
- Search is case-insensitive and searches all block content
- Jump navigation highlights active block in sidebar
- Script export sanitizes all placeholder tokens to [Missing: X] format

---

**Status**: ✅ Complete and tested
**Build**: ✅ Passing
**Breaking Changes**: None
