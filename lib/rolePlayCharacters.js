import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL;

const FEMALE_HAIR = ["longHairStraight", "longHairCurly", "longHairBob", "longHairBun"];
const MALE_HAIR = ["shortHairShortFlat", "shortHairShortWaved", "shortHairTheCaesar", "shortHairShortRound"];

// Generated locally (no network). Replace a character's `image` with a photo path to override.
function buildAvatar(id, gender, background) {
  return createAvatar(avataaars, {
    seed: id,
    top: gender === "female" ? FEMALE_HAIR : MALE_HAIR,
    facialHairProbability: gender === "female" ? 0 : 35,
    accessoriesProbability: 15,
    backgroundColor: [background],
  }).toDataUri();
}

const BACKGROUNDS = ["b6e3f4", "ffd5dc", "d1d4f9", "c0aede", "ffdfbf", "c1f0d0"];

// Audio characters learners hear in Role Play.
const CHARACTER_DEFINITIONS = [
  { id: "character-1", name: "Maya", accent: "American accent", lang: "en-US", gender: "female", color: "#c9a27e" },
  { id: "character-2", name: "Jack", accent: "Australian accent", lang: "en-AU", gender: "male", color: "#8d8a82" },
  { id: "character-3", name: "Emma", accent: "American accent", lang: "en-US", gender: "female", color: "#b4443a" },
  { id: "character-4", name: "Ethan", accent: "American accent", lang: "en-US", gender: "male", color: "#6b8f71" },
  { id: "character-5", name: "Charlotte", accent: "British accent", lang: "en-GB", gender: "female", color: "#7a6aa8" },
  { id: "character-6", name: "Oliver", accent: "British accent", lang: "en-GB", gender: "male", color: "#3f6c99" },
    { id: "character-7", name: "Angelica", accent: "Filipino accent", lang: "en-PH", gender: "female", color: "#d98f3e" },
    { id: "character-8", name: "Miguel", accent: "Filipino accent", lang: "en-PH", gender: "male", color: "#2f8f83" },
];

export const ROLE_PLAY_CHARACTERS = CHARACTER_DEFINITIONS.map((character, index) => ({
  ...character,
  image: character.image || buildAvatar(character.id, character.gender, BACKGROUNDS[index % BACKGROUNDS.length]),
}));

export function getRolePlayCharacter(id) {
  return ROLE_PLAY_CHARACTERS.find((character) => character.id === id) || ROLE_PLAY_CHARACTERS[0];
}

const FEMALE_HINT = /female|woman|samantha|aria|jenny|zira|hazel|susan|karen|catherine|libby|sonia|rosa|blessica|natasha|clara|neerja|michelle|emma|ana|maisie|heera|linda|sara|eva|victoria|allison|ava|joanna/i;
const MALE_HINT = /\bmale\b|\bman\b|daniel|david|mark|guy|james|george|ryan|william|richard|angelo|thomas|prabhat|christopher|eric|roger|steffan|brian|liam|tom\b|alex|fred|aaron/i;

const isFemaleVoice = (voice) => FEMALE_HINT.test(voice.name);
const isMaleVoice = (voice) => !isFemaleVoice(voice) && MALE_HINT.test(voice.name);
const normalizeLang = (lang) => String(lang || "").replace("_", "-").toLowerCase();

function scoreVoice(character, voice) {
  const lang = normalizeLang(voice.lang);
  const target = character.lang.toLowerCase();
  let score = 0;
  if (lang === target) score += 100;
  else if (target === "en-ph" && (lang === "fil-ph" || lang === "tl-ph")) score += 60;
  else if (lang.startsWith("en")) score += 10;
  else return -1;
  if (character.gender === "female" ? isFemaleVoice(voice) : isMaleVoice(voice)) score += 40;
  else if (isFemaleVoice(voice) || isMaleVoice(voice)) score -= 40;
  if (/natural|online/i.test(voice.name)) score += 5;
  return score;
}

// Gives every character its own voice (no two characters share one) and
// reports whether the voice truly matches the character's accent.
function resolveVoice(character, voices) {
  const taken = new Set();
  let result = null;
  for (const current of ROLE_PLAY_CHARACTERS) {
    const ranked = voices
      .map((voice) => ({ voice, score: scoreVoice(current, voice) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score);
    const pick = ranked.find((entry) => !taken.has(entry.voice.voiceURI)) || ranked[0];
    if (pick) taken.add(pick.voice.voiceURI);
    if (current.id === character.id) {
      result = pick ? { voice: pick.voice, exact: normalizeLang(pick.voice.lang) === current.lang.toLowerCase() } : null;
    }
  }
  return result;
}

// Fallback pitch/rate shaping so characters still sound different without matching voices.
const VOICE_TUNING = {
  "character-1": { pitch: 1.1, rate: 1 },
  "character-2": { pitch: 0.85, rate: 1.02 },
  "character-3": { pitch: 1.2, rate: 0.96 },
  "character-4": { pitch: 0.75, rate: 0.98 },
  "character-5": { pitch: 1, rate: 0.95 },
  "character-6": { pitch: 0.9, rate: 0.93 },
  "character-7": { pitch: 1.15, rate: 1.04 },
  "character-8": { pitch: 0.8, rate: 1.04 },
};

// Previews use browser voices, matching the accent and (when detectable) gender.
function speakWithBrowser(character, text, { rate = 1, onEnd } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(
    text || `Hi, I'm ${character.name}. Shall we get started?`,
  );
  utterance.rate = rate;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  const resolved = resolveVoice(character, synth.getVoices());
  const tuning = VOICE_TUNING[character.id] || { pitch: 1, rate: 1 };
  if (resolved) {
    utterance.voice = resolved.voice;
    utterance.lang = resolved.voice.lang;
    // Only reshape the voice when it isn't a true accent match.
    if (!resolved.exact) utterance.pitch = tuning.pitch;
  } else {
    utterance.lang = character.lang;
    utterance.pitch = tuning.pitch;
  }
  utterance.rate = rate * (resolved?.exact ? 1 : tuning.rate);
  // Held on window so the utterance isn't garbage-collected before its end event fires.
  window.__rolePlayUtterance = utterance;
  synth.speak(utterance);
  return true;
}

let playToken = 0;
let activeAudio = null;

export function stopRolePlayVoice() {
  playToken += 1;
  if (activeAudio) {
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.pause();
    activeAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

// Plays neural server voices (real accents); falls back to browser voices if unavailable.
export function previewRolePlayVoice(character, text, { rate = 1, onEnd } = {}) {
  if (typeof window === "undefined") return false;
  stopRolePlayVoice();
  const token = playToken;
  const line = text || `Hi, I'm ${character.name}. Shall we get started?`;
  const fallback = () => {
    if (token !== playToken) return;
    if (!speakWithBrowser(character, line, { rate, onEnd })) onEnd?.();
  };
  BaseApi.post(`${API}/role-play/tts`, { voice: character.id, text: line })
    .then((response) => {
      if (token !== playToken) return;
      const audioData = response?.data?.data?.audio;
      if (!audioData) return fallback();
      const audio = new Audio(`data:audio/mpeg;base64,${audioData}`);
      audio.playbackRate = rate;
      audio.onended = () => onEnd?.();
      audio.onerror = () => fallback();
      activeAudio = audio;
      audio.play().catch(fallback);
    })
    .catch(fallback);
  return true;
}
