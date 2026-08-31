<div align="center">

# ⚔️ MindForge: Spaced Repetition Card Battler

**A high-stakes, gamified active recall study RPG powered by the SM-2 algorithm & Supabase `pgvector` RAG.**

[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Features](#-core-features) • [RAG Architecture](#-vector-rag-pipeline) • [Gameplay Loop](#-the-combat-loop) • [Tech Stack](#-technology-stack) • [Getting Started](#-getting-started)

</div>

---

## 🌟 Overview

Traditional flashcard review loops (Anki, Quizlet) are scientifically proven yet psychologically monotonous. **MindForge** transforms spaced repetition studying into a **turn-based dungeon card battler**.

Study decks become combat encounters. Your recall honesty directly dictates your combat output: critical strikes on easy recalls, damage penalties on fumbles, and boss fights scaled to your daily due review queue.

With **Vector-grounded RAG**, students can drop entire lecture slide decks, textbook PDFs, or study notes to instantly generate atomic active-recall cards with **exact source page citations**.

---

## ✨ Core Features

### ⚔️ Gamified Combat & Spaced Repetition
* **SuperMemo-2 (SM-2) Scheduling Engine**: Deterministic queue calculating Ease Factors, Intervals, and repetition states (`new`, `learning`, `review`, `relearning`).
* **Tactical Battle Arena**: 
  - **Easy / Critical (Key 4)**: 80 DMG + Max Interval Expansion.
  - **Good (Key 3)**: 45 DMG + Standard SM-2 Interval.
  - **Hard (Key 2)**: 25 DMG (Glancing Strike).
  - **Again / Fumble (Key 1)**: Player takes damage, card reshuffles into the wave queue, interval resets.
* **Aegis Shields & Recovery Potions**: Tactical inventory absorbing fumbles and recovering player HP during intense review waves.

### 🧠 True Vector RAG Deck Generator
* **PDF & Study Notes Ingestion**: Drag & drop PDF lectures or paste Markdown notes.
* **Dense Vector Embeddings (`text-embedding-3-small`)**: 1536-dimensional semantic representations stored directly in PostgreSQL with **`pgvector`**.
* **Cosine Similarity Retrieval**: Probes the vector knowledge store to retrieve high-yield concepts and eliminate hallucinations.
* **Page-Accurate Citations**: Every generated card is tagged with its verified source citation (e.g. `Source: Page 9`).
* **Customizable Depth**: Choose study focus (*High-Yield Exam Focus*, *Definitions & Terms*, *Comprehensive*, *Problem Solving*) and card quantities (3 to 30+).

### 📊 Deck Vault & Analytics
* Rich Markdown, syntax-highlighted code blocks, and LaTeX math notation (`KaTeX`).
* Real-time mastery forecasting, retention rates, and daily streak tracking.
* Bulk JSON export & import.

---

## 🏛️ Vector RAG Pipeline

```
                                  [ Upload PDF / Study Notes ]
                                               │
                                               ▼
                              [ 1. Recursive Semantic Chunking ]
                                (Paragraph & Sentence Boundaries)
                                               │
                                               ▼
                              [ 2. Dense Vector Embeddings ]
                                  (text-embedding-3-small)
                                               │
                                               ▼
                         ┌───────────────────────────────────────────┐
                         │   3. Supabase pgvector Vector Database    │
                         │   • documents table                       │
                         │   • document_sections (vector(1536))      │
                         └─────────────────────┬─────────────────────┘
                                               │
                                               ▼
                              [ 4. Cosine Similarity Vector RPC ]
                                 (match_document_sections)
                                 Top-K Semantic Probes (<=>)
                                               │
                                               ▼
                              [ 5. Grounded LLM Synthesis ]
                                 (Flashcards + Page Citations)
                                               │
                                               ▼
                                 [ MindForge Flashcard Deck ]
```

---

## 🎮 The Combat Loop

```
                     ┌───────────────────────────────┐
                     │     1. Start Review Wave      │
                     │  (Pull SM-2 Due Queue Cards)  │
                     └───────────────┬───────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │   2. Encounter Dungeon Boss   │
                     │    (HP scales to wave size)   │
                     └───────────────┬───────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │   3. Active Recall Prompt     │
                     │  [Space] Flip & Reveal Answer │
                     └───────────────┬───────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
        [ 4: Critical Strike ]             [ 1: Fumble / Miss ]
        • 80 Monster DMG                   • Player takes damage
        • Long interval increase           • Card reshuffles into wave
                     │                               │
                     └───────────────┬───────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │      5. Victory & Rewards     │
                     │   Gold, XP & Deck Mastery     │
                     └───────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas-Confetti, KaTeX |
| **Backend API** | Python 3.14, FastAPI, Pydantic v2, PyPDF, OpenAI Async Client, Pytest |
| **Database & Vector Store** | Supabase (PostgreSQL 17), `pgvector` Extension (1536-dim vector search) |
| **Deployment** | Vercel (Frontend & Serverless API functions) |

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Space-repitition.git
cd Space-repitition
```

### 2. Configure Environment Variables
Create `.env` in the project root or `backend/.env`:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# AI Vector RAG
AI_API_KEY=your_openai_or_proxy_api_key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_EMBEDDING_MODEL=text-embedding-3-small
```

### 3. Run Locally

**Frontend**:
```bash
npm --prefix frontend run dev
```

**Backend**:
```bash
npm run backend:dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Testing

Run the full backend test suite:
```bash
python -m pytest backend/tests
```

---

<div align="center">
  <sub>Built with ⚔️ for learners who want to turn study grind into mastery.</sub>
</div>
