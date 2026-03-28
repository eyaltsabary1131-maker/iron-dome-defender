let audioContext: AudioContext | null = null;
let initPromise: Promise<void> | null = null;
let audioMuted = false;

export function setAudioMuted(muted: boolean): void {
  audioMuted = muted;
  if (muted) {
    stopTacticalDrone();
  }
}

export function isAudioMuted(): boolean {
  return audioMuted;
}

export function getAudioContext(): AudioContext | null {
  return audioContext;
}

export function initAudio(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) {
    return Promise.resolve();
  }
  if (!initPromise) {
    initPromise = (async () => {
      if (!audioContext) {
        audioContext = new Ctx();
      }
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
    })();
  }
  return initPromise;
}

function isRunning(): boolean {
  return audioContext !== null && audioContext.state === "running";
}

function canOutputSound(): boolean {
  return !audioMuted && isRunning();
}

/** Dry fire / empty magazine — short mechanical click */
export function playDryFireClick(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(420, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.02);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.04);
}

export function playShoot(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(920, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.07);
  g.gain.setValueAtTime(0.1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.085);
}

export function playExplosion(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const dur = 0.38;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const decay = 1 - i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * decay * decay;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(60, c.currentTime + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.28, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start();
  src.stop(c.currentTime + dur);
}

export function playPowerUp(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const freqs = [523.25, 659.25, 783.99, 1046.5];
  const t0 = c.currentTime;
  freqs.forEach((freq, i) => {
    const start = t0 + i * 0.055;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.14, start + 0.018);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.11);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.12);
  });
}

/** Iron Beam — sharp electronic zap */
export function playLaserZap(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const t0 = c.currentTime;
  const dur = 0.11;
  const noiseSize = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, noiseSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < noiseSize; i++) {
    const gate = 1 - i / noiseSize;
    data[i] = (Math.random() * 2 - 1) * gate * gate * 0.55;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(1200, t0);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(2800, t0);
  bp.Q.setValueAtTime(2.2, t0);
  const g = c.createGain();
  g.gain.setValueAtTime(0.2, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(hp);
  hp.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur);

  const z = c.createOscillator();
  const zg = c.createGain();
  z.type = "square";
  z.frequency.setValueAtTime(2200, t0);
  z.frequency.exponentialRampToValueAtTime(8800, t0 + 0.045);
  zg.gain.setValueAtTime(0, t0);
  zg.gain.linearRampToValueAtTime(0.09, t0 + 0.006);
  zg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
  z.connect(zg);
  zg.connect(c.destination);
  z.start(t0);
  z.stop(t0 + 0.095);
}

/** Same-color crate — short ascending reward jingle */
export function playPowerUpLevelUp(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const freqs = [392, 523.25, 659.25, 783.99, 987.77];
  const t0 = c.currentTime;
  freqs.forEach((freq, i) => {
    const start = t0 + i * 0.048;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.12, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.15);
  });
}

/** Short triumphant sting when an in-run achievement unlocks */
export function playAchievementSound(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const t0 = c.currentTime;
  const freqs = [392, 523.25, 659.25, 783.99, 987.77];
  freqs.forEach((freq, i) => {
    const start = t0 + i * 0.042;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.11, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.17);
  });
}

export function playBossWarning(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const steps = 14;
  for (let i = 0; i < steps; i++) {
    const start = c.currentTime + i * 0.1;
    const osc = c.createOscillator();
    const g = c.createGain();
    const freq = i % 2 === 0 ? 380 : 520;
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.linearRampToValueAtTime(freq * 1.35, start + 0.08);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.11, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.1);
  }
}

export function playJokerNuke(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const dur = 1.1;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    const decay = (1 - t) * (1 - t);
    const rumble = Math.sin(i * 0.012) * 0.45;
    const noise = (Math.random() * 2 - 1) * 0.55;
    data[i] = (noise + rumble) * decay;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const low = c.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.setValueAtTime(2200, c.currentTime);
  low.frequency.exponentialRampToValueAtTime(90, c.currentTime + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.42, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur);
  src.connect(low);
  low.connect(g);
  g.connect(c.destination);
  src.start();
  src.stop(c.currentTime + dur);

  const t0 = c.currentTime;
  const sub = c.createOscillator();
  const sg = c.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(55, t0);
  sub.frequency.exponentialRampToValueAtTime(18, t0 + dur);
  sg.gain.setValueAtTime(0.22, t0);
  sg.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  sub.connect(sg);
  sg.connect(c.destination);
  sub.start(t0);
  sub.stop(t0 + dur);
}

