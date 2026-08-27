# Design Document (Design.md)

## Project Title
**MindForge: Spaced Repetition Card Battler**

---

## 1. Visual Theme & Aesthetic Concept
MindForge combines a modern dark aesthetic with a gamified RPG card battler feel. The design is minimal, clean, and focused on high readability so users can study flashcards without visual clutter.

- **Theme Style**: Clean Dark Mode with soft rounded corners and subtle glowing accent highlights.
- **Visual Goal**: Make active recall study sessions feel like a tactical, rewarding RPG dungeon battle.

---

## 2. Color Palette & Typography

### Color Palette
- **Background**: Deep Slate (`#0F172A`)
- **Card & Panel Containers**: Dark Glass Slate (`#1E2D3D`)
- **Primary Accent / Easy Attack**: Coral Orange (`#FF5A36`)
- **Secondary Accent / Player Health**: Soft Emerald (`#10B981`)
- **Monster Health & Fumbles**: Crimson Red (`#EF4444`)
- **Gold & Streaks**: Amber Gold (`#F59E0B`)
- **Body & Prompt Text**: Off-white Ivory (`#F8F6F0`)

### Typography
- **Headings & RPG Labels**: `Outfit` / `Syne` (Clean, modern rounded font)
- **UI & Flashcard Body**: `Inter` / `Outfit` (Highly legible sans-serif)
- **Code Snippets & Math**: `Fira Code` (Monospace with syntax highlighting & KaTeX math support)

---

## 3. Screen Layouts & User Interfaces

### 3.1 Battle Arena
- **Header**: Displays player level, current HP meter, streak counter, and gold balance.
- **Monster Encounter**: Displays enemy sprite, monster name, level, and dynamic HP bar.
- **Active Flashcard Frame**: Large 3D flippable card presenting the front prompt, with spacebar shortcut to reveal the answer.
- **Recall Action Buttons**: 4 color-coded grading choices (`1: Again`, `2: Hard`, `3: Good`, `4: Easy`) displaying damage previews and keyboard shortcuts.

### 3.2 Deck Manager
- **Deck Selection Grid**: Displays active study decks with due card badges, total cards count, tag chips, and progress bars.
- **Card Editor**: Split-pane Markdown editor with live preview for creating and updating flashcards.
- **Bulk Import/Export**: Quick drawer for JSON deck backup and sharing.

### 3.3 Analytics & Player Profile
- **Overview Cards**: Displays 30-day retention percentage, streak counter, and total cards mastered.
- **Forecast Chart**: Displays upcoming review workload over the next 7 days.
- **RPG Gear & Inventory**: Displays equipped relics (e.g. Aegis Shield absorbing mistakes) and health potions.

---

## 4. Key Micro-Animations & Interaction FX
- **3D Card Flip**: Smooth 180-degree flip transition when revealing card answers.
- **Combat Hit FX**: Floating damage text numbers (`-50 DMG!`, `CRITICAL 90!`) popping up over monster and player portraits.
- **Fumble Shake**: Subtle screen shake when a recall fumble ("Again") occurs.
- **Victory Celebrations**: Confetti particle explosion upon clearing due queues and defeating monsters.

---

## 5. Technology Stack Summary
- **Frontend Framework**: React 18 & TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Local Database & Offline Storage**: Dexie.js (IndexedDB)
- **State Management**: Zustand
- **Formatting**: PrismJS (Code syntax highlighting) & KaTeX (LaTeX math equations)
