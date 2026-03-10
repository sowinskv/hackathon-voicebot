# Bot Builder UI Redesign - Notion-Like Experience

**Date:** 2026-03-10
**Branch:** `bot-builder-ui-improvements`
**Goal:** Transform bot-builder into a clean, Notion-like interface with better UX and visual design

---

## 🎨 Design Inspiration

Based on `/ui-inspo/` and `VOICE_APP_PLAN.md`:

### Core Design Principles
- **Clean, minimal aesthetic** (Notion-style)
- **Architectural grid** with numbered sections
- **Document-centric** main content area
- **Editorial typography** - tight dark sans-serif headings
- **Warm, grounded palette** - not sterile white

### Key Design Elements (from VOICE_APP_PLAN.md)
- **Background**: off-white/cream (`#f0ede8`) — warm, not clinical
- **Typography**:
  - Dark sans-serif for headings (tight kerning)
  - Monospace for data/numbers/timestamps
- **Color**: near-monochrome + single accent
  - Primary accent: coral `#e85d3a` OR blue `#2383e2`
- **Layout**:
  - Architectural grid
  - Numbered sections (01, 02, 03)
  - Clear visual hierarchy
- **Cards**: thin borders (`1px`), minimal shadow, structured spacing
- **Animations**: restrained — only functional (no gratuitous motion)

---

## 📐 Current State Analysis

### Current Layout
```
┌─────────────────────────────────────────────────────┐
│ Header: Logo | Bot Name | Buttons                   │
├─────────────────────────────────────────────────────┤
│ Tabs: Create | Prompt | Fields | Flow | Test        │
├─────────────────────────────────────────────────────┤
│                                                       │
│                 Main Content Area                    │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Issues:**
- ❌ Header is cluttered (too many buttons)
- ❌ Tab navigation not intuitive
- ❌ No visual hierarchy
- ❌ Generic styling (standard Tailwind)
- ❌ Hard to understand flow/state
- ❌ "Show advanced" button confusing

---

## 🎯 New Design Concept

### Layout Structure (Notion-style)

```
┌───────┬─────────────────────────────────────────────┐
│       │ Breadcrumb: Workspace / Bots / Bot Name     │
│       ├─────────────────────────────────────────────┤
│       │                                             │
│  S    │                                             │
│  I    │           Main Content Area                 │
│  D    │         (Page-style layout)                 │
│  E    │                                             │
│  B    │                                             │
│  A    │                                             │
│  R    │                                             │
│       │                                             │
│       │                                             │
└───────┴─────────────────────────────────────────────┘
```

### Sidebar Navigation
```
🏠 Home
   └─ All Bots (with status badges)

📁 Templates
   └─ OC Insurance
   └─ Property Damage
   └─ Customer Support

⚙️ Current Bot
   ├─ 📝 Overview
   ├─ 💬 Conversation Setup
   ├─ 🧩 Fields & Data
   ├─ 🔀 Flow Builder
   ├─ 🧪 Testing
   └─ 📊 Analytics

🗑️ Archive
```

### Main Content Area (Page-style)

**Overview Page:**
```
┌─────────────────────────────────────────────────┐
│ 01 / OVERVIEW                       [Edit] [•••]│
│                                                 │
│ OC Damage Report Bot                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                 │
│ Properties                                      │
│ ┌─────────────────────────────────────────────┐│
│ │ Status        ● Draft                       ││
│ │ Language      🇵🇱 Polish                     ││
│ │ Created       2026-03-10 14:32             ││
│ │ Modified      2026-03-10 15:47             ││
│ │ Version       1.0.0                         ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Description                                     │
│ ┌─────────────────────────────────────────────┐│
│ │ Collects information about car insurance   ││
│ │ damage claims (OC - third party liability) ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Quick Actions                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │   Test   │ │ Publish  │ │ Duplicate│       │
│ │   Bot    │ │   Bot    │ │   Bot    │       │
│ └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│ Recent Activity                                 │
│ • 15:47   Field 'location' updated             │
│ • 15:32   Branch added: Property Damage        │
│ • 14:20   Bot created                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Conversation Setup Page:**
```
┌─────────────────────────────────────────────────┐
│ 💬 Conversation Setup                           │
│                                                 │
│ System Prompt                                   │
│ ┌─────────────────────────────────────────────┐│
│ │ You are a professional assistant...         ││
│ │                                             ││
│ │ [Monaco Editor - syntax highlighting]      ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Greeting Message                                │
│ ┌─────────────────────────────────────────────┐│
│ │ Welcome! How can I help you today?          ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Settings                                        │
│ ○ Max conversation duration: [10] minutes      │
│ ○ Enable escalation: ☑                        │
│ ○ Safety warnings threshold: [3]               │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Fields & Data Page:**
```
┌─────────────────────────────────────────────────┐
│ 🧩 Fields & Data Collection                     │
│                                                 │
│ [+ Add Field]                         [Import] │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ 📋 policy_number                  Required  ││
│ │ Type: Text | Validation: ^[A-Z0-9]{6,12}$  ││
│ │ ───────────────────────────────────────     ││
│ │ 📅 incident_date                  Required  ││
│ │ Type: Date | Format: YYYY-MM-DD HH:mm      ││
│ │ ───────────────────────────────────────     ││
│ │ 📍 location                       Required  ││
│ │ Type: Text | No validation                 ││
│ └─────────────────────────────────────────────┘│
│                                                 │
└─────────────────────────────────────────────────┘
```

**Flow Builder Page:**
```
┌─────────────────────────────────────────────────┐
│ 🔀 Flow Builder                      [Fit View] │
│                                                 │
│ ┌─────┬─────────────────────────────────────┐ │
│ │ N   │                                     │ │
│ │ O   │        React Flow Canvas           │ │
│ │ D   │                                     │ │
│ │ E   │   [Visual workflow editor]         │ │
│ │ S   │                                     │ │
│ │     │                                     │ │
│ └─────┴─────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Design System