export function playWaveAlert(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const start = c.currentTime + i * 0.12;
    const osc = c.createOscillator();
    const g = c.createGain();
    const freq = i % 2 === 0 ? 720 : 540;
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.1, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.11);
  }
}

/** Red Alert swarm — urgent dual-tone siren */
export function playRedAlertSiren(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const cycles = 10;
  for (let i = 0; i < cycles; i++) {
    const start = c.currentTime + i * 0.18;
    for (const freq of [580, 920] as const) {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.11, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(start);
      osc.stop(start + 0.15);
    }
  }
}

/** Fighter pass + whoosh */
export function playJetFlyby(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const dur = 1.35;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    const sweep = Math.sin(t * Math.PI);
    const center = 0.35 + t * 0.55;
    const noise = (Math.random() * 2 - 1) * sweep;
    data[i] = noise * (0.35 + sweep * 0.45);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.65;
  const t0 = c.currentTime;
  bp.frequency.setValueAtTime(280, t0);
  bp.frequency.exponentialRampToValueAtTime(2400, t0 + dur * 0.55);
  bp.frequency.exponentialRampToValueAtTime(400, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.22, t0 + 0.08);
  g.gain.linearRampToValueAtTime(0.28, t0 + dur * 0.45);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur);
}

/** Short boom after jet strike (lighter than full nuke) */
export function playTacticalStrikeImpact(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const dur = 0.55;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    const decay = (1 - t) * (1 - t);
    data[i] = (Math.random() * 2 - 1) * decay * 0.85;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const low = c.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.setValueAtTime(1800, c.currentTime);
  low.frequency.exponentialRampToValueAtTime(120, c.currentTime + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.38, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur);
  src.connect(low);
  low.connect(g);
  g.connect(c.destination);
  src.start();
  src.stop(c.currentTime + dur);
}

/**
 * Pleasant “upgrade unlocked” chime for armory purchases — C major arpeggio,
 * soft triangle voices with a gentle release tail.
 */
export function playPurchaseChime(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const t0 = c.currentTime;
  /** C4 → E4 → G4 → C5 */
  const freqs = [261.63, 329.63, 392.0, 523.25];
  const step = 0.07;
  const noteDur = 0.42;

  freqs.forEach((freq, i) => {
    const t = t0 + i * step;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + noteDur + 0.02);
  });

  const tShimmer = t0 + (freqs.length - 1) * step + 0.04;
  const hi = c.createOscillator();
  const hg = c.createGain();
  hi.type = "sine";
  hi.frequency.setValueAtTime(1046.5, tShimmer);
  hg.gain.setValueAtTime(0, tShimmer);
  hg.gain.linearRampToValueAtTime(0.035, tShimmer + 0.03);
  hg.gain.exponentialRampToValueAtTime(0.001, tShimmer + 0.55);
  hi.connect(hg);
  hg.connect(c.destination);
  hi.start(tShimmer);
  hi.stop(tShimmer + 0.58);
}

/** Distorted radio burst (procurement / comms) */
export function playRadioChatter(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const dur = 0.42;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const crackle = (Math.random() * 2 - 1) * 0.9;
    const voice = Math.sin(i * 0.07) * Math.sin(i * 0.031) * 0.25;
    const gate = i < bufferSize * 0.15 || i > bufferSize * 0.85 ? 0.4 : 1;
    data[i] = (crackle + voice) * gate;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const distort = c.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = Math.tanh(x * 3.2);
  }
  distort.curve = curve;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 380;
  const g = c.createGain();
  g.gain.setValueAtTime(0.2, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur);
  src.connect(distort);
  distort.connect(hp);
  hp.connect(g);
  g.connect(c.destination);
  src.start();
  src.stop(c.currentTime + dur);
}

let droneOsc: OscillatorNode | null = null;
let droneFilter: BiquadFilterNode | null = null;
let droneGain: GainNode | null = null;

