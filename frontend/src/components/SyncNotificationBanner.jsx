import React, { useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, X, Cloud } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SyncNotificationBanner() {
  const { 
    isOnline, 
    setIsOnline,
    isSyncing, 
    lastSyncNotification, 
    clearSyncNotification, 
    pendingSyncCount, 
    syncOfflineScans,
    clearOfflineQueue,
  } = useApp();

  // Auto-dismiss success notifications after 6 seconds
  useEffect(() => {
    if (lastSyncNotification && (lastSyncNotification.type === 'sync_success' || lastSyncNotification.type === 'online_success')) {
      const timer = setTimeout(() => {
        clearSyncNotification();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [lastSyncNotification, clearSyncNotification]);

  if (!lastSyncNotification && isOnline) {
    return null;
  }

  // If currently offline and no special notification, show persistent offline indicator
  const notification = lastSyncNotification || (!isOnline ? {
    type: 'offline_active',
    message: `Offline Mode Active (Rural Health Session). All screenings are saved locally on this device (${pendingSyncCount} in queue).`
  } : null);

  if (!notification) return null;

  const isSuccess = notification.type === 'sync_success' || notification.type === 'online_success';
  const isOffline = notification.type === 'stored_offline' || notification.type === 'offline_active';
  const isError = notification.type === 'sync_error';

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div 
        className={`p-4 rounded-2xl shadow-elevated border flex items-start gap-3 backdrop-blur-md transition-all ${
          isSuccess 
            ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40 shadow-emerald-900/30' 
            : isOffline 
            ? 'bg-amber-950/90 text-amber-100 border-amber-500/40 shadow-amber-900/30'
            : isError
            ? 'bg-rose-950/90 text-rose-100 border-rose-500/40 shadow-rose-900/30'
            : 'bg-slate-900/90 text-slate-100 border-slate-700/50 shadow-black/40'
        }`}
      >
        <div className="mt-0.5 flex-shrink-0">
          {isSyncing ? (
            <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : isOffline ? (
            <WifiOff className="w-5 h-5 text-amber-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-black uppercase tracking-wider">
              {isSyncing 
                ? 'Central Server Sync' 
                : isSuccess 
                ? 'Cloud Sync Verified' 
                : isOffline 
                ? 'Offline Vault Active' 
                : 'Sync Notice'}
            </span>
            {pendingSyncCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white/20 text-white">
                {pendingSyncCount} pending
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed opacity-90 font-medium">
            {notification.message}
          </p>

          {/* Action button if offline or has pending items */}
          {pendingSyncCount > 0 && !isSyncing && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={syncOfflineScans}
                className="px-3 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Now</span>
              </button>
              <button
                onClick={clearOfflineQueue}
                className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                title="Clear pending offline records"
              >
                Clear Queue
              </button>
              {!isOnline && (
                <button
                  onClick={() => setIsOnline(true)}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Switch to Online
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={clearSyncNotification}
          className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
