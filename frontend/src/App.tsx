import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { api, ApiError } from './lib/api';
import { Deck, Card, PlayerProfile, AnalyticsData } from './types';
import { Navbar } from './components/Navbar';
import { BattleArena } from './components/BattleArena';
import { DeckManager } from './components/DeckManager';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PlayerProfileView } from './components/PlayerProfileView';
import { AuthModal } from './components/AuthModal';
import { AiDeckModal } from './components/AiDeckModal';
import { OfflineBanner, AuthExpiredModal, ErrorToast, LoadingSkeleton } from './components/StatusBanners';

export const AppContent: React.FC = () => {
  const { user, token, signOut } = useAuth();
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'battle' | 'decks' | 'analytics' | 'profile'>('battle');

  // Application Data state
  const [decks, setDecks] = useState<Deck[]>([]);
  const [queue, setQueue] = useState<Card[]>([]);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Status & Exception states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isAuthExpired, setIsAuthExpired] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);


  const handleError = useCallback((err: any) => {
    if (err instanceof ApiError) {
      if (err.isOffline) {
        setIsOffline(true);
      } else if (err.isAuthExpired) {
        setIsAuthExpired(true);
      } else {
        setErrorMsg(err.message);
      }
    } else {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    }
  }, []);

  // Fetch initial app data
  const fetchData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setIsOffline(false);
    setIsAuthExpired(false);
    setErrorMsg(null);

    try {
      const [fetchedDecks, fetchedQueue, fetchedProfile, fetchedAnalytics] = await Promise.all([
        api.getDecks(token),
        api.getAllQueue(token),
        api.getProfile(token),
        api.getAnalytics(token),
      ]);

      setDecks(fetchedDecks);
      setQueue(fetchedQueue);
      setProfile(fetchedProfile);
      setAnalytics(fetchedAnalytics);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Deck CRUD actions
  const handleCreateDeck = async (title: string, description?: string) => {
    if (!token) return setIsAuthModalOpen(true);
    try {
      const newDeck = await api.createDeck(token, { title, description });
      setDecks((prev) => [newDeck, ...prev]);
    } catch (err) {
      handleError(err);
    }
  };

  const handleUpdateDeck = async (deckId: string, title?: string, description?: string) => {
    if (!token) return;
    try {
      const updated = await api.updateDeck(token, deckId, { title, description });
      setDecks((prev) => prev.map((d) => (d.id === deckId ? updated : d)));
    } catch (err) {
      handleError(err);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!token) return;
    try {
      await api.deleteDeck(token, deckId);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch (err) {
      handleError(err);
    }
  };

  // Card CRUD actions
  const handleFetchCardsInDeck = async (deckId: string): Promise<Card[]> => {
    if (!token) return [];
    try {
      return await api.getCardsInDeck(token, deckId);
    } catch (err) {
      handleError(err);
      return [];
    }
  };

  const handleCreateCard = async (deckId: string, front: string, back: string, tags: string[]) => {
    if (!token) return;
    try {
      await api.createCard(token, { deck_id: deckId, front_content: front, back_content: back, tags });
      await fetchData();
    } catch (err) {
      handleError(err);
    }
  };

  const handleUpdateCard = async (cardId: string, front: string, back: string, tags: string[]) => {
    if (!token) return;
    try {
      await api.updateCard(token, cardId, { front_content: front, back_content: back, tags });
    } catch (err) {
      handleError(err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!token) return;
    try {
      await api.deleteCard(token, cardId);
      await fetchData();
    } catch (err) {
      handleError(err);
    }
  };

  const handleBulkImport = async (deckId: string, cards: { front_content: string; back_content: string; tags?: string[] }[]) => {
    if (!token) return;
    try {
      await api.bulkImportCards(token, { deck_id: deckId, cards });
      await fetchData();
    } catch (err) {
      handleError(err);
    }
  };

  // Review & Profile actions
  const handleReviewSubmit = async (reviews: { card_id: string; rating: number; review_duration_ms: number }[]) => {
    if (!token) return;
    try {
      await api.submitReviews(token, reviews);
      const [updatedProfile, updatedAnalytics] = await Promise.all([
        api.getProfile(token),
        api.getAnalytics(token),
      ]);
      setProfile(updatedProfile);
      setAnalytics(updatedAnalytics);
    } catch (err) {
      handleError(err);
    }
  };

  const handleUpdateProfile = async (data: Partial<PlayerProfile>) => {
    if (!token) return;
    try {
      const updated = await api.updateProfile(token, data);
      setProfile(updated);
    } catch (err) {
      handleError(err);
    }
  };

  const handleAiDeckCreated = async (
    deckData: { id: string; title: string; description: string },
    cards: Array<{ front_content: string; back_content: string; tags: string[] }>
  ) => {
    if (!token) return setIsAuthModalOpen(true);
    try {
      const newDeck = await api.createDeck(token, {
        title: deckData.title,
        description: deckData.description,
      });
      setDecks((prev) => [newDeck, ...prev]);

      if (cards.length > 0) {
        await api.bulkImportCards(token, {
          deck_id: newDeck.id,
          cards,
        });
      }
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-ivory flex flex-col font-body">
      
      {/* Offline Status Banner */}
      {isOffline && <OfflineBanner onRetry={fetchData} />}

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        userEmail={user?.email ?? null}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={signOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!token ? (
          <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center glass-panel rounded-3xl max-w-2xl mx-auto my-8 border border-coral-500/30">
            <div className="w-20 h-20 bg-gradient-to-br from-coral-500 to-amber-500 rounded-3xl flex items-center justify-center text-white text-3xl mb-6 shadow-xl shadow-coral-500/30">
              ⚔️
            </div>
            <h2 className="text-3xl font-heading font-extrabold text-white mb-2">Welcome to MindForge</h2>
            <p className="text-slate-300 text-sm max-w-md mb-6 leading-relaxed">
              Transform flashcard study drills into a turn-based RPG dungeon battler. Boost retention with SuperMemo-2 spaced repetition.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-gradient-to-r from-coral-500 to-amber-500 hover:from-coral-600 hover:to-amber-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-coral-500/25 transition-all text-sm"
            >
              Sign In or Register Adventurer Account
            </button>
          </div>
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {activeTab === 'battle' && (
              <BattleArena
                queue={queue}
                profile={profile}
                onReviewSubmit={handleReviewSubmit}
                onUpdateProfile={handleUpdateProfile}
                onRefreshQueue={fetchData}
                token={token}
              />
            )}

            {activeTab === 'decks' && (
              <DeckManager
                decks={decks}
                token={token}
                onCreateDeck={handleCreateDeck}
                onUpdateDeck={handleUpdateDeck}
                onDeleteDeck={handleDeleteDeck}
                onFetchCardsInDeck={handleFetchCardsInDeck}
                onCreateCard={handleCreateCard}
                onUpdateCard={handleUpdateCard}
                onDeleteCard={handleDeleteCard}
                onBulkImport={handleBulkImport}
                onOpenAiModal={() => setIsAiModalOpen(true)}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsDashboard data={analytics} />}

            {activeTab === 'profile' && <PlayerProfileView profile={profile} />}
          </>
        )}
      </main>

      {/* AI Deck Generator Modal */}
      <AiDeckModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        token={token}
        onDeckCreated={handleAiDeckCreated}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Auth Expired Modal */}
      {isAuthExpired && (
        <AuthExpiredModal
          onReLogin={() => {
            setIsAuthExpired(false);
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* Error Toast */}
      {errorMsg && <ErrorToast message={errorMsg} onDismiss={() => setErrorMsg(null)} />}
    </div>
  );
};

