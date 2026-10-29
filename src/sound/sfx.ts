/**
 * Paper-and-crayon sound effects, synthesised with Web Audio: no audio files to download and no
 * licences to track. Off until the visitor turns sound on; the choice is remembered on their device.
 */

const STORAGE_KEY = 'crayon-sound';

let enabled = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
})();

let audio: AudioContext | null = null;
let noise: AudioBuffer | null = null;

export const soundEnabled = () => enabled;

export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // storage blocked: the choice just lasts for this visit
  }
}

/** The audio context and a second of white noise, made on first use (browsers need a click first anyway). */
function ready(): { ac: AudioContext; buf: AudioBuffer } | null {
  if (!enabled || typeof AudioContext === 'undefined') return null;
  audio ??= new AudioContext();
  if (audio.state === 'suspended') void audio.resume();
  if (!noise) {
    noise = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return { ac: audio, buf: noise };
}

/** One short burst of filtered noise: the basic crayon-on-paper sound. */
function scratch(at: number, length: number, pitch: number, volume: number) {
  const r = ready();
  if (!r) return;
  const { ac, buf } = r;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = pitch * (0.9 + Math.random() * 0.2);
  band.Q.value = 0.9;
  const gain = ac.createGain();
  const t = ac.currentTime + at;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  src.connect(band).connect(gain).connect(ac.destination);
  src.start(t, Math.random() * 0.5);
  src.stop(t + length + 0.02);
}

/** A crayon tapped on paper: for clicks on buttons and links. */
export function playTap() {
  scratch(0, 0.07, 3000, 0.22);
}

/** A quick back-and-forth scribble: for moving around the page (navbar links). */
export function playScribble() {
  for (let i = 0; i < 4; i++) scratch(i * 0.055, 0.075, 1700 + (i % 2) * 500, 0.16);
}
