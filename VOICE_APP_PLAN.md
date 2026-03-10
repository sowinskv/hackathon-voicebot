# Voice App — Implementation Plan

> Living document. Update status after every work session.
> Linked from README.md.

---

## Design Direction

Inspired by `ui-inspo/`:

- **Background**: off-white/cream (`#f0ede8`) not pure white — warm, grounded
- **Typography**: tight dark sans-serif headings, monospace for data/numbers/timestamps
- **Color**: near-monochrome with a single accent (coral `#e85d3a` or current blue `#2383e2`)
- **Layout**: architectural grid, numbered sections, clear visual hierarchy
- **Visualizer**: dot-matrix / particle style audio waveform (PlayerZero aesthetic)
- **Cards**: thin borders, minimal shadow, structured spacing
- **Animations**: restrained — only functional (pulse for live, spin for loading)

---

## Current State

| Feature | Status | Notes |
|---|---|---|
| Start/Stop session | ✅ Done | |
| Language toggle EN/PL | ✅ Done | Disabled during active session |
| LiveKit SDK integration | ✅ Done | Hooks wired, needs backend |
| WebSocket transcript feed | ✅ Done | Auto-reconnect logic |
| Transcript display | ✅ Done | Chat bubbles, copy-to-clipboard |
| Session status badge | ✅ Done | All states covered |
| Mic mute toggle | ✅ Done | |
| Escalation button | ✅ Done | |
| `primary-600` color | ✅ Fixed | Matches notion accent blue |
| `btn-warning` class | ✅ Fixed | Amber style |
| **Visual redesign** | ✅ Done | Cream bg, dark header, coral CTA, mono fonts, panel labels |
| Audio visualizer | ⬜ Todo | Dot-matrix mic activity indicator |
| Session timer | ⬜ Todo | Visible countdown / elapsed time |
| Collected data panel | ⬜ Todo | OC slot-filling progress display |
| Post-call satisfaction survey | ⬜ Todo | 5-point scale, shown on `completed` |
| End-of-call next steps | ⬜ Todo | What the user should do after |
| Error retry button | ⬜ Todo | Currently stuck on error state |
| Session limit warning | ⬜ Todo | Alert at 9 min / terminate at 10 |
| Abuse warning counter | ⬜ Todo | 3-strike display before termination |

---

## Work Items

### 1. Visual Redesign
**Priority: High** — affects demo impression

- [ ] Switch body background to `#f0ede8` (warm off-white)
- [ ] Update tailwind config: replace `notion.bg` white with cream, add `accent` coral
- [ ] Header: full-width dark bar (`#1a1a1a`) with white text — architectural feel
- [ ] Cards: thin `1px` borders on cream background, almost no shadow
- [ ] Typography: monospace font for timestamps, data values, counters
- [ ] Numbered section labels (01 / 02 / 03) on each panel — editorial grid style
- [ ] Replace current language toggle emoji flags with clean text pill

---

### 2. Audio Visualizer
**Priority: High** — core "voice app" feel

- [ ] New component `AudioVisualizer.tsx`
- [ ] Use `AnalyserNode` from Web Audio API on the local mic stream
- [ ] Render as dot-matrix bar (5–12 columns of dots, height = amplitude)
- [ ] Show when session is `active`, animate `connecting` state
- [ ] Idle state: flat dots / static line

---

### 3. Session Timer
**Priority: High** — required for 10-min cost limit (bonus B)

- [ ] New component `SessionTimer.tsx`
- [ ] Counts up from 00:00 when session starts
- [ ] Displayed in monospace in the header or controls panel
- [ ] Warning visual at 9:00 (amber)
- [ ] Auto-triggers stop + message at 10:00

---

### 4. Collected Data Panel
**Priority: Medium** — shows bot is working, useful for demo

- [ ] New component `CollectedDataPanel.tsx`
- [ ] Receives structured slot data via WebSocket (`type: 'slot_update'` message)
- [ ] Displays OC damage report fields: policy number, incident date/time, location, damage description, other party, witnesses
- [ ] Empty slots shown as `—`, filled slots shown with value
- [ ] Completeness percentage bar at bottom

---

### 5. Post-Call Satisfaction Survey
**Priority: Medium** — explicitly scored in spec

- [ ] Shown when `sessionState === 'completed'`
- [ ] 5-point scale (1–5 stars or emoji faces)
- [ ] Optional text comment field
- [ ] "Submit" sends to API `POST /sessions/:id/rating`
- [ ] Can be dismissed / skipped

---

### 6. End-of-Call Next Steps
**Priority: Medium** — bonus D requirement

- [ ] Shown alongside/after satisfaction survey on `completed` state
- [ ] Static content for OC damage report scenario: e.g. "Expect a confirmation email within 24h", "Keep your policy number handy", "A consultant will contact you if additional info is needed"
- [ ] Language-aware (EN/PL)

---

### 7. Error State Recovery
**Priority: Low-Medium** — basic UX

- [ ] Add "Try again" button on `error` state in `VoiceControls.tsx`
- [ ] Resets state to `idle` and clears error

---

### 8. Session Limit Warning + Abuse Counter
**Priority: Low** — bonus B/C

- [ ] Warning toast/banner at 9 min remaining
- [ ] Abuse warning counter: small badge showing `1/3`, `2/3` warnings received
- [ ] Driven by WebSocket `type: 'warning'` message from backend

---

## File Map

```
frontend/voice-app/src/
├── App.tsx                        ← session state, layout grid
├── components/
│   ├── VoiceControls.tsx          ← start/stop/mute/escalate
│   ├── TranscriptDisplay.tsx      ← chat bubbles, copy
│   ├── SessionStatus.tsx          ← header badge
│   ├── AudioVisualizer.tsx        ← [TODO] dot-matrix mic viz
│   ├── SessionTimer.tsx           ← [TODO] elapsed/countdown
│   ├── CollectedDataPanel.tsx     ← [TODO] OC slot progress
│   └── SatisfactionSurvey.tsx    ← [TODO] post-call rating
├── hooks/
│   ├── useLiveKit.ts              ← room, mic, audio track
│   ├── useWebSocket.ts            ← transcript + events
│   └── useAudioAnalyser.ts       ← [TODO] Web Audio API levels
├── services/
│   └── api.ts                     ← axios client
└── styles/
    └── globals.css                ← Tailwind + design system
```

---

## Definition of Done (for demo)

- [ ] App loads with warm cream aesthetic matching ui-inspo
- [ ] Mic visualizer reacts visibly when speaking
- [ ] Session timer visible throughout call
- [ ] Transcript updates in real time
- [ ] Escalation switches state and shows clearly in UI
- [ ] On completion: satisfaction survey + next steps shown
- [ ] Works in both EN and PL
- [ ] No broken styles (primary-600, btn-warning — fixed)
