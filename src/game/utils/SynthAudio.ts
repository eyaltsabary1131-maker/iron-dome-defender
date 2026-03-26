let audioContext: AudioContext | null = null;
let initPromise: Promise<void> | null = null;

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

export function playShoot(): void {
  if (!isRunning() || !audioContext) return;
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
  if (!isRunning() || !audioContext) return;
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
  if (!isRunning() || !audioContext) return;
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

export function playBossWarning(): void {
  if (!isRunning() || !audioContext) return;
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
  if (!isRunning() || !audioContext) return;
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
  if (!isRunning() || !audioContext) return;
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
