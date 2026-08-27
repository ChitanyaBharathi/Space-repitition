import React from 'react';
import { WifiOff, LogOut, AlertCircle, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  onRetry: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry }) => (
  <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2 flex items-center justify-between text-sm animate-pulse">
    <div className="flex items-center gap-2">
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span>Backend connection offline. Requests will queue up or retry.</span>
    </div>
    <button
      onClick={onRetry}
      className="flex items-center gap-1 bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 px-3 py-1 rounded text-xs transition-colors"
    >
      <RefreshCw className="w-3 h-3" /> Retry Connection
    </button>
  </div>
);

interface AuthExpiredModalProps {
  onReLogin: () => void;
}

export const AuthExpiredModal: React.FC<AuthExpiredModalProps> = ({ onReLogin }) => (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
    <div className="glass-panel rounded-2xl max-w-md w-full p-6 text-center border border-coral-500/40 shadow-2xl">
      <div className="w-12 h-12 bg-coral-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-coral-500">
        <LogOut className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-heading font-bold text-white mb-2">Session Expired</h3>
      <p className="text-slate-300 text-sm mb-6">
        Your authentication token has expired. Please log in again to save your card progress and review logs.
      </p>
      <button
        onClick={onReLogin}
        className="w-full bg-coral-500 hover:bg-coral-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-coral-500/25"
      >
        Sign In Again
      </button>
    </div>
  </div>
);

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-50 bg-crimson-500/90 text-white px-4 py-3 rounded-xl shadow-2xl border border-crimson-400 flex items-center gap-3 max-w-md animate-bounce">
    <AlertCircle className="w-5 h-5 flex-shrink-0" />
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onDismiss} className="ml-auto text-crimson-200 hover:text-white text-sm font-bold">
      ×
    </button>
  </div>
);

export const LoadingSkeleton: React.FC<{ label?: string }> = ({ label = 'Loading MindForge...' }) => (
  <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-coral-500/20 border-t-coral-500 animate-spin"></div>
      <div className="absolute inset-2 rounded-full border-4 border-emerald-500/20 border-b-emerald-500 animate-spin flex items-center justify-center">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
      </div>
    </div>
    <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">{label}</p>
  </div>
);
