import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getServerUrl,
  isBrowserOnline,
  listenToNetworkChanges,
  invalidateServerCache,
  startHealthChecks
} from '../utils/network';

const NetworkContext = createContext(null);

/**
 * Network Provider - manages connectivity state and server selection
 */
export function NetworkProvider({ children }) {
  const [serverUrl, setServerUrl] = useState('http://localhost:5000');
  const [mode, setMode] = useState('disconnected'); // 'online' | 'local' | 'localhost' | 'disconnected'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Detect server on mount and periodically
  const detectServer = useCallback(async () => {
    try {
      const { url, mode: detectedMode } = await getServerUrl();
      setServerUrl(url);
      setMode(isOnline ? detectedMode : 'disconnected');
      setLastError(null);
    } catch (err) {
      console.error('Server detection failed:', err);
      setLastError(err.message);
      setMode('disconnected');
    }
  }, [isOnline]);

  // Initial server detection
  useEffect(() => {
    detectServer();
  }, [detectServer]);

  // Listen for online/offline events
  useEffect(() => {
    const cleanup = listenToNetworkChanges(
      () => {
        setIsOnline(true);
        invalidateServerCache();
        detectServer();
      },
      () => {
        setIsOnline(false);
        setMode('disconnected');
      }
    );

    return cleanup;
  }, [detectServer]);

  // Start periodic health checks (every 30 seconds)
  useEffect(() => {
    const cleanup = startHealthChecks(30000);
    return cleanup;
  }, []);

  // Re-detect server when cache invalidates
  useEffect(() => {
    const timer = setInterval(() => {
      detectServer();
    }, 5000); // Check every 5 seconds if browser is online

    return () => clearInterval(timer);
  }, [detectServer]);

  // Auto-sync queued orders when we become online
  useEffect(() => {
    let interval = null;

    const tryFlush = async () => {
      if (!isOnline) return;

      try {
        const queued = await import('../services/offlineQueue').then(m => m.getQueuedOrders(true));
        if (!queued || queued.length === 0) return;

        const { url } = await getServerUrl();
        // POST batch
        const resp = await fetch(`${url}/sync/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queued)
        });

        if (resp.ok || resp.status === 202 || resp.status === 207) {
          const data = await resp.json();
          // If orders synced successfully, mark them as synced locally
          if (data.synced && data.synced > 0) {
            const ids = (data.orders || []).map(o => o.id).filter(Boolean);
            if (ids.length) {
              await import('../services/offlineQueue').then(m => m.markOrdersAsSynced(ids));
            }
          }
          // If storedInFallback, they are stored on server memory (no change locally)
        }
      } catch (err) {
        console.warn('Auto-sync attempt failed:', err.message);
      }
    };

    if (isOnline) {
      // Try immediately, then periodically
      tryFlush();
      interval = setInterval(tryFlush, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnline, detectServer]);

  const value = {
    serverUrl,
    mode,
    isOnline,
    queuedCount,
    setQueuedCount,
    syncing,
    setSyncing,
    lastError,
    detectServer,
    invalidateCache: invalidateServerCache
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * Hook to use network context
 */
export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}
