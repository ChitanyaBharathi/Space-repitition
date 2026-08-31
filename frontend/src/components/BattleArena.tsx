import React, { useState, useEffect, useCallback } from 'react';
import { Card, PlayerProfile, Monster } from '../types';
import { CardContentRenderer } from './CardContentRenderer';
import { Shield, Sparkles, Zap, Heart, RotateCw, CheckCircle2, Award, Swords, Skull, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BattleArenaProps {
  queue: Card[];
  profile: PlayerProfile | null;
  onReviewSubmit: (reviews: { card_id: string; rating: number; review_duration_ms: number }[]) => Promise<void>;
  onUpdateProfile: (data: Partial<PlayerProfile>) => Promise<void>;
  onRefreshQueue: () => void;
  token: string | null;
}

const MONSTER_TEMPLATES = [
  { name: 'Synapse Sentinel', avatar: '👾', baseHp: 80, atk: 15 },
  { name: 'Oblivion Drake', avatar: '🐉', baseHp: 120, atk: 25 },
  { name: 'Memory Devourer', avatar: '👹', baseHp: 100, atk: 20 },
  { name: 'Entropy Construct', avatar: '🤖', baseHp: 150, atk: 30 },
];

export const BattleArena: React.FC<BattleArenaProps> = ({
  queue,
  profile,
  onReviewSubmit,
  onUpdateProfile,
  onRefreshQueue,
  token,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [fumbleShake, setFumbleShake] = useState(false);
  const [transitionState, setTransitionState] = useState<'idle' | 'exit-left' | 'exit-right' | 'enter'>('enter');
  
  // Monster state
  const [monster, setMonster] = useState<Monster>({
    name: MONSTER_TEMPLATES[0].name,
    level: profile?.level || 1,
    maxHp: MONSTER_TEMPLATES[0].baseHp,
    currentHp: MONSTER_TEMPLATES[0].baseHp,
    avatar: MONSTER_TEMPLATES[0].avatar,
    attackPower: MONSTER_TEMPLATES[0].baseHp,
  });

  // Floating damage text state
  const [damageText, setDamageText] = useState<{ id: number; text: string; color: string; isPlayer: boolean }[]>([]);

  // Shield & Item consumable state
  const [activeShields, setActiveShields] = useState<number>(1); // Absorbs 1 fumble
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [sessionReviewedCount, setSessionReviewedCount] = useState(0);

  const currentCard = queue[currentIndex];

  useEffect(() => {
    setCardStartTime(Date.now());
    setIsFlipped(false);
  }, [currentIndex]);

  // Reset monster when level changes or queue resets
  useEffect(() => {
    const template = MONSTER_TEMPLATES[(currentIndex + (profile?.level || 1)) % MONSTER_TEMPLATES.length];
    setMonster({
      name: template.name,
      level: profile?.level || 1,
      maxHp: template.baseHp + (queue.length * 10),
      currentHp: template.baseHp + (queue.length * 10),
      avatar: template.avatar,
      attackPower: template.atk,
    });
  }, [queue.length, profile?.level]);

  const triggerDamageOverlay = (text: string, color: string, isPlayer: boolean) => {
    const newId = Date.now() + Math.random();
    setDamageText((prev) => [...prev, { id: newId, text, color, isPlayer }]);
    setTimeout(() => {
      setDamageText((prev) => prev.filter((d) => d.id !== newId));
    }, 1000);
  };

  const handleRating = useCallback(
    async (rating: number) => {
      if (!currentCard) return;
      const durationMs = Date.now() - cardStartTime;

      let monsterDamage = 0;
      let playerDamage = 0;

      if (rating === 1) {
        // Again / Fumble
        setFumbleShake(true);
        setTimeout(() => setFumbleShake(false), 500);

        if (activeShields > 0) {
          setActiveShields((prev) => prev - 1);
          triggerDamageOverlay('SHIELD ABSORBED!', 'text-amber-400', true);
        } else {
          playerDamage = 20;
          triggerDamageOverlay('-20 HP!', 'text-crimson-500', true);
        }
      } else if (rating === 2) {
        // Hard
        monsterDamage = 25;
        triggerDamageOverlay('-25 DMG', 'text-amber-400', false);
      } else if (rating === 3) {
        // Good
        monsterDamage = 45;
        triggerDamageOverlay('-45 DMG!', 'text-coral-500', false);
      } else if (rating === 4) {
        // Easy / Critical
        monsterDamage = 80;
        triggerDamageOverlay('CRITICAL 80!', 'text-emerald-400', false);
      }

      // Update monster HP
      setMonster((prev) => {
        const nextHp = Math.max(0, prev.currentHp - monsterDamage);
        return { ...prev, currentHp: nextHp };
      });

      // Update player HP if damage taken
      if (playerDamage > 0 && profile) {
        const nextPlayerHp = Math.max(10, profile.current_hp - playerDamage);
        onUpdateProfile({ current_hp: nextPlayerHp });
      }

      // Submit review to backend API asynchronously without blocking UI
      onReviewSubmit([{ card_id: currentCard.id, rating, review_duration_ms: durationMs }]);
      setSessionReviewedCount((prev) => prev + 1);

      // Trigger smooth exit animation
      setTransitionState(rating === 1 ? 'exit-left' : 'exit-right');

      setTimeout(() => {
        setIsFlipped(false);
        if (currentIndex < queue.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setTransitionState('enter');
          setTimeout(() => setTransitionState('idle'), 280);
        } else {
          // Queue Cleared!
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
          setIsVictoryModalOpen(true);
          setTransitionState('idle');
        }
      }, 200);
    },
    [currentCard, cardStartTime, activeShields, profile, currentIndex, queue.length, onReviewSubmit, onUpdateProfile]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVictoryModalOpen || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRating(1);
        if (e.key === '2') handleRating(2);
        if (e.key === '3') handleRating(3);
        if (e.key === '4') handleRating(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isVictoryModalOpen, currentCard, handleRating]);

  // Use HP Potion item
  const handleUsePotion = () => {
    if (!profile) return;
    const restoredHp = Math.min(profile.max_hp, profile.current_hp + 40);
    onUpdateProfile({ current_hp: restoredHp });
    triggerDamageOverlay('+40 HP RECOVERED!', 'text-emerald-400', true);
  };

  if (!currentCard || queue.length === 0) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center glass-panel rounded-3xl max-w-2xl mx-auto my-8 border border-emerald-500/30">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/40 shadow-xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-heading font-extrabold text-white mb-2">Queue Fully Mastered!</h2>
        <p className="text-slate-300 text-sm max-w-md mb-6 leading-relaxed">
          No due flashcards remaining for review. You have successfully defended the MindForge realm for today!
        </p>
        <button
          onClick={onRefreshQueue}
          className="flex items-center gap-2 bg-gradient-to-r from-coral-500 to-amber-500 hover:from-coral-600 hover:to-amber-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-coral-500/25 transition-all"
        >
          <RotateCw className="w-5 h-5" /> Check Queue Status
        </button>
      </div>
    );
  }

  const monsterHpPercent = Math.max(0, Math.min(100, (monster.currentHp / monster.maxHp) * 100));

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${fumbleShake ? 'animate-fumble-shake' : ''}`}>
      
      {/* Monster Encounter Header */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Monster Portrait & Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-crimson-600 to-slate-900 border-2 border-crimson-500/50 flex items-center justify-center text-4xl shadow-xl shadow-crimson-500/20 relative">
              {monster.avatar}
              {damageText.filter((d) => !d.isPlayer).map((d) => (
                <span
                  key={d.id}
                  className={`absolute -top-6 font-extrabold text-lg font-heading animate-float-damage ${d.color}`}
                >
                  {d.text}
                </span>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-xl text-white">{monster.name}</h3>
                <span className="text-xs bg-crimson-500/20 text-crimson-400 border border-crimson-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  Lv.{monster.level}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Card {currentIndex + 1} of {queue.length} in current wave
              </p>
            </div>
          </div>

          {/* Monster HP Bar */}
          <div className="w-full sm:w-64">
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span className="text-crimson-400 flex items-center gap-1">
                <Skull className="w-3.5 h-3.5" /> Enemy HP
              </span>
              <span className="font-mono text-slate-300">
                {monster.currentHp} / {monster.maxHp}
              </span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="bg-gradient-to-r from-crimson-600 to-crimson-500 h-full rounded-full transition-all duration-500 shadow-md shadow-crimson-500/30"
                style={{ width: `${monsterHpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tactical Inventory Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Active Aegis Shields:
            </span>
            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
              {activeShields} Absorbs Fumbles
            </span>
          </div>

          <button
            onClick={handleUsePotion}
            className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-lg transition-colors font-medium"
          >
            <Heart className="w-3.5 h-3.5 fill-emerald-400" /> Use HP Potion (+40 HP)
          </button>
        </div>
      </div>

      {/* 3D Flippable Flashcard Arena */}
      <div className="perspective-1000 w-full min-h-[320px]">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full min-h-[320px] glass-card rounded-3xl p-8 cursor-pointer transition-transform duration-500 transform-style-preserve-3d shadow-2xl border border-slate-700/60 ${
            isFlipped ? 'rotate-y-180' : ''
          } ${
            transitionState === 'exit-left'
              ? 'animate-card-exit-left'
              : transitionState === 'exit-right'
              ? 'animate-card-exit-right'
              : transitionState === 'enter'
              ? 'animate-card-enter-next'
              : ''
          }`}
        >
          {/* Card Front Prompt */}
          <div className="absolute inset-0 p-8 backface-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
              <span className="uppercase tracking-widest font-mono font-semibold text-coral-400">
                PROMPT (FRONT)
              </span>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {currentCard.state}
                </span>
                <span className="text-slate-500 font-mono">Space to Flip</span>
              </div>
            </div>

            <div className="my-auto py-4">
              <CardContentRenderer content={currentCard.front_content} className="text-lg md:text-xl font-medium" />
            </div>

            <div className="text-center pt-4 border-t border-slate-800/80">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-coral-400 bg-coral-500/10 border border-coral-500/20 px-4 py-2 rounded-xl animate-pulse">
                Click Card or Press [Space] to Reveal Answer & Execute Attack
              </span>
            </div>
          </div>

          {/* Card Back Answer */}
          <div className="absolute inset-0 p-8 backface-hidden rotate-y-180 flex flex-col justify-between bg-slate-900/95 rounded-3xl border border-coral-500/30">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
              <span className="uppercase tracking-widest font-mono font-semibold text-emerald-400">
                ANSWER (BACK)
              </span>
              <span className="text-slate-500 font-mono">Grade Recall Honesty Below</span>
            </div>

            <div className="my-auto py-4">
              <CardContentRenderer content={currentCard.back_content} className="text-base md:text-lg" />
            </div>

            {currentCard.tags && currentCard.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {currentCard.tags.map((t, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recall Action Rating Buttons (1 to 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => handleRating(1)}
          disabled={!isFlipped}
          className={`glass-panel p-4 rounded-2xl border transition-all text-left group ${
            isFlipped
              ? 'hover:border-crimson-500 hover:bg-crimson-500/10 cursor-pointer border-slate-800'
              : 'opacity-50 cursor-not-allowed border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-heading font-extrabold text-sm text-crimson-400 group-hover:text-crimson-300">
              1: AGAIN
            </span>
            <span className="text-[10px] bg-crimson-500/20 text-crimson-300 px-1.5 py-0.5 rounded font-mono">
              Key 1
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">Fumble / Miss</p>
          <span className="text-xs font-mono font-bold text-crimson-400">Takes -20 DMG</span>
        </button>

        <button
          onClick={() => handleRating(2)}
          disabled={!isFlipped}
          className={`glass-panel p-4 rounded-2xl border transition-all text-left group ${
            isFlipped
              ? 'hover:border-amber-500 hover:bg-amber-500/10 cursor-pointer border-slate-800'
              : 'opacity-50 cursor-not-allowed border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-heading font-extrabold text-sm text-amber-400 group-hover:text-amber-300">
              2: HARD
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
              Key 2
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">Glancing Hit</p>
          <span className="text-xs font-mono font-bold text-amber-400">Deals 25 DMG</span>
        </button>

        <button
          onClick={() => handleRating(3)}
          disabled={!isFlipped}
          className={`glass-panel p-4 rounded-2xl border transition-all text-left group ${
            isFlipped
              ? 'hover:border-coral-500 hover:bg-coral-500/10 cursor-pointer border-slate-800'
              : 'opacity-50 cursor-not-allowed border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-heading font-extrabold text-sm text-coral-400 group-hover:text-coral-300">
              3: GOOD
            </span>
            <span className="text-[10px] bg-coral-500/20 text-coral-300 px-1.5 py-0.5 rounded font-mono">
              Key 3
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">Solid Strike</p>
          <span className="text-xs font-mono font-bold text-coral-400">Deals 45 DMG</span>
        </button>

        <button
          onClick={() => handleRating(4)}
          disabled={!isFlipped}
          className={`glass-panel p-4 rounded-2xl border transition-all text-left group ${
            isFlipped
              ? 'hover:border-emerald-500 hover:bg-emerald-500/10 cursor-pointer border-slate-800'
              : 'opacity-50 cursor-not-allowed border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-heading font-extrabold text-sm text-emerald-400 group-hover:text-emerald-300">
              4: EASY
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
              Key 4
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">Critical Strike</p>
          <span className="text-xs font-mono font-bold text-emerald-400">Deals 80 DMG</span>
        </button>
      </div>

      {/* Victory Modal */}
      {isVictoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-md w-full p-8 text-center border border-amber-500/50 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-coral-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-xl shadow-amber-500/30">
              <Award className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-heading font-extrabold text-white mb-2">VICTORY ACHIEVED!</h3>
            <p className="text-slate-300 text-sm mb-6">
              You cleared all {sessionReviewedCount} due review cards in this combat session.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">XP Earned:</span>
                <span className="font-bold text-amber-400">+{sessionReviewedCount * 10} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gold Looted:</span>
                <span className="font-bold text-amber-300">+{sessionReviewedCount * 5} Gold</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Streak Updated:</span>
                <span className="font-bold text-emerald-400">Active</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsVictoryModalOpen(false);
                onRefreshQueue();
              }}
              className="w-full bg-gradient-to-r from-coral-500 to-amber-500 hover:from-coral-600 hover:to-amber-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
            >
              Return to Quests
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