### Color Palette (Voice-App Aligned)
```css
/* Base colors */
--color-bg-primary: #f0ede8;        /* Warm cream — main background */
--color-bg-secondary: #e8e5e0;      /* Slightly darker cream */
--color-bg-card: #fdfcfa;           /* Off-white for cards */
--color-bg-dark: #1a1a1a;           /* Dark header/sidebar */

/* Text */
--color-text-primary: #1a1a1a;      /* Almost black */
--color-text-secondary: #4a4a4a;    /* Medium gray */
--color-text-tertiary: #787774;     /* Light gray */
--color-text-inverse: #ffffff;      /* White text on dark bg */

/* Borders */
--color-border-light: #e3e2df;      /* Subtle borders */
--color-border-default: #d4d2ce;    /* Default borders */

/* Accents */
--color-accent-primary: #e85d3a;    /* Coral — main CTA */
--color-accent-blue: #2383e2;       /* Notion blue — info */
--color-accent-green: #448361;      /* Success */
--color-accent-amber: #d9730d;      /* Warning */
--color-accent-red: #e03e3e;        /* Error/danger */

/* Status colors */
--color-status-draft: #787774;      /* Gray */
--color-status-published: #448361;  /* Green */
--color-status-archived: #9b9a97;   /* Light gray */

/* Sidebar (dark theme) */
--color-sidebar-bg: #1a1a1a;
--color-sidebar-hover: #2a2a2a;
--color-sidebar-active: #3a3a3a;
--color-sidebar-text: #e8e5e0;
--color-sidebar-text-hover: #ffffff;
```

### Typography (Editorial Style)
```css
/* Font families */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'SF Mono', 'Consolas', 'Monaco', monospace;

/* Headings (tight, architectural) */
--font-title: 700 40px/1.1 var(--font-sans);         /* Tight leading */
--font-heading-1: 600 32px/1.2 var(--font-sans);
--font-heading-2: 600 24px/1.2 var(--font-sans);
--font-heading-3: 600 18px/1.3 var(--font-sans);

/* Section labels (numbered) */
--font-label: 600 11px/1.2 var(--font-mono);         /* 01 / 02 / 03 */
--font-label-spacing: 0.1em;                         /* Letter spacing */

/* Body */
--font-body: 400 16px/1.6 var(--font-sans);
--font-small: 400 14px/1.5 var(--font-sans);
--font-tiny: 400 12px/1.4 var(--font-sans);

/* Data/Numbers (monospace) */
--font-data: 400 14px/1.5 var(--font-mono);          /* Timestamps, IDs */
--font-code: 400 14px/1.5 var(--font-mono);          /* Code blocks */
```

### Spacing
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 24px;
--space-2xl: 32px;
--space-3xl: 48px;
```

### Border Radius
```css
--radius-sm: 3px;
--radius-md: 6px;
--radius-lg: 8px;
```

### Shadows (Minimal)
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06);  /* Very subtle */
```

### Section Labels (Editorial Style)
```
01 / OVERVIEW
02 / CONVERSATION
03 / FIELDS & DATA
04 / FLOW
05 / TESTING
06 / ANALYTICS
```

**Usage:**
- Top-left of each major section
- Monospace font, all caps, letter-spaced
- Light gray color
- Creates architectural grid feeling

