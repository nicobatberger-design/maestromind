/**
 * MAESTROMIND — Text-to-Speech (voix française)
 * Utilise Web Speech API (gratuit, natif navigateur)
 * Sélectionne la meilleure voix française disponible
 */

let bestVoice = null;
let voicesLoaded = false;

function loadVoices() {
  if (voicesLoaded) return;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return;
  voicesLoaded = true;

  // Chercher la meilleure voix FR dans l'ordre de préférence
  const frVoices = voices.filter(v => v.lang.startsWith("fr"));

  // Priorité : Google > Microsoft > Apple > autre
  const priorities = ["Google", "Microsoft", "Amelie", "Thomas", "Marie", "Audrey"];
  for (const prio of priorities) {
    const match = frVoices.find(v => v.name.includes(prio));
    if (match) { bestVoice = match; return; }
  }
  // Fallback : première voix FR femme, sinon première FR
  bestVoice = frVoices.find(v => v.name.toLowerCase().includes("female")) || frVoices[0] || null;
}

// Charger les voix au démarrage (Chrome les charge en async)
if (typeof speechSynthesis !== "undefined") {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

/** État global du TTS */
let currentUtterance = null;

/**
 * Lire un texte à voix haute
 * @param {string} text - Le texte à lire
 * @param {function} onStart - Callback au début de la lecture
 * @param {function} onEnd - Callback à la fin de la lecture
 */
export function speak(text, onStart, onEnd) {
  if (!("speechSynthesis" in window)) return;

  // Stop si déjà en cours
  stop();

  // Nettoyer le texte (enlever markdown, emojis techniques, etc.)
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/[📋📐💰🛡️🛒🏅📄📊📅🔍💧⚡🔧📸🎙🆘📷🚨🔴🔵⚠️✅❌⭐①②③④⑤⑥⑦]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    .trim();

  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = "fr-FR";
  utterance.rate = 1.05; // Légèrement plus rapide que normal
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (bestVoice) utterance.voice = bestVoice;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => { currentUtterance = null; onEnd?.(); };
  utterance.onerror = () => { currentUtterance = null; onEnd?.(); };

  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
}

/** Arrêter la lecture en cours */
export function stop() {
  if (currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
  }
}

/** Vérifier si une lecture est en cours */
export function isSpeaking() {
  return speechSynthesis.speaking;
}

/** Vérifier si le TTS est supporté */
export function isTTSSupported() {
  return "speechSynthesis" in window;
}
