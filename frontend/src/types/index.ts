export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  due_card_count?: number;
  total_card_count?: number;
}

export interface Card {
  id: string;
  deck_id: string;
  user_id: string;
  front_content: string;
  back_content: string;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  due_date: string;
  state: 'new' | 'learning' | 'review' | 'relearning';
  tags: string[];
  created_at: string;
}

export interface ReviewLog {
  id: string;
  card_id: string;
  user_id: string;
  rating: number; // 1: Again, 2: Hard, 3: Good, 4: Easy
  review_duration_ms: number;
  scheduled_interval: number;
  reviewed_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'shield' | 'potion' | 'relic';
  description: string;
  quantity: number;
}

export interface PlayerProfile {
  user_id: string;
  level: number;
  experience: number;
  max_hp: number;
  current_hp: number;
  gold: number;
  inventory: InventoryItem[];
  streak_count: number;
  last_active_date?: string;
  updated_at: string;
}

export interface AnalyticsData {
  retention_rate_pct: number;
  streak_count: number;
  total_cards_mastered: number;
  total_cards_learning: number;
  total_cards_new: number;
  forecast_next_7_days: {
    date: string;
    day: string;
    due_count: number;
  }[];
}

export interface Monster {
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  avatar: string;
  attackPower: number;
}
