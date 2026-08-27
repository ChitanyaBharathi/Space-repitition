# Technical Design Document (Design.md)

## Project Title
**MindForge: Spaced Repetition Card Battler**

---

## 1. System Architecture Overview
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

## 2. Spaced Repetition Algorithm Specification (SM-2)
When a card is graded with quality score \(q \in \{1, 2, 3, 4\}\) (mapped from 1: Again, 2: Hard, 3: Good, 4: Easy):

### 2.1 Ease Factor (EF) Calculation
$$\text{EF}' = \max\left(1.3, \text{EF} + \left(0.1 - (4 - q) \times \left(0.08 + (4 - q) \times 0.02\right)\right)\right)$$

### 2.2 Interval (\(I\)) Calculation (in days)
- **If \(q < 3\) (Failed recall / "Again"):**
  - \(\text{reps} = 0\)
  - \(I = 1\)

- **If \(q \ge 3\) (Successful recall):**
  - \(\text{reps} = \text{reps} + 1\)
  - \(I = 1\) (if \(\text{reps} = 1\))
  - \(I = 6\) (if \(\text{reps} = 2\))
  - \(I = \lceil I_{\text{prev}} \times \text{EF}' \rceil\) (if \(\text{reps} > 2\))

---

## 3. Database Schema Design (PostgreSQL / SQLite)
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

## 4. API Endpoints Specification
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/decks` | List all decks belonging to the user with due card counts |
| `POST` | `/api/v1/decks` | Create a new deck |
| `GET` | `/api/v1/decks/:deckId/queue` | Fetch cards where `due_date <= NOW()` ordered by priority |
| `POST` | `/api/v1/reviews` | Submit batch card reviews from a battle session and update SM-2 metrics |
| `POST` | `/api/v1/sync` | Two-way delta sync between local IndexedDB and server DB |

---

## 5. Combat State Machine & Turn Resolution
```
                  ┌──────────────────────┐
                  │    Encounter Start   │
                  │ (Fetch Due Cards)    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
            ┌────►│     Present Card     │
            │     └──────────┬───────────┘
            │                │
            │                ▼
            │     ┌──────────────────────┐
            │     │    Reveal & Grade    │
            │     └──────────┬───────────┘
            │                │
            ├──────────────┬─┴─────────────┐
            │ (Rating >= 3)│               │ (Rating < 3)
            ▼              ▼               ▼
     [Player Attack]  [Player Attack]  [Monster Counterattack]
     (Standard Hit)   (Critical Hit)   (Player Takes Damage)
            │              │               │
            └──────────────┴───────────────┤
                                           │
                             ┌─────────────▼─────────────┐
                             │ Check Battle State:       │
                             │ - Enemy HP <= 0 -> VICTORY│
                             │ - Player HP <= 0 -> DEFEAT│
                             │ - Remaining Cards -> Next │
                             └───────────────────────────┘
```

---

## 6. Implementation Roadmap
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
