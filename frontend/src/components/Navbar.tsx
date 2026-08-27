import React from 'react';
import { Swords, Layers, BarChart2, User as UserIcon, Flame, Coins, Heart, LogIn, LogOut } from 'lucide-react';
import { PlayerProfile } from '../types';

interface NavbarProps {
  activeTab: 'battle' | 'decks' | 'analytics' | 'profile';
  setActiveTab: (tab: 'battle' | 'decks' | 'analytics' | 'profile') => void;
  profile: PlayerProfile | null;
  userEmail: string | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  userEmail,
  onOpenAuth,
  onSignOut,
}) => {
  const hpPercent = profile ? Math.max(0, Math.min(100, (profile.current_hp / profile.max_hp) * 100)) : 100;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral-500 to-amber-500 flex items-center justify-center shadow-lg shadow-coral-500/20">
            <Swords className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-lg text-white tracking-wide leading-none flex items-center gap-2">
              MINDFORGE
              <span className="text-[10px] bg-coral-500/20 text-coral-400 border border-coral-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                RPG
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Spaced Repetition Battler</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('battle')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'battle'
                ? 'bg-coral-500 text-white shadow-md shadow-coral-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Swords className="w-4 h-4" /> Battle Arena
          </button>

          <button
            onClick={() => setActiveTab('decks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'decks'
                ? 'bg-coral-500 text-white shadow-md shadow-coral-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" /> Deck Manager
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-coral-500 text-white shadow-md shadow-coral-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Analytics
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-coral-500 text-white shadow-md shadow-coral-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UserIcon className="w-4 h-4" /> Profile
          </button>
        </nav>

        {/* RPG HUD & User Info */}
        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden sm:flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              {/* Level */}
              <div className="flex items-center gap-1.5 font-bold text-coral-400">
                <span className="bg-coral-500/20 px-2 py-0.5 rounded border border-coral-500/30">
                  Lv.{profile.level}
                </span>
              </div>

              {/* HP Bar */}
              <div className="w-24">
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
                    <Heart className="w-3 h-3 fill-emerald-500 text-emerald-500" /> HP
                  </span>
                  <span>{profile.current_hp}/{profile.max_hp}</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1 font-bold text-amber-400 border-l border-slate-800 pl-3">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{profile.streak_count}d</span>
              </div>

              {/* Gold */}
              <div className="flex items-center gap-1 font-bold text-amber-300 border-l border-slate-800 pl-3">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{profile.gold}</span>
              </div>
            </div>
          )}

          {/* Auth Button */}
          {userEmail ? (
            <button
              onClick={onSignOut}
              title={`Logged in as ${userEmail}`}
              className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-coral-500 hover:bg-coral-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg shadow-coral-500/20 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
