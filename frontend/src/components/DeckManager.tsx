import React, { useState } from 'react';
import { Deck, Card } from '../types';
import { Plus, Trash2, Edit3, Upload, Download, Layers, BookOpen, FileText, Check, X } from 'lucide-react';
import { CardContentRenderer } from './CardContentRenderer';

interface DeckManagerProps {
  decks: Deck[];
  token: string | null;
  onCreateDeck: (title: string, description?: string) => Promise<void>;
  onUpdateDeck: (deckId: string, title?: string, description?: string) => Promise<void>;
  onDeleteDeck: (deckId: string) => Promise<void>;
  onFetchCardsInDeck: (deckId: string) => Promise<Card[]>;
  onCreateCard: (deckId: string, front: string, back: string, tags: string[]) => Promise<void>;
  onUpdateCard: (cardId: string, front: string, back: string, tags: string[]) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onBulkImport: (deckId: string, cards: { front_content: string; back_content: string; tags?: string[] }[]) => Promise<void>;
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  decks,
  onCreateDeck,
  onUpdateDeck,
  onDeleteDeck,
  onFetchCardsInDeck,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onBulkImport,
}) => {
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');

  // Card Modal / Editor state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardTagsInput, setCardTagsInput] = useState('');

  // Bulk import drawer
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  const handleSelectDeck = async (deck: Deck) => {
    setSelectedDeck(deck);
    const cards = await onFetchCardsInDeck(deck.id);
    setDeckCards(cards);
  };

  const handleCreateDeckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;
    await onCreateDeck(newDeckTitle.trim(), newDeckDesc.trim());
    setNewDeckTitle('');
    setNewDeckDesc('');
    setIsCreatingDeck(false);
  };

  const handleOpenCardModal = (card?: Card) => {
    if (card) {
      setEditingCard(card);
      setCardFront(card.front_content);
      setCardBack(card.back_content);
      setCardTagsInput(card.tags?.join(', ') || '');
    } else {
      setEditingCard(null);
      setCardFront('');
      setCardBack('');
      setCardTagsInput('');
    }
    setIsCardModalOpen(true);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeck || !cardFront.trim() || !cardBack.trim()) return;
    const tags = cardTagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingCard) {
      await onUpdateCard(editingCard.id, cardFront, cardBack, tags);
    } else {
      await onCreateCard(selectedDeck.id, cardFront, cardBack, tags);
    }

    const updated = await onFetchCardsInDeck(selectedDeck.id);
    setDeckCards(updated);
    setIsCardModalOpen(false);
  };

  const handleDeleteCardItem = async (cardId: string) => {
    if (!selectedDeck) return;
    await onDeleteCard(cardId);
    setDeckCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeck || !importJsonText.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText);
      const items = Array.isArray(parsed) ? parsed : parsed.cards || [];
      await onBulkImport(selectedDeck.id, items);
      const updated = await onFetchCardsInDeck(selectedDeck.id);
      setDeckCards(updated);
      setIsImportModalOpen(false);
      setImportJsonText('');
    } catch (err) {
      alert('Invalid JSON format. Expected array of objects with front_content and back_content.');
    }
  };

  const handleExportDeckJSON = () => {
    if (!selectedDeck) return;
    const exportData = {
      deck_title: selectedDeck.title,
      description: selectedDeck.description,
      cards: deckCards.map((c) => ({
        front_content: c.front_content,
        back_content: c.back_content,
        tags: c.tags,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDeck.title.replace(/\s+/g, '_')}_backup.json`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-coral-500" /> Deck & Card Vault
          </h2>
          <p className="text-slate-400 text-xs">Organize study decks, edit Markdown flashcards, or bulk import cards.</p>
        </div>

        <button
          onClick={() => setIsCreatingDeck(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-coral-500 to-amber-500 hover:from-coral-600 hover:to-amber-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-coral-500/20 transition-all text-xs"
        >
          <Plus className="w-4 h-4" /> Create New Deck
        </button>
      </div>

      {/* Create Deck Modal */}
      {isCreatingDeck && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-bold text-lg text-white">Create Study Deck</h3>
              <button onClick={() => setIsCreatingDeck(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDeckSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deck Title</label>
                <input
                  type="text"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="e.g. System Design & Data Structures"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-coral-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description (Optional)</label>
                <textarea
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="Key concepts, active recall prompts, and interview questions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-coral-500 h-20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingDeck(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-coral-500 text-white font-semibold rounded-xl hover:bg-coral-600 shadow-lg shadow-coral-500/20"
                >
                  Create Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Decks & Card Editor Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Deck Cards Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-heading font-bold text-slate-300 uppercase tracking-wider">Available Decks ({decks.length})</h3>
          
          {decks.length === 0 ? (
            <div className="glass-panel p-6 rounded-2xl text-center border border-slate-800 text-slate-400 text-xs">
              No decks found. Click "Create New Deck" to get started.
            </div>
          ) : (
            decks.map((deck) => {
              const isSelected = selectedDeck?.id === deck.id;
              return (
                <div
                  key={deck.id}
                  onClick={() => handleSelectDeck(deck)}
                  className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-coral-500 bg-coral-500/10 shadow-lg shadow-coral-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-white text-base">{deck.title}</h4>
                      {deck.description && <p className="text-xs text-slate-400 line-clamp-2 mt-1">{deck.description}</p>}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete deck "${deck.title}" and all its cards?`)) {
                          onDeleteDeck(deck.id);
                          if (selectedDeck?.id === deck.id) setSelectedDeck(null);
                        }
                      }}
                      className="text-slate-500 hover:text-crimson-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80 font-mono">
                    <span className="text-slate-400">Total: {deck.total_card_count || 0} cards</span>
                    <span className="bg-coral-500/20 text-coral-400 border border-coral-500/30 px-2 py-0.5 rounded font-bold">
                      {deck.due_card_count || 0} Due
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Selected Deck Detail & Cards List */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDeck ? (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              
              {/* Deck Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-heading font-extrabold text-xl text-white">{selectedDeck.title}</h3>
                  <p className="text-xs text-slate-400">{deckCards.length} Cards in Deck</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700"
                  >
                    <Upload className="w-3.5 h-3.5" /> Bulk Import
                  </button>

                  <button
                    onClick={handleExportDeckJSON}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" /> Export JSON
                  </button>

                  <button
                    onClick={() => handleOpenCardModal()}
                    className="flex items-center gap-1.5 bg-coral-500 hover:bg-coral-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-coral-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Card
                  </button>
                </div>
              </div>

              {/* Cards List in Selected Deck */}
              {deckCards.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  This deck is empty. Click "Add Card" or "Bulk Import" to populate flashcards.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {deckCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="text-xs font-mono font-semibold text-coral-400 flex items-center gap-2">
                          <span>Prompt:</span>
                          <span className="bg-slate-900 text-slate-400 px-2 py-0.5 rounded text-[10px]">
                            {card.state}
                          </span>
                        </div>
                        <div className="text-xs text-white line-clamp-2">
                          <CardContentRenderer content={card.front_content} />
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenCardModal(card)}
                          className="text-slate-400 hover:text-coral-400 p-1.5 rounded-lg hover:bg-slate-900"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCardItem(card.id)}
                          className="text-slate-400 hover:text-crimson-400 p-1.5 rounded-lg hover:bg-slate-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center text-slate-400 text-sm">
              Select a deck from the left pane to view or manage its flashcards.
            </div>
          )}
        </div>
      </div>

      {/* Split-Pane Card Modal / Markdown Editor */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-3xl w-full p-6 border border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-heading font-bold text-lg text-white">
                {editingCard ? 'Edit Flashcard' : 'Add New Flashcard'}
              </h3>
              <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4 text-xs">
              {/* Front Prompt */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Front Prompt (Markdown / LaTeX / Code syntax supported)
                </label>
                <textarea
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                  placeholder="e.g. What is the time complexity of QuickSort average vs worst case?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-code text-xs focus:outline-none focus:border-coral-500 h-24"
                  required
                />
              </div>

              {/* Back Answer */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Back Answer</label>
                <textarea
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                  placeholder="e.g. Average: $O(N \log N)$, Worst case: $O(N^2)$ when pivot selection is unbalanced."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-code text-xs focus:outline-none focus:border-coral-500 h-28"
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={cardTagsInput}
                  onChange={(e) => setCardTagsInput(e.target.value)}
                  placeholder="algorithms, complexity, interviewing"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-coral-500"
                />
              </div>

              {/* Live Preview Pane */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-coral-400 font-mono uppercase tracking-widest font-bold">
                  Live Preview
                </span>
                <div className="pt-1 text-slate-200">
                  <CardContentRenderer content={cardFront || '*Prompt preview...*'} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-coral-500 text-white font-semibold rounded-xl hover:bg-coral-600 shadow-lg shadow-coral-500/20"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-xl w-full p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-lg text-white">Bulk Import Cards (JSON)</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBulkImportSubmit} className="space-y-4 text-xs">
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder={`[\n  {\n    "front_content": "What is closure in JS?",\n    "back_content": "A function bundled with its lexical environment.",\n    "tags": ["js", "web"]\n  }\n]`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-code text-xs focus:outline-none focus:border-coral-500 h-48"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-coral-500 text-white font-semibold rounded-xl hover:bg-coral-600 shadow-lg"
                >
                  Import Cards
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
