/**
 * Network Detection & Server Resolution Utilities
 * Supports cloud (online), local hotspot fallback, and localhost dev mode
 */

// ==========================================
// SERVER CONFIGURATION
// ==========================================

const SERVER_URLS = {
  // Backend API URL (set via environment variable)
  // For Vercel: Set REACT_APP_CLOUD_SERVER in Vercel dashboard > Settings > Environment Variables
  // Format: https://your-backend-api-url.com (without /api suffix)
  // Default: Backend API at https://pos-backend-sooty.vercel.app
  cloud: process.env.REACT_APP_CLOUD_SERVER || process.env.REACT_APP_BACKEND_URL || 'https://pos-backend-sooty.vercel.app',
  
  // Local hotspot (Admin laptop creates WiFi hotspot)
  // This is the IP address when admin laptop creates hotspot
  local: process.env.REACT_APP_LOCAL_SERVER || 'http://192.168.137.1:3001',

  // Development fallback
  localhost: 'http://localhost:3001'
};

let cachedMode = null;
let lastCheck = 0;
const CACHE_DURATION = 5000; // Cache for 5 seconds

/**
 * Check if a server is reachable
 * @param {string} url - Server URL to test
 * @param {number} timeout - Timeout in ms (default 2000)
 * @returns {Promise<boolean>} - True if server responds
 */
export async function isServerAvailable(url, timeout = 2000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });

    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ Server available: ${url}`);
      return true;
    }
    
    return false;
  } catch (err) {
    console.log(`❌ Server unavailable: ${url} - ${err.message}`);
    return false;
  }
}

/**
 * Get the best available server URL
 * Priority: Cloud > Local Hotspot > Localhost
 * @returns {Promise<{url: string, mode: string}>} - {url, mode('online'|'local'|'localhost')}
 */
export async function getServerUrl() {
  const now = Date.now();
  
  // Use cache if fresh
  if (cachedMode && (now - lastCheck) < CACHE_DURATION) {
    return { 
      url: SERVER_URLS[cachedMode],
      mode: cachedMode === 'cloud' ? 'online' : cachedMode
    };
  }

  console.log('🔍 Detecting best server...');

  // Try cloud server first (if online)
  if (navigator.onLine && SERVER_URLS.cloud !== SERVER_URLS.localhost) {
    if (await isServerAvailable(SERVER_URLS.cloud, 2000)) {
      cachedMode = 'cloud';
      lastCheck = now;
      console.log('🌐 Using CLOUD server:', SERVER_URLS.cloud);
      return { url: SERVER_URLS.cloud, mode: 'online' };
    }
  }

  // Try local hotspot fallback
  if (await isServerAvailable(SERVER_URLS.local, 2000)) {
    cachedMode = 'local';
    lastCheck = now;
    console.log('📡 Using LOCAL HOTSPOT server:', SERVER_URLS.local);
    return { url: SERVER_URLS.local, mode: 'local' };
  }

  // Fallback to localhost for development
  cachedMode = 'localhost';
  lastCheck = now;
  console.log('💻 Using LOCALHOST server:', SERVER_URLS.localhost);
  return { url: SERVER_URLS.localhost, mode: 'localhost' };
}

/**
 * Check browser online status
 * @returns {boolean} - True if navigator.onLine is true
 */
export function isBrowserOnline() {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 * @param {Function} onOnline - Callback when online
 * @param {Function} onOffline - Callback when offline
 * @returns {Function} - Cleanup function to remove listeners
 */
export function listenToNetworkChanges(onOnline, onOffline) {
  const handleOnline = () => {
    console.log('🌐 Browser is ONLINE');
    onOnline();
  };
  
  const handleOffline = () => {
    console.log('📵 Browser is OFFLINE');
    onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Invalidate the server cache to force re-detection
 */
export function invalidateServerCache() {
  console.log('🔄 Server cache invalidated');
  cachedMode = null;
  lastCheck = 0;
}

/**
 * Perform periodic server health checks
 * @param {number} intervalMs - Check interval in milliseconds (default 30000)
 * @returns {Function} - Cleanup function to stop the interval
 */
export function startHealthChecks(intervalMs = 30000) {
  console.log(`⏰ Starting health checks every ${intervalMs}ms`);
  
  const interval = setInterval(() => {
    invalidateServerCache();
  }, intervalMs);

  return () => {
    console.log('⏹️ Health checks stopped');
    clearInterval(interval);
  };
}