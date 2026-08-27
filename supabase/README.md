# Supabase Configuration & Schema Documentation

## Database Schema & Row-Level Security (RLS)

MindForge uses Supabase PostgreSQL for relational data storage and user authentication.

### Tables Overview
- `auth.users`: Core Supabase Auth users table.
- `public.decks`: Flashcard decks belonging to users.
- `public.cards`: Spaced repetition flashcards with SM-2 metrics (`ease_factor`, `interval_days`, `repetition_count`, `due_date`, `state`).
- `public.review_logs`: Audit trail of study sessions and recall ratings (1: Again, 2: Hard, 3: Good, 4: Easy).
- `public.player_profiles`: Gamified RPG progression stats (`level`, `experience`, `max_hp`, `current_hp`, `gold`, `inventory`, `streak_count`).

### RLS Policies
All user-facing tables enforce strict owner-only Row Level Security:
- `decks_owner_policy`: `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE.
- `cards_owner_policy`: `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE.
- `review_logs_owner_policy`: `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE.
- `player_profiles_owner_policy`: `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE.

### Access Control Rules
1. **Frontend**: Obtains user auth tokens from Supabase Auth (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`).
2. **Backend**: FastAPI receives the Bearer access token, validates it against Supabase, and uses the user context for database queries.
3. **No Service Role Keys**: Neither frontend nor backend exposes or requires Supabase `service_role` secret keys.
