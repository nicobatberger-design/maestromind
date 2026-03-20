/**
 * MAESTROMIND — Gestion securisee du localStorage
 * Guard quota + nettoyage automatique
 */

// Ecriture securisee avec gestion quota
export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    // Quota depasse — nettoyage automatique
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      cleanOldData();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch { return false; }
    }
    return false;
  }
}

// Estimation taille localStorage en Mo
export function getStorageSize() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    total += (key.length + (localStorage.getItem(key) || '').length) * 2;
  }
  return (total / 1024 / 1024).toFixed(2);
}

// Nettoyage intelligent — supprime les vieux chats puis les vieilles photos
function cleanOldData() {
  // 1. Trouver les conversations les plus anciennes (prefix mm_chat_)
  const chatKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('mm_chat_') || key.startsWith('bl_chat_')) {
      chatKeys.push(key);
    }
  }
  // Supprimer les 5 plus petites conversations
  chatKeys.sort((a, b) => (localStorage.getItem(a) || '').length - (localStorage.getItem(b) || '').length);
  chatKeys.slice(0, 5).forEach(k => localStorage.removeItem(k));

  // 2. Nettoyer le cache geoloc
  localStorage.removeItem('mm_geo_cache');
}

// ── File d'attente hors-ligne ──────────────────────────────────
export function addToOfflineQueue(message) {
  try {
    const queue = JSON.parse(localStorage.getItem('mm_offline_queue') || '[]');
    queue.push({ ...message, queuedAt: Date.now() });
    safeSetItem('mm_offline_queue', JSON.stringify(queue));
  } catch {}
}

export function getOfflineQueue() {
  try { return JSON.parse(localStorage.getItem('mm_offline_queue') || '[]'); } catch { return []; }
}

export function clearOfflineQueue() {
  localStorage.removeItem('mm_offline_queue');
}