export function isTacticalDroneRunning(): boolean {
  return droneOsc !== null;
}

export function startTacticalDrone(): void {
  if (typeof window === "undefined") return;
  if (audioMuted) return;
  if (!audioContext || audioContext.state !== "running") return;
  stopTacticalDrone();
  const c = audioContext;
  droneOsc = c.createOscillator();
  droneOsc.type = "sawtooth";
  droneOsc.frequency.value = 52;
  droneFilter = c.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 420;
  droneGain = c.createGain();
  droneGain.gain.value = 0.028;
  droneOsc.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(c.destination);
  droneOsc.start();
}

export function stopTacticalDrone(): void {
  try {
    droneOsc?.stop();
  } catch {
    /* already stopped */
  }
  droneOsc = null;
  droneFilter = null;
  droneGain = null;
}

/** Raise pitch / brightness / level as more threats are on screen */
export function setTacticalDroneTension(enemyCount: number): void {
  if (audioMuted) return;
  if (!droneOsc || !droneFilter || !droneGain || !audioContext) return;
  const c = audioContext;
  const t = c.currentTime;
  const n = Math.min(Math.max(0, enemyCount), 45);
  const stress = n / 45;
  droneOsc.frequency.cancelScheduledValues(t);
  droneOsc.frequency.linearRampToValueAtTime(48 + stress * 95, t + 0.12);
  droneFilter.frequency.cancelScheduledValues(t);
  droneFilter.frequency.linearRampToValueAtTime(320 + stress * 2400, t + 0.15);
  droneGain.gain.cancelScheduledValues(t);
  droneGain.gain.linearRampToValueAtTime(0.022 + stress * 0.085, t + 0.12);
}

/** Short ceremonial fanfare for rank promotion */
export function playMilitaryFanfare(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const notes = [392, 523.25, 659.25, 783.99];
  const t0 = c.currentTime;
  notes.forEach((freq, i) => {
    const start = t0 + i * 0.11;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.13, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
  const buzz = c.createOscillator();
  const bg = c.createGain();
  buzz.type = "square";
  buzz.frequency.setValueAtTime(880, t0 + 0.35);
  bg.gain.setValueAtTime(0, t0 + 0.34);
  bg.gain.linearRampToValueAtTime(0.04, t0 + 0.36);
  bg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.65);
  buzz.connect(bg);
  bg.connect(c.destination);
  buzz.start(t0 + 0.34);
  buzz.stop(t0 + 0.66);
}

/** Mouse wheel volley step — short mechanical click/clack */
export function playVolleyChange(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const t0 = c.currentTime;
  const click = (start: number, freq: number) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.045, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.022);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.028);
  };
  click(t0, 620);
  click(t0 + 0.032, 380);
}

/** Left+right manual reload — pump / chamber */
export function playManualReload(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(95, t0);
  osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.045);
  osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.11);
  g.gain.setValueAtTime(0.11, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + 0.15);

  const clack = c.createOscillator();
  const cg = c.createGain();
  clack.type = "square";
  clack.frequency.setValueAtTime(180, t0 + 0.1);
  cg.gain.setValueAtTime(0, t0 + 0.098);
  cg.gain.linearRampToValueAtTime(0.055, t0 + 0.102);
  cg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
  clack.connect(cg);
  cg.connect(c.destination);
  clack.start(t0 + 0.098);
  clack.stop(t0 + 0.17);
}

/** Cannot afford shot — low harsh buzz */
export function playErrorBuzzer(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(72, t);
  osc.frequency.linearRampToValueAtTime(55, t + 0.14);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(420, t);
  filter.frequency.exponentialRampToValueAtTime(90, t + 0.16);
  g.gain.setValueAtTime(0.1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.22);
}

/** Auto-turret — very quiet soft “pew” */
export function playAutoTurretFire(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1180, t);
  osc.frequency.exponentialRampToValueAtTime(520, t + 0.05);
  g.gain.setValueAtTime(0.018, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.075);
}

/** Debris sweeper — quiet high zap */
export function playSweeperZap(): void {
  if (!canOutputSound() || !audioContext) return;
  const c = audioContext;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(3200, t);
  osc.frequency.exponentialRampToValueAtTime(4800, t + 0.018);
  g.gain.setValueAtTime(0.012, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.04);
}
