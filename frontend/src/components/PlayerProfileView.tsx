import React from 'react';
import { PlayerProfile } from '../types';
import { User, Shield, Zap, Heart, Coins, Flame, Award, Package } from 'lucide-react';

interface PlayerProfileViewProps {
  profile: PlayerProfile | null;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({ profile }) => {
  if (!profile) return null;

  const currentLevelXp = profile.experience % 100;
  const xpPercent = currentLevelXp;
  const hpPercent = Math.max(0, Math.min(100, (profile.current_hp / profile.max_hp) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Profile Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-coral-500 to-amber-500 flex items-center justify-center text-4xl shadow-2xl shadow-coral-500/30 border-2 border-white/20">
            🧙‍♂️
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-heading font-extrabold text-2xl text-white">Adventurer Profile</h2>
              <span className="bg-coral-500/20 text-coral-400 border border-coral-500/30 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold">
                Level {profile.level} Master
              </span>
            </div>

            {/* Level XP Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>XP Progress</span>
                <span className="text-amber-400 font-bold">{currentLevelXp} / 100 XP</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-coral-500 h-full rounded-full transition-all duration-500 shadow-md shadow-amber-500/20"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RPG Combat Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* HP */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Heart className="w-4 h-4 fill-emerald-400" /> Max Health
            </span>
            <span className="font-mono">{profile.current_hp} / {profile.max_hp}</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${hpPercent}%` }} />
          </div>
        </div>

        {/* Gold */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Gold Looted</span>
            <h4 className="text-2xl font-heading font-bold text-amber-300 mt-0.5">{profile.gold} Gold</h4>
          </div>
          <Coins className="w-8 h-8 text-amber-400" />
        </div>

        {/* Streak */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Daily Streak</span>
            <h4 className="text-2xl font-heading font-bold text-coral-400 mt-0.5">{profile.streak_count} Days</h4>
          </div>
          <Flame className="w-8 h-8 text-coral-500" />
        </div>
      </div>

      {/* Inventory & Equipped Relics */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-400" /> Equipped Relics & Inventory
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 text-xl">
              🛡️
            </div>
            <div>
              <h4 className="font-heading font-bold text-white text-sm">Aegis Mistake Shield</h4>
              <p className="text-xs text-slate-400">Absorbs 1 "Again" fumble per battle encounter without penalty.</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 text-xl">
              🧪
            </div>
            <div>
              <h4 className="font-heading font-bold text-white text-sm">Elixir of Recall</h4>
              <p className="text-xs text-slate-400">Restores +40 Player HP mid-battle encounter.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