---

## 🛠️ Implementation Plan

### Phase 1: Design System Setup
- [ ] Create design tokens file (`/src/styles/tokens.css`)
- [ ] Update Tailwind config with custom theme
- [ ] Create reusable component primitives:
  - [ ] Button variants (primary, secondary, ghost, danger)
  - [ ] Input components (text, textarea, select)
  - [ ] Card component
  - [ ] Badge component
  - [ ] Sidebar components
  - [ ] Page layout components

### Phase 2: Layout Restructure
- [ ] Create new Sidebar component
  - [ ] Navigation tree
  - [ ] Collapsible sections
  - [ ] Active state indicators
  - [ ] Search functionality
- [ ] Create Page layout component
  - [ ] Breadcrumb navigation
  - [ ] Page header with actions
  - [ ] Content container
- [ ] Remove old header/tabs system
- [ ] Implement responsive behavior

### Phase 3: Page Redesigns
- [ ] **Home/Bot List Page**
  - [ ] Grid/table view of bots
  - [ ] Status badges
  - [ ] Quick actions
  - [ ] Search & filters

- [ ] **Bot Overview Page**
  - [ ] Properties display
  - [ ] Description editor
  - [ ] Quick actions cards
  - [ ] Recent activity

- [ ] **Conversation Setup Page**
  - [ ] Monaco editor for system prompt
  - [ ] Greeting message input
  - [ ] Settings panel

- [ ] **Fields & Data Page**
  - [ ] Clean field list
  - [ ] Inline editing
  - [ ] Drag-to-reorder
  - [ ] Better validation UI

- [ ] **Flow Builder Page** (keep mostly same)
  - [ ] Update node styling to match design system
  - [ ] Cleaner toolbar
  - [ ] Better inspector panel

### Phase 4: Polish & Animations
- [ ] Add smooth transitions
- [ ] Hover states
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Keyboard shortcuts (Cmd+K for search)
- [ ] Toast notifications
- [ ] Confirmation modals

### Phase 5: Dark Mode (Optional)
- [ ] Add dark theme tokens
- [ ] Theme toggle
- [ ] Persist preference

---

## 📦 New Components to Build

### Core Layout
```
src/components/Layout/
├── Sidebar.tsx              # Main sidebar
├── SidebarSection.tsx       # Collapsible section
├── SidebarItem.tsx          # Navigation item
├── PageLayout.tsx           # Main page wrapper
├── PageHeader.tsx           # Page title + actions
└── Breadcrumb.tsx           # Navigation breadcrumb
```

### Design System
```
src/components/ui/
├── Button.tsx               # Button variants
├── Input.tsx                # Text input
├── Textarea.tsx             # Multi-line input
├── Select.tsx               # Dropdown
├── Card.tsx                 # Container card
├── Badge.tsx                # Status badge
├── Avatar.tsx               # User avatar
├── Divider.tsx              # Horizontal line
├── Empty.tsx                # Empty state
├── LoadingSpinner.tsx       # Loading indicator
└── Toast.tsx                # Notification
```

### Pages
```
src/pages/
├── Home.tsx                 # Bot list/dashboard
├── BotOverview.tsx          # Bot overview page
├── ConversationSetup.tsx    # System prompt + settings
├── FieldsData.tsx           # Field management
├── FlowBuilder.tsx          # Visual flow editor
├── Testing.tsx              # Test console
└── Analytics.tsx            # Bot analytics
```

---

## 🎯 Success Criteria

- [ ] Matches Notion aesthetic (clean, minimal, professional)
- [ ] Intuitive navigation (no "show advanced" confusion)
- [ ] Clear visual hierarchy
- [ ] Smooth transitions and interactions
- [ ] Responsive (works on tablets)
- [ ] Fast performance (no layout shifts)
- [ ] Accessible (keyboard navigation, ARIA labels)
- [ ] Consistent spacing/sizing throughout
- [ ] All functionality preserved from old UI

---

## 📊 Before/After Comparison

### Before
- Cluttered header with many buttons
- Tab-based navigation (unclear state)
- Generic Tailwind styling
- No clear hierarchy
- Confusing "advanced" toggle

### After
- Clean sidebar navigation
- Page-based structure (like Notion)
- Custom design system
- Clear visual hierarchy
- Intuitive information architecture

---

## 🚀 Next Steps

1. Review this plan
2. Get design approval
3. Start Phase 1: Design System Setup
4. Iterate on feedback
5. Deploy & celebrate! 🎉

**Estimated effort:** 1-2 days for core redesign
