import { getState, hasState, setState, type GameState } from './state';
import { bus } from './events';

const DB = 'ufo-homage', STORE = 'saves', VERSION = 1;
export interface SaveMeta { slot: string; name: string; savedAt: number; time: number; funds: number; difficulty: number; scene?: string; }
interface Record_ { slot: string; meta: SaveMeta; state: GameState; }

function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'slot' }); };
    req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error);
  });
}
function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((res, rej) => { const t = db.transaction(STORE, mode); const r = fn(t.objectStore(STORE)); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); t.oncomplete = () => db.close(); }));
}
const memory = new Map<string, Record_>(); // fallback when IndexedDB is unavailable (private mode)
let idbOk: boolean | null = null;
async function ok() { if (idbOk === null) { try { await openDb(); idbOk = true; } catch { idbOk = false; } } return idbOk; }

export async function saveGame(slot: string, name: string, state: GameState = getState()): Promise<SaveMeta> {
  const meta: SaveMeta = { slot, name, savedAt: Date.now(), time: state.time, funds: state.funds, difficulty: state.difficulty };
  const rec: Record_ = { slot, meta, state: JSON.parse(JSON.stringify(state)) };
  if (await ok()) await tx('readwrite', (s) => s.put(rec)); else memory.set(slot, rec);
  bus.emit('toast', { text: `Saved: ${name}` });
  return meta;
}
export async function loadGame(slot: string): Promise<GameState | null> {
  const rec = (await ok()) ? await tx<Record_ | undefined>('readonly', (s) => s.get(slot)) : memory.get(slot);
  if (!rec) return null;
  const state = JSON.parse(JSON.stringify(rec.state)) as GameState;
  setState(state);
  bus.emit('state-changed', { reason: 'load' });
  return state;
}
export async function listSaves(): Promise<SaveMeta[]> {
  const recs = (await ok()) ? await tx<Record_[]>('readonly', (s) => s.getAll()) : [...memory.values()];
  return recs.map((r) => r.meta).sort((a, b) => b.savedAt - a.savedAt);
}
export async function deleteSave(slot: string) { if (await ok()) await tx('readwrite', (s) => s.delete(slot)); else memory.delete(slot); }
export async function autosave(kind: 'mission' | 'month' | 'interrupt') {
  if (!hasState()) return;
  const s = getState();
  const label = kind === 'mission' ? 'Autosave — mission start' : kind === 'month' ? 'Autosave — month roll' : 'Autosave — interrupted';
  try { await saveGame(`auto-${kind}`, label, s); s.lastAutosave = Date.now(); } catch (e) { console.warn('autosave failed', e); }
}
export const SLOTS = ['slot-1', 'slot-2', 'slot-3', 'slot-4', 'slot-5', 'slot-6', 'slot-7', 'slot-8'];
