# Product Requirements Document (PRD)

## Project Title
**MindForge: Spaced Repetition Card Battler**

---

## 1. Executive Summary
**MindForge** is an open-source, web-based spaced repetition study tool disguised as a turn-based card battler / deck-building RPG. It replaces the monotonous review loops of traditional flashcard applications (e.g., Anki, Quizlet) with a tactical card combat loop, boosting daily retention and completion consistency through gamified stakes.

---

## 2. Target Audience & Personas
- **The Cramming Student**: Needs structured active recall for exams, languages, or certifications but loses motivation after a few days of raw flashcard drills.
- **The Technical Learner**: Studies computer science concepts, system design, syntax, or interview questions using Markdown/code blocks.
- **The Casual Gamer / Habit Builder**: Motivated by daily streaks, XP progression, cosmetic/card unlocks, and turn-based RPG mechanics.

---

## 3. Core Gameplay & Retention Loop
- **Queue Generation**: At the start of a run, the system pulls the user's due flashcards scheduled by the SM-2 algorithm.
- **Combat Encounter**: An enemy monster appears with HP scaled to the number of due cards.
- **Card Draw & Recall Action**:
  - The game presents the Front (Prompt) of a flashcard.
  - The user attempts active recall and clicks "Reveal".
  - The user rates their recall honesty:
    - **Again (Rating 1)**: Miss / Fumble. Player takes damage; card is reshuffled into the current battle queue; interval resets to 1 day.
    - **Hard (Rating 2)**: Glancing Hit. Low combat damage dealt; interval increases marginally.
    - **Good (Rating 3)**: Solid Strike. Standard combat damage dealt; standard SM-2 interval increase.
    - **Easy (Rating 4)**: Critical Strike. High bonus damage + combo points; optimal SM-2 interval expansion.
- **Encounter Resolution**: Defeating the monster yields gold, XP, and relic/gear loot. Depleting player HP prompts a revival mechanic or run summary without destroying card scheduling data.

---

## 4. Functional Requirements

### 4.1 Deck & Card Management (CRUD)
- **FR-1.1**: Create, Read, Update, and Delete Decks and Flashcards.
- **FR-1.2**: Support rich text: Markdown formatting, code syntax highlighting, and image attachments.
- **FR-1.3**: Tagging system for categorizing cards within decks (e.g., `#algorithms`, `#vocab`, `#kanji`).
- **FR-1.4**: Bulk import/export support for CSV, JSON, and standard `.apkg` (Anki) files.

### 4.2 Spaced Repetition Engine
- **FR-2.1**: Implementation of the modified SuperMemo-2 (SM-2) scheduling algorithm.
- **FR-2.2**: Dynamic computation of Interval, Ease Factor (EF), and Repetitions based on user ratings (1 to 4).
- **FR-2.3**: Deterministic due-date queue ordering: prioritize overdue review cards, followed by learning cards, followed by new cards.

### 4.3 Combat & RPG Progression
- **FR-3.1**: Turn-based battle state engine mapping flashcard ratings directly to combat damage, player health deductions, and status effects.
- **FR-3.2**: Player inventory & equipment system (e.g., shields that absorb 1 "Again" mistake per battle, potions for HP recovery).
- **FR-3.3**: Leveling system: Users earn XP and level up, unlocking cosmetic avatars and passive battle perks.

### 4.4 Analytics & Mastery Tracking
- **FR-4.1**: Retention analytics dashboard (forecast review curves, retention rate %, total cards mastered vs. learning).
- **FR-4.2**: Daily streak tracker and battle history log.

---

## 5. Non-Functional Requirements
- **NFR-1 (Performance)**: Card reveal and combat animations must render at a consistent 60 FPS with sub-100ms state updates.
- **NFR-2 (Offline-First Capability)**: Users must be able to complete battles and reviews offline; reviews queue up locally and sync when online.
- **NFR-3 (Data Integrity)**: Review logs must be atomic—a dropped connection or browser crash must never corrupt card scheduling history.

---

## 6. Success Metrics & KPIs
- **D30 Retention**: > 35% monthly active user retention.
- **Daily Review Completion Rate**: Percentage of daily due cards cleared (> 80% target).
- **Memory Retention Target**: 85–90% retention rate on mature cards (interval > 21 days).
