import { Container, Graphics } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, readout, button, Panel, ListView, row, Stepper, header, HEADER_H, modal, toast, keyValue } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState } from '../core/state';
import { sprite, has } from '../render/atlas';
import { FACILITIES } from '../data/facilities';
import { ITEMS } from '../data/items';
import { CRAFT, CRAFT_WEAPONS } from '../data/craft';
import { fmtMoney } from '../core/clock';
import { capacities, maintenance, canBuild, canPlace, build, canDismantle, dismantle, facilityAt, buyableItems, buyableCraft, buyItem, buyCraft, hire, sell, sellPrice, sack, transfer, transferHours, equipCraftWeapon, assignSoldier, assignHwp, loadCraftItem, craftSpaceUsed, craftSpaceMax, storesOver, isLoadable, validCells } from './sim';
type View = 'facilities' | 'craft' | 'stores' | 'purchase' | 'sell' | 'transfer' | 'personnel';
export class BaseScene implements Scene {
  private root!: Container; private baseId = 0; private view: View = 'facilities'; private buildPick: string | null = null; private placeLift = false;
  mount(root: Container, params: any) { this.root = root; const s = getState(); this.baseId = params?.baseId ?? s.bases[0]?.id ?? 0; this.view = params?.view ?? 'facilities'; this.placeLift = !!params?.placeLift; if (this.placeLift) this.buildPick = 'access-lift'; this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private base() { const s = getState(); return s.bases.find((b) => b.id === this.baseId) ?? s.bases[0]; }
  private build() {
    const s = getState(); const b = this.base(); if (!b) { scenes.show('geoscape'); return; } const w = app.w;
    const switcher = button({ label: `${b.name} ▾`, variant: 'ghost', onTap: () => this.switchBase() });
    this.root.addChild(header(w, 'Base', { onBack: () => scenes.show('geoscape'), subtitle: fmtMoney(s.funds), actions: [switcher] }));
    const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const railW = 152; const ph = app.h - y0 - app.safe.bottom - S.x2;
    const rail: [string, string, () => void][] = [['FACILITIES', 'base', () => this.show('facilities')], ['SOLDIERS', 'soldiers', () => scenes.show('soldiers', { baseId: b.id })], ['CRAFT', 'craft', () => this.show('craft')], ['RESEARCH', 'research', () => scenes.show('research', { baseId: b.id })], ['MANUFACTURE', 'manufacture', () => scenes.show('manufacture', { baseId: b.id })], ['STORES', 'stores', () => this.show('stores')], ['PURCHASE', 'purchase', () => this.show('purchase')], ['SELL', 'sell', () => this.show('sell')], ['TRANSFER', 'transfer', () => this.show('transfer')], ['PERSONNEL', 'personnel', () => this.show('personnel')], ['NEW BASE', 'new-base', () => this.newBase()]];
    const list = new ListView(railW, ph, { gap: 4 }); list.position.set(x0, y0); this.root.addChild(list);
    list.setRows(rail.map(([lab, ic, fn]) => { const bt = button({ label: lab, icon: ic, w: railW, h: 44, size: 'caption', selected: lab.toLowerCase() === this.view, onTap: fn }); (bt as any).rowH = 44; return bt; }));
    const cx = x0 + railW + S.x2; const cw = w - cx - app.safe.right - S.x2;
    if (this.view === 'facilities') this.facilities(cx, y0, cw, ph); else if (this.view === 'craft') this.craft(cx, y0, cw, ph); else if (this.view === 'stores') this.stores(cx, y0, cw, ph); else if (this.view === 'purchase') this.purchase(cx, y0, cw, ph); else if (this.view === 'sell') this.sellView(cx, y0, cw, ph); else if (this.view === 'transfer') this.transferView(cx, y0, cw, ph); else this.personnel(cx, y0, cw, ph);
    if (storesOver(s, b) && this.view !== 'sell' && this.view !== 'transfer') { toast('STORES FULL — sell or transfer items', 'warn'); }
  }
  private show(v: View) { this.view = v; this.buildPick = null; this.resize(); }
  private switchBase() { const s = getState(); const w = Math.min(480, app.w - S.x4); const l = new ListView(w - S.x2 * 2, Math.min(320, app.h - 240), { onTap: (i) => { close(); this.baseId = s.bases[i].id; this.resize(); } }); l.setRows(s.bases.map((b) => { const r = row(w - S.x2 * 2, 48); const t = label(b.name, { size: 'control' }); t.position.set(S.x1, 12); r.addChild(t); return r; })); const close = modal({ title: 'Bases', body: l, w, buttons: [{ label: 'CLOSE', variant: 'ghost' }] }); }
  private facilities(x: number, y: number, w: number, h: number) {
    const s = getState(); const b = this.base(); const cell = Math.max(88, Math.min(104, Math.floor((h - S.x6 - S.x2 * 2) / 6))); const gridW = cell * 6;
    const p = new Panel(gridW + S.x2 * 2, h, { title: this.buildPick ? `Select a cell for ${FACILITIES[this.buildPick].name}` : 'Facilities — tap a cell' }); p.position.set(x, y); this.root.addChild(p);
    const g = new Container(); p.content.addChild(g); const cells = this.buildPick ? validCells(b, this.buildPick) : [];
    for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 6; gx++) {
      const f = facilityAt(b, gx, gy); const isOrigin = f && f.x === gx && f.y === gy; const c = new Container(); c.position.set(gx * cell, gy * cell); c.eventMode = 'static'; c.cursor = 'pointer'; (c as any).kitType = 'button'; (c as any).label = `cell ${gx},${gy}`; c.on('pointertap', () => this.tapCell(gx, gy));
      const bg = new Graphics().rect(1, 1, cell - 2, cell - 2).fill(f ? P.shell2 : P.shell1).stroke({ width: 1, color: cells.some(([cx, cy]) => cx === gx && cy === gy) ? P.accent : P.shell3 }); c.addChild(bg);
      if (isOrigin) { const key = f.daysLeft > 0 ? 'facility/construction' : `facility/${f.def}`; const sz = (FACILITIES[f.def]?.size ?? 1) * cell - 8; if (has(key)) { const sp = sprite(key); sp.width = sz; sp.height = sz; sp.position.set(4, 4); c.addChild(sp); } const t = label(FACILITIES[f.def]?.name ?? f.def, { size: 'caption', weight: '600', wrap: sz }); t.position.set(6, 6); c.addChild(t); if (f.daysLeft > 0) { const d = readout(`${f.daysLeft} d`, { size: 'caption', color: P.warn }); d.position.set(6, sz - 14); c.addChild(d); } }
      else if (!f && has('facility/empty')) { const sp = sprite('facility/empty'); sp.width = cell - 8; sp.height = cell - 8; sp.position.set(4, 4); sp.alpha = 0.5; c.addChild(sp); }
      g.addChild(c);
    }
    const sx = x + gridW + S.x2 * 2 + S.x2; const sw = w - gridW - S.x2 * 3; if (sw < 200) return;
    const info = new Panel(sw, h, { title: 'Base status' }); info.position.set(sx, y); this.root.addChild(info); const cap = capacities(s, b); const m = maintenance(s, b);
    const rows = [keyValue('Personnel / quarters', `${cap.quarters.used}/${cap.quarters.max}`, sw - S.x2 * 2, { color: cap.quarters.used > cap.quarters.max ? P.critical : undefined }), keyValue('Stores used / space', `${cap.stores.used.toFixed(1)}/${cap.stores.max}`, sw - S.x2 * 2, { color: cap.stores.used > cap.stores.max ? P.critical : undefined }), keyValue('Scientists / labs', `${cap.labs.used}/${cap.labs.max}`, sw - S.x2 * 2), keyValue('Engineers / workshops', `${cap.workshops.used}/${cap.workshops.max}`, sw - S.x2 * 2), keyValue('Craft / hangars', `${cap.hangars.used}/${cap.hangars.max}`, sw - S.x2 * 2), keyValue('Aliens / containment', `${cap.containment.used}/${cap.containment.max}`, sw - S.x2 * 2), keyValue('Monthly maintenance', fmtMoney(m.total), sw - S.x2 * 2)];
    let yy = 0; for (const r of rows) { r.position.set(0, yy); info.content.addChild(r); yy += 24; }
    const bb = button({ label: this.buildPick ? 'CANCEL BUILD' : 'BUILD FACILITY', icon: 'plus', w: sw - S.x2 * 2, variant: this.buildPick ? 'ghost' : 'primary', onTap: () => (this.buildPick ? (this.buildPick = null, this.resize()) : this.buildChooser()) }); bb.position.set(0, yy + S.x2); info.content.addChild(bb);
  }
  private tapCell(gx: number, gy: number) {
    const s = getState(); const b = this.base();
    if (this.buildPick) { const r = build(s, b.id, this.buildPick, gx, gy); if (!r.ok) { toast(r.reason, 'warn'); return; } toast(`${FACILITIES[this.buildPick].name} under construction`); this.buildPick = null; this.placeLift = false; this.resize(); return; }
    const f = facilityAt(b, gx, gy); if (!f) { this.buildChooser(); return; }
    const d = FACILITIES[f.def]; const dis = canDismantle(s, b, f);
    modal({ title: d.name, body: `${d.buildDays} days · ${fmtMoney(d.cost)} · maintenance ${fmtMoney(d.maintenance)}/month${f.daysLeft > 0 ? `\nUnder construction: ${f.daysLeft} days left` : ''}${dis.ok ? '' : `\n${dis.reason}`}`, buttons: [{ label: 'CLOSE' }, { label: 'DISMANTLE', variant: 'danger', disabled: !dis.ok, onTap: () => { const r = dismantle(s, b.id, f.id); if (!r.ok) toast(r.reason, 'warn'); this.resize(); } }] });
  }
  private buildChooser() {
    const s = getState(); const b = this.base(); const defs = Object.values(FACILITIES); const w = Math.min(640, app.w - S.x4);
    const l = new ListView(w - S.x2 * 2, Math.min(400, app.h - 200), { gap: 4, onTap: (i) => { const d = defs[i]; const c = canBuild(s, b, d.id); if (!c.ok) { toast(c.reason, 'warn'); return; } close(); this.buildPick = d.id; this.resize(); } });
    l.setRows(defs.map((d) => { const c = canBuild(s, b, d.id); const r = row(w - S.x2 * 2, 56); const n = label(d.name, { size: 'control', weight: '600', color: c.ok ? P.text : P.textDim }); n.position.set(S.x1, 8); r.addChild(n); const t = readout(`${fmtMoney(d.cost)} · ${d.buildDays} days · ${fmtMoney(d.maintenance)}/month${c.ok ? '' : ` · ${c.reason}`}`, { size: 'caption', color: c.ok ? P.textMuted : P.warn }); t.position.set(S.x1, 32); r.addChild(t); return r; }));
    const close = modal({ title: 'Build facility', body: l, w, buttons: [{ label: 'CLOSE', variant: 'ghost' }] });
  }
  private craft(x: number, y: number, w: number, h: number) {
    const s = getState(); const b = this.base(); const crafts = s.craft.filter((c) => c.baseId === b.id); const p = new Panel(w, h, { title: 'Craft' }); p.position.set(x, y); this.root.addChild(p);
    const l = new ListView(w - S.x2 * 2, h - S.x6 - S.x2, { gap: 4, onTap: (i) => this.craftDetail(crafts[i].id) });
    l.setRows(crafts.length ? crafts.map((c) => { const d = CRAFT[c.type]; const r = row(w - S.x2 * 2, 64); if (has(d.sprite)) { const sp = sprite(d.sprite); sp.width = 48; sp.height = 48; sp.position.set(S.x1, 8); r.addChild(sp); } const n = label(c.name, { size: 'control', weight: '600' }); n.position.set(S.x8, 8); r.addChild(n); const t = readout(`${c.status.toUpperCase()} · fuel ${c.fuel}/${d.fuelMax} · damage ${c.damage}/${d.damageMax} · weapons ${c.weapons.map((wp) => (wp ? `${CRAFT_WEAPONS[wp.def].name} ${wp.ammo}` : 'none')).join(', ') || 'none'} · troops ${craftSpaceUsed(c)}/${craftSpaceMax(c)}`, { size: 'caption', color: P.textMuted }); t.position.set(S.x8, 34); r.addChild(t); return r; }) : [(() => { const r = row(w - S.x2 * 2, 48); const t = label('No craft at this base', { size: 'body', color: P.textMuted }); t.position.set(S.x1, 14); r.addChild(t); return r; })()]);
    p.content.addChild(l);
  }
  private craftDetail(craftId: number) {
    const s = getState(); const b = this.base(); const c = s.craft.find((x) => x.id === craftId)!; const d = CRAFT[c.type]; const w = Math.min(640, app.w - S.x4); const body = new Container(); let y = 0;
    const weapons = Object.values(CRAFT_WEAPONS).filter((wp) => (b.items[wp.storeItem] ?? 0) > 0);
    for (let i = 0; i < d.weapons; i++) { const cur = c.weapons[i]; const bt = button({ label: `Hardpoint ${i + 1}: ${cur ? `${CRAFT_WEAPONS[cur.def].name} (${cur.ammo})` : 'empty'}`, w: w - S.x2 * 2, onTap: () => { const opts = [...weapons.map((wp) => ({ label: wp.name, onTap: () => { const r = equipCraftWeapon(s, c.id, i, wp.id); if (!r.ok) toast(r.reason, 'warn'); close(); this.craftDetail(craftId); } })), { label: 'REMOVE', variant: 'ghost' as const, onTap: () => { equipCraftWeapon(s, c.id, i, null); close(); this.craftDetail(craftId); } }]; modal({ title: 'Select weapon', body: 'Weapons in stores', buttons: opts.length > 1 ? opts.slice(0, 4) : [{ label: 'CLOSE' }] }); } }); bt.position.set(0, y); body.addChild(bt); y += S.x6 + S.x1; }
    if (d.soldiers > 0) { const sold = s.soldiers.filter((x) => x.baseId === b.id); const l = new ListView(w - S.x2 * 2, 200, { onTap: (i) => { const so = sold[i]; const r = assignSoldier(s, so.id, so.craftId === c.id ? null : c.id); if (!r.ok) toast(r.reason, 'warn'); close(); this.craftDetail(craftId); } }); l.setRows(sold.map((so) => { const r = row(w - S.x2 * 2, 44, { selected: so.craftId === c.id }); const t = label(`${so.name} — ${so.rank}${so.wounded ? ` (wounded ${so.wounded} d)` : ''}`, { size: 'body' }); t.position.set(S.x1, 12); r.addChild(t); return r; })); l.position.set(0, y); body.addChild(l); y += 208; const hw = Object.keys(b.items).filter((k) => ITEMS[k]?.hwp && (b.items[k] ?? 0) > 0); if (hw.length || c.hwps.length) { const hb = button({ label: `HWPs aboard: ${c.hwps.length}${hw.length ? ` · add ${ITEMS[hw[0]].name}` : ''}`, w: w - S.x2 * 2, onTap: () => { if (hw.length) { const r = assignHwp(s, c.id, hw[0], 1); if (!r.ok) toast(r.reason, 'warn'); close(); this.craftDetail(craftId); } } }); hb.position.set(0, y); body.addChild(hb); y += S.x6 + S.x1; }
      const lb = button({ label: `Equipment aboard: ${Object.values(c.items).reduce((a, n) => a + n, 0)} items · LOAD STANDARD KIT`, w: w - S.x2 * 2, onTap: () => { for (const [id, n] of Object.entries(b.items)) { const def = ITEMS[id]; if (def && isLoadable(def) && n > 0 && ['weapon', 'ammo', 'grenade', 'equipment'].includes(def.category)) loadCraftItem(s, c.id, id, Math.min(n, 8)); } toast('Kit loaded'); close(); this.craftDetail(craftId); } }); lb.position.set(0, y); body.addChild(lb); y += S.x6; }
    const close = modal({ title: `${c.name} — ${d.name}`, body, w, buttons: [{ label: 'CLOSE', variant: 'primary' }] });
  }
  private stores(x: number, y: number, w: number, h: number) { const b = this.base(); const p = new Panel(w, h, { title: 'General stores' }); p.position.set(x, y); this.root.addChild(p); const entries = Object.entries(b.items).filter(([, n]) => n > 0); const l = new ListView(w - S.x2 * 2, h - S.x6 - S.x2); l.setRows(entries.length ? entries.map(([id, n]) => { const r = row(w - S.x2 * 2, 44); if (has(`item/${id}`)) { const sp = sprite(`item/${id}`); sp.width = 32; sp.height = 32; sp.position.set(S.x1, 6); r.addChild(sp); } const t = label(ITEMS[id]?.name ?? id, { size: 'body' }); t.position.set(S.x6, 12); r.addChild(t); const q = readout(String(n), { size: 'body', weight: '600', align: 'right' }); q.position.set(w - S.x2 * 2 - S.x1, 12); r.addChild(q); return r; }) : [(() => { const r = row(w - S.x2 * 2, 48); const t = label('Stores are empty', { size: 'body', color: P.textMuted }); t.position.set(S.x1, 14); r.addChild(t); return r; })()]); p.content.addChild(l); }
  private purchase(x: number, y: number, w: number, h: number) {
    const s = getState(); const b = this.base(); const p = new Panel(w, h, { title: `Purchase — ${fmtMoney(s.funds)}` }); p.position.set(x, y); this.root.addChild(p);
    const items = buyableItems(s); const crafts = buyableCraft(s); const l = new ListView(w - S.x2 * 2, h - S.x6 - S.x2, { gap: 4 });
    const rows: Container[] = []; const mk = (name: string, price: string, onBuy: (n: number) => void) => { const r = row(w - S.x2 * 2, 56); const t = label(name, { size: 'body' }); t.position.set(S.x1, 8); r.addChild(t); const pr = readout(price, { size: 'caption', color: P.textMuted }); pr.position.set(S.x1, 32); r.addChild(pr); const st = new Stepper(0, { min: 0, max: 99, w: 176 }); st.position.set(w - S.x2 * 2 - 176 - S.x1 - 96, 4); r.addChild(st); const bb = button({ label: 'BUY', w: 88, variant: 'primary', onTap: () => onBuy(st.value) }); bb.position.set(w - S.x2 * 2 - 88, 4); r.addChild(bb); return r; };
    rows.push(mk('Soldier', fmtMoney(40000), (n) => { const r = hire(s, b.id, 'soldier', n); toast(r.ok ? `${n} soldiers hired` : r.reason, r.ok ? 'info' : 'warn'); this.resize(); })); rows.push(mk('Scientist', fmtMoney(30000), (n) => { const r = hire(s, b.id, 'scientist', n); toast(r.ok ? `${n} scientists hired` : r.reason, r.ok ? 'info' : 'warn'); this.resize(); })); rows.push(mk('Engineer', fmtMoney(25000), (n) => { const r = hire(s, b.id, 'engineer', n); toast(r.ok ? `${n} engineers hired` : r.reason, r.ok ? 'info' : 'warn'); this.resize(); }));
    for (const c of crafts) rows.push(mk(c.name, `${fmtMoney(c.costBuy ?? 0)} · rent ${fmtMoney(c.rentMonthly ?? 0)}/month`, (n) => { const r = buyCraft(s, b.id, c.id, n); toast(r.ok ? 'Craft ordered' : r.reason, r.ok ? 'info' : 'warn'); this.resize(); }));
    for (const it of items) rows.push(mk(it.name, fmtMoney(it.costBuy ?? 0), (n) => { const r = buyItem(s, b.id, it.id, n); toast(r.ok ? `${n} × ${it.name} ordered` : r.reason, r.ok ? 'info' : 'warn'); this.resize(); }));
    l.setRows(rows); p.content.addChild(l);
  }
  private sellView(x: number, y: number, w: number, h: number) {
    const s = getState(); const b = this.base(); const p = new Panel(w, h, { title: `Sell — ${fmtMoney(s.funds)}` }); p.position.set(x, y); this.root.addChild(p);
    const entries = Object.entries(b.items).filter(([id, n]) => n > 0 && sellPrice(id) > 0); const l = new ListView(w - S.x2 * 2, h - S.x6 - S.x2, { gap: 4 });
    l.setRows(entries.map(([id, n]) => { const r = row(w - S.x2 * 2, 56); const t = label(`${ITEMS[id]?.name ?? id} (${n})`, { size: 'body' }); t.position.set(S.x1, 8); r.addChild(t); const pr = readout(`${fmtMoney(sellPrice(id))} each`, { size: 'caption', color: P.textMuted }); pr.position.set(S.x1, 32); r.addChild(pr); const st = new Stepper(Math.min(1, n), { min: 0, max: n, w: 176 }); st.position.set(w - S.x2 * 2 - 176 - S.x1 - 96, 4); r.addChild(st); const bb = button({ label: 'SELL', w: 88, variant: 'primary', onTap: () => { const r = sell(s, b.id, id, st.value); toast(r.ok ? `Sold for ${fmtMoney(r.value.proceeds)}` : r.reason, r.ok ? 'info' : 'warn'); this.resize(); } }); bb.position.set(w - S.x2 * 2 - 88, 4); r.addChild(bb); return r; }));
    if (!entries.length) l.setRows([(() => { const r = row(w - S.x2 * 2, 48); const t = label('Nothing to sell', { size: 'body', color: P.textMuted }); t.position.set(S.x1, 14); r.addChild(t); return r; })()]);
    p.content.addChild(l);
  }
  private transferView(x: number, y: number, w: number, h: number) {
    const s = getState(); const b = this.base(); const others = s.bases.filter((o) => o.id !== b.id); const p = new Panel(w, h, { title: others.length ? `Transfer to ${others[0].name} — ${transferHours(b, others[0])} h` : 'Transfer — build a second base first' }); p.position.set(x, y); this.root.addChild(p);
    if (!others.length) return; const to = others[0]; const entries = Object.entries(b.items).filter(([, n]) => n > 0); const l = new ListView(w - S.x2 * 2, h - S.x6 - S.x2, { gap: 4 });
    l.setRows(entries.map(([id, n]) => { const r = row(w - S.x2 * 2, 56); const t = label(`${ITEMS[id]?.name ?? id} (${n})`, { size: 'body' }); t.position.set(S.x1, 16); r.addChild(t); const st = new Stepper(Math.min(1, n), { min: 0, max: n, w: 176 }); st.position.set(w - S.x2 * 2 - 176 - S.x1 - 112, 4); r.addChild(st); const bb = button({ label: 'TRANSFER', w: 104, variant: 'primary', onTap: () => { const r = transfer(s, b.id, to.id, { items: { [id]: st.value } } as any); toast(r.ok ? `Transfer under way (${r.value.hours} h, ${fmtMoney(r.value.cost)})` : r.reason, r.ok ? 'info' : 'warn'); this.resize(); } }); bb.position.set(w - S.x2 * 2 - 104, 4); r.addChild(bb); return r; }));
    p.content.addChild(l);
  }
  private personnel(x: number, y: number, w: number, h: number) {
    const s = getState(); const b = this.base(); const p = new Panel(w, h, { title: 'Personnel' }); p.position.set(x, y); this.root.addChild(p); const cap = capacities(s, b);
    const rows = [keyValue('Soldiers', s.soldiers.filter((so) => so.baseId === b.id).length, w - S.x2 * 2), keyValue('Scientists', b.scientists, w - S.x2 * 2), keyValue('Engineers', b.engineers, w - S.x2 * 2), keyValue('Living quarters', `${cap.quarters.used}/${cap.quarters.max}`, w - S.x2 * 2), keyValue('Transfers in progress', b.transfers.length, w - S.x2 * 2)];
    let yy = 0; for (const r of rows) { r.position.set(0, yy); p.content.addChild(r); yy += 24; }
    const b1 = button({ label: 'SACK 1 SCIENTIST', variant: 'ghost', onTap: () => { const r = sack(s, b.id, 'scientist', 1); if (!r.ok) toast(r.reason, 'warn'); this.resize(); } }); b1.position.set(0, yy + S.x2); p.content.addChild(b1);
    const b2 = button({ label: 'SACK 1 ENGINEER', variant: 'ghost', onTap: () => { const r = sack(s, b.id, 'engineer', 1); if (!r.ok) toast(r.reason, 'warn'); this.resize(); } }); b2.position.set(b1.w + S.x1, yy + S.x2); p.content.addChild(b2);
    const b3 = button({ label: 'HIRE (PURCHASE)', variant: 'primary', onTap: () => this.show('purchase') }); b3.position.set(b1.w + b2.w + S.x2, yy + S.x2); p.content.addChild(b3);
  }
  private newBase() { const s = getState(); if (s.bases.length >= 8) { toast('Maximum of eight bases', 'warn'); return; } scenes.show('geoscape', { newBase: true }); setTimeout(() => (scenes.current as any)?.startNewBase?.(), 50); }
}
