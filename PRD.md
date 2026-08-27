# Product Requirements & Technical Specifications (PRD)

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
- **FR-1.2**: Support rich text: Markdown formatting, code syntax highlighting, math notation (LaTeX), and image attachments.
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

## 6. System Architecture Specification
The application follows a client-heavy, offline-capable Single Page Application (SPA) architecture with a lightweight REST API backend.

```
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────┐  │
│  │  React / UI  │  │ Battle Engine  │  │ SM-2 Engine│  │
│  └──────┬───────┘  └───────┬────────┘  ─────┬──────┘  │
│         │                  │                 │         │
│  ┌──────┴──────────────────┴─────────────────┴──────┐  │
│  │        State Management & Offline Storage        │  │
│  │           (Zustand + IndexedDB / Dexie)          │  │
└────────────────────────────┬───────────────────────────┘
                             │ Sync Pipeline (HTTPS / JSON)
┌────────────────────────────▼───────────────────────────┐
│                      Backend Layer                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │            FastAPI / Node.js Express             │  │
│  │         Authentication & Sync Controller         │  │
│  └─────────────────────────┬────────────────────────┘  │
│                            │                           │
│  ┌─────────────────────────▼────────────────────────┐  │
│  │           PostgreSQL Relational Storage          │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 7. Spaced Repetition Algorithm Specification (SM-2)
When a card is graded with quality score \(q \in \{1, 2, 3, 4\}\) (mapped from 1: Again, 2: Hard, 3: Good, 4: Easy):

### 7.1 Ease Factor (EF) Calculation
$$\text{EF}' = \max\left(1.3, \text{EF} + \left(0.1 - (4 - q) \times \left(0.08 + (4 - q) \times 0.02\right)\right)\right)$$

### 7.2 Interval (\(I\)) Calculation (in days)
- **If \(q < 3\) (Failed recall / "Again"):**
  - \(\text{reps} = 0\)
  - \(I = 1\)

- **If \(q \ge 3\) (Successful recall):**
  - \(\text{reps} = \text{reps} + 1\)
  - \(I = 1\) (if \(\text{reps} = 1\))
  - \(I = 6\) (if \(\text{reps} = 2\))
  - \(I = \lceil I_{\text{prev}} \times \text{EF}' \rceil\) (if \(\text{reps} > 2\))

### 7.3 Queue Priority & Deterministic Ordering
Queue generation fetches cards matching `due_date <= NOW()` and sorts by:
1. **State Priority**: `relearning` > `review` > `learning` > `new`
2. **Overdue Margin**: Highest `(NOW() - due_date)` first
3. **Card ID**: Stable tie-breaker

---

## 8. Database Schema Design (PostgreSQL / SQLite)
```sql
-- Decks Table
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards Table
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    ease_factor REAL DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    repetition_count INT DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    state VARCHAR(16) DEFAULT 'new', -- 'new', 'learning', 'review', 'relearning'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_cards_due_date ON cards (deck_id, due_date);

-- Review Logs Table (Historical Audit & Sync)
CREATE TABLE review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 4),
    review_duration_ms INT NOT NULL,
    scheduled_interval INT NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Stats & Inventory
CREATE TABLE player_profiles (
    user_id UUID PRIMARY KEY,
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    max_hp INT DEFAULT 100,
    current_hp INT DEFAULT 100,
    gold INT DEFAULT 0,
    inventory JSONB DEFAULT '[]'::jsonb
);
```

---

## 9. API Endpoints Specification
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/decks` | List all decks belonging to the user with due card counts |
| `POST` | `/api/v1/decks` | Create a new deck |
| `GET` | `/api/v1/decks/:deckId/queue` | Fetch cards where `due_date <= NOW()` ordered by priority |
| `POST` | `/api/v1/reviews` | Submit batch card reviews from a battle session and update SM-2 metrics |
| `POST` | `/api/v1/sync` | Two-way delta sync between local IndexedDB and server DB |

---

## 10. Success Metrics & KPIs
- **D30 Retention**: > 35% monthly active user retention.
- **Daily Review Completion Rate**: Percentage of daily due cards cleared (> 80% target).
- **Memory Retention Target**: 85–90% retention rate on mature cards (interval > 21 days).

---

## 11. Implementation Roadmap
```
Milestone 1: Core Flashcard & SM-2 Engine (Weeks 1-2)
 ├── Deck/Card CRUD UI
 ├── SM-2 math validation tests
 └── Local persistence via IndexedDB

Milestone 2: Battle Engine & Combat Loop (Weeks 3-4)
 ├── Turn-based state machine
 ├── HP, damage scaling, monster stat generators
 └── Card flip & attack animations

Milestone 3: Backend Sync & Analytics (Weeks 5-6)
 ├── REST API & PostgreSQL integration
 ├── User auth & delta sync engine
 └── Retention charts & mastery dashboard
```
