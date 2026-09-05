/** Deterministic PRNG (mulberry32). Each campaign/battle owns a stream persisted as a 32-bit state. */
export class Rng {
  constructor(public state: number) { this.state = (state >>> 0) || 0x9e3779b9; }
  float(): number { let t = (this.state = (this.state + 0x6d2b79f5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  /** Inclusive integer in [min, max]. */
  int(min: number, max: number): number { if (max < min) [min, max] = [max, min]; return min + Math.floor(this.float() * (max - min + 1)); }
  percent(p: number): boolean { return this.float() * 100 < p; }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.float() * arr.length)]; }
  weighted<T>(items: readonly { item: T; w: number }[]): T { const total = items.reduce((a, b) => a + b.w, 0); let r = this.float() * total; for (const it of items) { r -= it.w; if (r <= 0) return it.item; } return items[items.length - 1].item; }
  shuffle<T>(arr: T[]): T[] { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.float() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  /** Standard normal via Box-Muller. */
  normal(mean = 0, sd = 1): number { const u = 1 - this.float(), v = this.float(); return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
}
export const hashSeed = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
