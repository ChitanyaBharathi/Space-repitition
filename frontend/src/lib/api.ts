import { Deck, Card, ReviewLog, PlayerProfile, AnalyticsData } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  isOffline?: boolean;
  isAuthExpired?: boolean;

  constructor(message: string, status: number, isOffline = false, isAuthExpired = false) {
    super(message);
    this.status = status;
    this.isOffline = isOffline;
    this.isAuthExpired = isAuthExpired;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}/api/v1${endpoint}`;

  try {
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      throw new ApiError('Authentication session expired. Please log in again.', 401, false, true);
    }
    
    if (!res.ok) {
      let errText = 'API request failed';
      try {
        const body = await res.json();
        errText = body.detail || body.message || errText;
      } catch {
        errText = await res.text();
      }
      throw new ApiError(errText, res.status);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'TypeError' || err.message?.includes('fetch') || !navigator.onLine) {
      throw new ApiError('Cannot reach backend server. Please check connection.', 0, true, false);
    }
    throw new ApiError(err.message || 'Unknown network error', 500);
  }
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  
  // Decks
  getDecks: (token: string) => request<Deck[]>('/decks', {}, token),
  createDeck: (token: string, data: { title: string; description?: string }) =>
    request<Deck>('/decks', { method: 'POST', body: JSON.stringify(data) }, token),
  getDeck: (token: string, deckId: string) => request<Deck>(`/decks/${deckId}`, {}, token),
  updateDeck: (token: string, deckId: string, data: { title?: string; description?: string }) =>
    request<Deck>(`/decks/${deckId}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  deleteDeck: (token: string, deckId: string) => request<void>(`/decks/${deckId}`, { method: 'DELETE' }, token),

  // Cards
  getCardsInDeck: (token: string, deckId: string) => request<Card[]>(`/cards/deck/${deckId}`, {}, token),
  createCard: (token: string, data: { deck_id: string; front_content: string; back_content: string; tags?: string[] }) =>
    request<Card>('/cards', { method: 'POST', body: JSON.stringify(data) }, token),
  updateCard: (token: string, cardId: string, data: { front_content?: string; back_content?: string; tags?: string[] }) =>
    request<Card>(`/cards/${cardId}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  deleteCard: (token: string, cardId: string) => request<void>(`/cards/${cardId}`, { method: 'DELETE' }, token),
  bulkImportCards: (token: string, data: { deck_id: string; cards: { front_content: string; back_content: string; tags?: string[] }[] }) =>
    request<Card[]>('/cards/import', { method: 'POST', body: JSON.stringify(data) }, token),

  // Queue
  getDeckQueue: (token: string, deckId: string) => request<Card[]>(`/queue/deck/${deckId}`, {}, token),
  getAllQueue: (token: string) => request<Card[]>('/queue/all', {}, token),

  // Reviews
  submitReviews: (token: string, reviews: { card_id: string; rating: number; review_duration_ms: number }[]) =>
    request<ReviewLog[]>('/reviews', { method: 'POST', body: JSON.stringify({ reviews }) }, token),

  // Profile
  getProfile: (token: string) => request<PlayerProfile>('/profile', {}, token),
  updateProfile: (token: string, data: Partial<PlayerProfile>) =>
    request<PlayerProfile>('/profile', { method: 'PUT', body: JSON.stringify(data) }, token),

  // Analytics
  getAnalytics: (token: string) => request<AnalyticsData>('/analytics', {}, token),
};
