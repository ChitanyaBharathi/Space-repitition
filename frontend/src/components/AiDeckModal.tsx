import React, { useState, useRef } from 'react';
import { Sparkles, Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, BookOpen, Layers, Edit3, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

interface GeneratedCardItem {
  front: string;
  back: string;
  page_reference: string;
  tags: string[];
  difficulty: string;
  selected: boolean;
}

interface AiDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onDeckCreated: (deck: { id: string; title: string; description: string }, cards: Array<{ front_content: string; back_content: string; tags: string[] }>) => Promise<void>;
}

export const AiDeckModal: React.FC<AiDeckModalProps> = ({
  isOpen,
  onClose,
  token,
  onDeckCreated
}) => {
  const [tab, setTab] = useState<'pdf' | 'text'>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [notesText, setNotesText] = useState('');
  const [deckTitle, setDeckTitle] = useState('');
  const [cardCount, setCardCount] = useState<number>(10);
  const [focusMode, setFocusMode] = useState<string>('high_yield');

  // Loading & Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepMessage, setStepMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Review state
  const [generatedCards, setGeneratedCards] = useState<GeneratedCardItem[]>([]);
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a valid .pdf file.');
        return;
      }
      setFile(selected);
      setError(null);
      if (!deckTitle) {
        setDeckTitle(selected.name.replace(/\.pdf$/i, ''));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a valid .pdf file.');
        return;
      }
      setFile(selected);
      setError(null);
      if (!deckTitle) {
        setDeckTitle(selected.name.replace(/\.pdf$/i, ''));
      }
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);

    try {
      let result;
      if (tab === 'pdf') {
        if (!file) {
          setError('Please select or drop a PDF study file.');
          setIsGenerating(false);
          return;
        }
        setStepMessage('Embedding passages into Supabase pgvector & running semantic retrieval...');
        result = await api.generateDeckFromPdf(token, file, cardCount, focusMode, deckTitle);
      } else {
        if (!notesText.trim()) {
          setError('Please paste study notes or lecture text.');
          setIsGenerating(false);
          return;
        }
        setStepMessage('Embedding notes into pgvector & synthesizing cards...');
        result = await api.generateDeckFromText(token, {
          notes_text: notesText,
          card_count: cardCount,
          focus_mode: focusMode,
          deck_title: deckTitle || undefined,
        });
      }

      setSuggestedTitle(result.suggested_deck_title || deckTitle || 'AI Study Deck');
      setSummary(result.summary || 'Generated flashcard set from vector store.');
      setGeneratedCards(
        result.cards.map((c) => ({
          ...c,
          selected: true,
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to generate flashcards. Please verify your AI API Key.');
    } finally {
      setIsGenerating(false);
      setStepMessage('');
    }
  };

  const handleSaveDeck = async () => {
    const selectedCards = generatedCards.filter((c) => c.selected);
    if (selectedCards.length === 0) {
      setError('Please select at least 1 card to save to your deck.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const finalTitle = suggestedTitle.trim() || 'AI Generated Deck';
      const deckPayload = {
        id: crypto.randomUUID(),
        title: finalTitle,
        description: summary || 'Generated from study notes via MindForge AI',
      };

      const cardsPayload = selectedCards.map((c) => ({
        front_content: c.front,
        back_content: c.page_reference && c.page_reference !== 'N/A' 
          ? `${c.back}\n\n*(Source: ${c.page_reference})*`
          : c.back,
        tags: c.tags || [],
      }));

      await onDeckCreated(deckPayload, cardsPayload);
      handleResetAndClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save generated deck.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAndClose = () => {
    setFile(null);
    setNotesText('');
    setDeckTitle('');
    setGeneratedCards([]);
    setError(null);
    setIsGenerating(false);
    onClose();
  };

  const toggleSelectCard = (index: number) => {
    setGeneratedCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  };

  const updateCardContent = (index: number, field: 'front' | 'back', value: string) => {
    setGeneratedCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const removeCard = (index: number) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                AI Deck & Flashcard Generator
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  RAG Powered
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transform PDF notes or lecture transcripts into tactical study cards
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {generatedCards.length === 0 ? (
            /* Upload / Configuration View */
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 max-w-xs">
                <button
                  type="button"
                  onClick={() => setTab('pdf')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    tab === 'pdf'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setTab('text')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    tab === 'text'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Paste Notes
                </button>
              </div>

              {/* Input Area */}
              {tab === 'pdf' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(e);
                  }}
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                      fileInputRef.current.click();
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    file
                      ? 'border-purple-500/60 bg-purple-500/10'
                      : 'border-slate-700 hover:border-purple-500/40 bg-slate-950/40 hover:bg-slate-950/80'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    onClick={(e) => e.stopPropagation()}
                    className="hidden"
                  />
                  <div className="p-4 rounded-full bg-slate-800/80 text-purple-400 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  {file ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-100">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-200">
                        Click or drag & drop study PDF here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Lectures, textbook chapters, summaries (up to 50MB)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Study Notes / Lecture Markdown
                  </label>
                  <textarea
                    rows={6}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Paste lecture notes, study outline, definitions, or textbook transcript here..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/70"
                  />
                </div>
              )}

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Deck Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    placeholder="e.g. CS204 Algorithms Ch. 3"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500/70"
                  />
                </div>

                {/* Card Count */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Card Quantity
                    </label>
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      {cardCount} Cards
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={30}
                    step={1}
                    value={cardCount}
                    onChange={(e) => setCardCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>3 Quick</span>
                    <span>15 Standard</span>
                    <span>30 Deep</span>
                  </div>
                </div>

                {/* Focus Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Study Focus
                  </label>
                  <select
                    value={focusMode}
                    onChange={(e) => setFocusMode(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500/70"
                  >
                    <option value="high_yield">⚡ High-Yield Exam Concepts</option>
                    <option value="definitions">📖 Terminology & Definitions</option>
                    <option value="comprehensive">🎯 Comprehensive Breakdown</option>
                    <option value="problem_solving">🧩 Scenarios & Step-by-Step</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* Review & Edit Generated Cards View */
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <input
                      type="text"
                      value={suggestedTitle}
                      onChange={(e) => setSuggestedTitle(e.target.value)}
                      className="text-base font-bold text-slate-100 bg-transparent border-b border-purple-500/40 focus:outline-none focus:border-purple-400 px-1"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{summary}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-300">
                  <Layers className="w-4 h-4" />
                  <span>
                    {generatedCards.filter((c) => c.selected).length} of {generatedCards.length} selected
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {generatedCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      card.selected
                        ? 'bg-slate-800/40 border-purple-500/40 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSelectCard(idx)}
                          className={`p-1 rounded transition-colors ${
                            card.selected ? 'text-purple-400' : 'text-slate-600'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-slate-400">Card #{idx + 1}</span>
                        {card.page_reference && card.page_reference !== 'N/A' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {card.page_reference}
                          </span>
                        )}
                        {card.difficulty && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                            {card.difficulty}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCard(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Delete card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Front (Prompt)
                        </label>
                        <textarea
                          rows={2}
                          value={card.front}
                          onChange={(e) => updateCardContent(idx, 'front', e.target.value)}
                          className="w-full text-xs rounded-lg bg-slate-900 border border-slate-700/60 p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Back (Answer)
                        </label>
                        <textarea
                          rows={2}
                          value={card.back}
                          onChange={(e) => updateCardContent(idx, 'back', e.target.value)}
                          className="w-full text-xs rounded-lg bg-slate-900 border border-slate-700/60 p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          {generatedCards.length > 0 ? (
            <button
              type="button"
              onClick={() => setGeneratedCards([])}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              ← Back to Upload
            </button>
          ) : (
            <span className="text-xs text-slate-500">
              Structured JSON extraction powered by LLM
            </span>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            {generatedCards.length === 0 ? (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || (tab === 'pdf' && !file) || (tab === 'text' && !notesText.trim())}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{stepMessage || 'Generating Cards...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Flashcards</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveDeck}
                disabled={isSaving || generatedCards.filter((c) => c.selected).length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Deck...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Save {generatedCards.filter((c) => c.selected).length} Cards to Deck
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
