// Interim wrapper (the audio builder replaces this with the Howler implementation).
export const sfx = {
  async init() {},
  play(_key: string, _o?: { volume?: number; rate?: number }) {},
  music(_key: string | null) {},
  setVolumes(_s: number, _m: number) {},
  mute(_m: boolean) {},
};
