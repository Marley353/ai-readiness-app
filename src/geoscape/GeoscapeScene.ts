import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { attachGestures } from '../app/input';
import { label, readout, button, Panel, ListView, row, modal, toast, icon } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState, hasState, COMPRESSION_SECONDS } from '../core/state';
import { fmtDate, fmtTime, fmtMoney, monthIndex } from '../core/clock';
import { tick, sendCraft, returnToBase, kmBetween, scheduleInitialMissions, launchCydonia, type GeoEventRecord } from './sim';
import { placeFirstBase, addBase } from '../core/campaign';
import { Globe } from './globe';
import { sprite, has } from '../render/atlas';
import { UFOS } from '../data/ufos';
import { CRAFT } from '../data/craft';
import { FACILITIES } from '../data/facilities';
import { REGIONS, regionAt, COUNTRIES } from '../data/countries';
import { bus } from '../core/events';
import { startMission } from '../scenes/flow';
import { sfx } from '../audio/sfx';
const COMP = [['5s', 'time-5s'], ['1m', 'time-1m'], ['5m', 'time-5m'], ['30m', 'time-30m'], ['1h', 'time-1h'], ['1d', 'time-1d']];
export class GeoscapeScene implements Scene {
  private root!: Container; private globe = new Globe(); private world = new Container(); private markers = new Container(); private ui = new Container();
  private date!: Text; private time!: Text; private funds!: Text; private compButtons: any[] = []; private pauseBtn: any; private status!: Text;
  private placing = false; private newBase = false; private markerPool: Sprite[] = []; private lines = new Graphics(); private popupOpen = false;
  private unsub: (() => void)[] = [];
  mount(root: Container) {
    this.root = root; if (!hasState()) { scenes.show('menu'); return; }
    const s = getState(); this.placing = s.bases.length === 0;
    this.world.addChild(this.globe, this.lines, this.markers); root.addChild(this.world, this.ui);
    attachGestures(this.world, { pan: (dx, dy) => { this.globe.setView(this.globe.lon0 - dx / (this.globe.radius / 90), this.globe.lat0 + dy / (this.globe.radius / 90), this.globe.radius); }, pinch: (k) => { this.globe.setView(this.globe.lon0, this.globe.lat0, Math.max(160, Math.min(1400, this.globe.radius * k))); }, tap: (x, y) => this.tap(x, y) });
    this.globe.setView(s.bases[0]?.lon ?? 0, s.bases[0]?.lat ?? 30, Math.min(app.h, app.w * 0.7) * 0.44);
    this.buildUi(); this.layout(app.w, app.h);
    this.unsub.push(bus.on('pause', () => this.refreshComp()));
    sfx.music('ambient-geo');
    if (this.placing) { s.paused = true; toast('Select a site for the first X-COM base', 'info'); }
    else if (s.pendingMission) this.pendingPopup();
  }
  unmount() { for (const u of this.unsub) u(); }
  resize(w: number, h: number) { this.layout(w, h); }
  private layout(w: number, h: number) {
    const panelW = Math.max(248, Math.round(w * 0.24)); const gx = app.safe.left + Math.round((w - panelW - app.safe.left - app.safe.right) / 2); this.world.position.set(gx, app.safe.top + Math.round((h - app.safe.top - app.safe.bottom) / 2));
    this.ui.position.set(w - app.safe.right - panelW, app.safe.top); (this.ui as any).panelW = panelW; this.buildPanel(panelW, h - app.safe.top - app.safe.bottom);
  }
  private buildUi() { this.status = label('', { size: 'caption', color: P.textMuted, wrap: 200 }); }
  private buildPanel(pw: number, ph: number) {
    this.ui.removeChildren().forEach((c) => c.destroy({ children: true }));
    const p = new Panel(pw, ph, { pad: S.x1 }); this.ui.addChild(p); const c = p.content; const iw = pw - S.x2; let y = 0;
    this.date = readout('', { size: 'control', weight: '600' }); this.date.position.set(0, y); c.addChild(this.date); y += 24;
    this.time = readout('', { size: 'display', weight: '600' }); this.time.position.set(0, y); c.addChild(this.time); y += 40;
    this.funds = readout('', { size: 'control', color: P.ok }); this.funds.position.set(0, y); c.addChild(this.funds); y += 32;
    const s = getState(); this.compButtons = []; const bw = Math.floor((iw - S.half * 2) / 3);
    COMP.forEach(([lab, ic], i) => { const b = button({ label: lab, icon: ic, w: bw, h: 44, size: 'caption', mono: true, selected: s.compression === i && !s.paused, onTap: () => { s.compression = i as any; s.paused = false; this.refreshComp(); } }); b.position.set((i % 3) * (bw + S.half), y + Math.floor(i / 3) * 48); c.addChild(b); this.compButtons.push(b); });
    y += 96 + S.half;
    this.pauseBtn = button({ label: s.paused ? 'PAUSED' : 'PAUSE', icon: 'time-pause', w: iw, h: 44, selected: s.paused, onTap: () => { s.paused = !s.paused; this.refreshComp(); } }); this.pauseBtn.position.set(0, y); c.addChild(this.pauseBtn); y += 44 + S.x1;
    const acts: [string, string, () => void][] = [['INTERCEPT', 'intercept', () => this.interceptMenu()], ['BASES', 'base', () => scenes.show('base', { baseId: s.bases[0]?.id })], ['GRAPHS', 'graphs', () => this.graphs()], ['UFOPAEDIA', 'ufopaedia', () => scenes.show('ufopaedia')], ['OPTIONS', 'options', () => scenes.show('options')], ['FUNDING', 'funding', () => this.funding()]];
    const aw = Math.floor((iw - S.half) / 2);
    acts.forEach(([lab, ic, fn], i) => { const b = button({ label: lab, icon: ic, w: aw, h: 48, size: 'caption', onTap: fn }); b.position.set((i % 2) * (aw + S.half), y + Math.floor(i / 2) * 52); c.addChild(b); });
    y += 3 * 52 + S.x1;
    this.status = label('', { size: 'caption', color: P.textMuted, wrap: iw }); this.status.position.set(0, y); c.addChild(this.status);
    this.refreshReadouts();
  }
  private refreshComp() { const s = getState(); this.compButtons.forEach((b, i) => b.setSelected(s.compression === i && !s.paused)); this.pauseBtn?.setSelected(s.paused); this.pauseBtn?.setLabel(s.paused ? 'PAUSED' : 'PAUSE'); }
  private refreshReadouts() {
    const s = getState(); this.date.text = fmtDate(s.time); this.time.text = fmtTime(s.time); this.funds.text = fmtMoney(s.funds); this.funds.style.fill = s.funds < 0 ? P.critical : P.ok;
    const alerts: string[] = []; for (const u of s.ufos) if (u.detected) alerts.push(`${u.hyperDetected ? UFOS[u.type].name : 'UFO'} ${u.status === 'landed' ? 'landed' : u.status === 'crashed' ? 'down' : 'tracked'}`); for (const st of s.sites) if (st.kind === 'terror') alerts.push(`Terror: ${st.city}`); for (const c of s.craft) if (c.status === 'out') alerts.push(`${c.name} ${c.returning ? 'returning' : 'airborne'}`);
    this.status.text = alerts.slice(0, 6).join('\n');
  }
  update(dt: number) {
    const s = getState(); if (!this.placing && !this.popupOpen) { const ev = tick(s, dt); if (ev.length) this.handleEvents(ev); }
    const sunLon = -((s.time / 3600000) % 24) * 15 + 180; this.globe.draw(sunLon);
    this.drawMarkers(); this.refreshReadouts(); this.refreshComp();
    if (s.gameOver && !this.popupOpen) { this.popupOpen = true; scenes.show('gameover'); }
  }
  private drawMarkers() {
    const s = getState(); const m = this.markers; let i = 0; const g = this.lines; g.clear();
    const put = (key: string, lon: number, lat: number, kind: string, id: number) => { const p = this.globe.project(lon, lat); if (!p.visible) return; let sp = this.markerPool[i]; if (!sp) { sp = new Sprite(); sp.anchor.set(0.5); sp.eventMode = 'none'; this.markerPool[i] = sp; } if (!sp.parent) m.addChild(sp); sp.texture = sprite(key).texture; sp.position.set(p.x, p.y); sp.visible = true; sp.width = 32; sp.height = 32; (sp as any).kind = kind; (sp as any).id = id; i++; };
    for (const b of s.bases) { put('geo/base', b.lon, b.lat, 'base', b.id); const range = b.facilities.filter((f) => f.daysLeft <= 0).reduce((a, f) => Math.max(a, FACILITIES[f.def]?.radarRange ?? 0), 0); if (range) { const p = this.globe.project(b.lon, b.lat); if (p.visible) g.circle(p.x, p.y, (range / 6371) * this.globe.radius).fill({ color: P.accent, alpha: 0.12 }).stroke({ width: 1, color: P.accent, alpha: 0.35 }); } }
    for (const u of s.ufos) if (u.detected || u.status !== 'flying') put(u.status === 'crashed' ? 'geo/crash' : u.status === 'landed' ? 'geo/ufo-landed' : 'geo/ufo', u.lon, u.lat, 'ufo', u.id);
    for (const st of s.sites) if (st.detected && (st.kind === 'terror' || st.kind === 'alien-base')) put(st.kind === 'terror' ? 'geo/terror' : 'geo/alien-base', st.lon, st.lat, 'site', st.id);
    for (const c of s.craft) if (c.status === 'out') { put('geo/craft', c.lon, c.lat, 'craft', c.id); if (c.dest) { const a = this.globe.project(c.lon, c.lat), b = this.globe.project(c.dest.lon, c.dest.lat); if (a.visible && b.visible) g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 1, color: P.accent, alpha: 0.6 }); } }
    for (let k = i; k < this.markerPool.length; k++) this.markerPool[k].visible = false;
  }
  private tap(gx: number, gy: number) {
    const local = this.world.toLocal({ x: gx, y: gy }); const s = getState();
    for (const sp of this.markerPool) { if (!sp.visible) continue; if (Math.abs(sp.x - local.x) <= 22 && Math.abs(sp.y - local.y) <= 22) { this.markerInfo((sp as any).kind, (sp as any).id); return; } }
    const ll = this.globe.unproject(local.x, local.y); if (!ll) return;
    if (this.placing || this.newBase) { this.placeBase(ll.lon, ll.lat); return; }
  }
  private placeBase(lon: number, lat: number) {
    const s = getState(); const region = regionAt(lon, lat); const names = ['Alpha Base', 'Bravo Base', 'Charlie Base', 'Delta Base', 'Echo Base', 'Foxtrot Base', 'Golf Base', 'Hotel Base']; const name = names[s.bases.length] ?? `Base ${s.bases.length + 1}`;
    if (this.newBase && s.funds < region.baseCost) { toast(`Insufficient funds: base in ${region.name} costs ${fmtMoney(region.baseCost)}`, 'warn'); return; }
    modal({ title: this.placing ? 'Establish X-COM headquarters' : 'Build new base', body: `${name} — ${region.name}${this.newBase ? ` — cost ${fmtMoney(region.baseCost)}` : ''}`, buttons: [{ label: 'CANCEL' }, { label: 'CONFIRM', variant: 'primary', onTap: () => { if (this.placing) { placeFirstBase(s, lon, lat, name); scheduleInitialMissions(s); this.placing = false; toast(`${name} established`); } else { s.funds -= region.baseCost; const b = addBase(s, lon, lat, name); this.newBase = false; scenes.show('base', { baseId: b.id, view: 'facilities', placeLift: true }); } } }] });
  }
  private handleEvents(ev: GeoEventRecord[]) {
    const s = getState(); const halting = ev.filter((e) => e.halt); for (const e of ev) if (!e.halt) toast(e.text);
    if (!halting.length) return; const e = halting[0]; s.paused = true; this.refreshComp();
    if (e.type === 'month-end') { scenes.show('monthly'); return; }
    if (e.type === 'intercept' && e.craftId !== undefined && e.ufoId !== undefined) { scenes.show('intercept', { craftId: e.craftId, ufoId: e.ufoId }); return; }
    if (e.type === 'craft-arrived' || e.type === 'base-attacked') { this.pendingPopup(); return; }
    if (e.type === 'ufo-detected' && e.ufoId !== undefined) { this.ufoPopup(e.ufoId, e.text); return; }
    if (e.type === 'research-done') { this.popupOpen = true; modal({ title: 'Research complete', body: e.text, buttons: [{ label: 'VIEW', onTap: () => { this.popupOpen = false; scenes.show('ufopaedia', { article: e.topic }); } }, { label: 'OK', variant: 'primary', onTap: () => { this.popupOpen = false; } }] }); return; }
    this.popupOpen = true; modal({ title: 'Geoscape', body: e.text, buttons: [{ label: 'OK', variant: 'primary', onTap: () => { this.popupOpen = false; } }] });
  }
  private pendingPopup() {
    const s = getState(); const pm = s.pendingMission; if (!pm) return; this.popupOpen = true;
    const site = s.sites.find((x) => x.id === pm.siteId); const craft = s.craft.find((c) => c.id === pm.craftId);
    const title = pm.kind === 'base-defence' ? 'Base under attack' : pm.kind === 'terror' ? 'Terror site' : pm.kind === 'alien-base' ? 'Alien base' : pm.kind === 'crash' ? 'Crash site' : pm.kind.startsWith('cydonia') ? 'Cydonia' : 'Landing site';
    const body = pm.kind === 'base-defence' ? `${s.bases.find((b) => b.id === pm.baseId)?.name} — aliens are landing. Defend the base with every soldier present.` : `${craft?.name ?? 'Craft'} on station with ${craft?.soldiers.length ?? 0} soldiers${site?.ufoType ? ` — ${UFOS[site.ufoType].name}, ${site.race}` : ''}. Deploy?`;
    const buttons: any[] = [{ label: pm.kind === 'base-defence' ? 'DEFEND' : 'DEPLOY', variant: 'primary', onTap: () => { this.popupOpen = false; void startMission({ pending: true }); } }];
    if (pm.kind !== 'base-defence') buttons.unshift({ label: 'RETURN TO BASE', onTap: () => { this.popupOpen = false; s.pendingMission = null; if (craft) returnToBase(s, craft.id); } });
    modal({ title, body, buttons });
  }
  private ufoPopup(ufoId: number, text: string) {
    const s = getState(); const u = s.ufos.find((x) => x.id === ufoId); if (!u) return; this.popupOpen = true;
    modal({ title: 'UFO detected', body: `${text}\nAltitude ${u.altitude}, speed ${u.speed} kt, ${Math.round(kmBetween(u, s.bases[0] ?? u))} km from ${s.bases[0]?.name ?? 'base'}.`, buttons: [{ label: 'IGNORE', onTap: () => { this.popupOpen = false; } }, { label: 'INTERCEPT', variant: 'primary', onTap: () => { this.popupOpen = false; this.craftChooser({ kind: 'ufo', id: u.id, lon: u.lon, lat: u.lat }); } }] });
  }
  private craftChooser(dest: any) {
    const s = getState(); const ready = s.craft.filter((c) => c.status === 'ready' || c.status === 'out'); const w = Math.min(560, app.w - S.x4);
    const list = new ListView(w - S.x2 * 2, Math.min(320, app.h - 240), { onTap: (i) => { const c = ready[i]; close(); if (sendCraft(s, c.id, dest)) { toast(`${c.name} launched`); sfx.play('craft-launch'); s.paused = false; this.refreshComp(); } else toast(`${c.name} cannot launch`, 'warn'); } });
    list.setRows(ready.length ? ready.map((c) => { const r = row(w - S.x2 * 2, 56); const n = label(`${c.name} — ${s.bases.find((b) => b.id === c.baseId)?.name}`, { size: 'control', weight: '600' }); n.position.set(S.x1, 8); r.addChild(n); const d = readout(`${c.status.toUpperCase()} · fuel ${c.fuel}/${CRAFT[c.type].fuelMax} · ${c.weapons.filter(Boolean).length} weapons · ${c.soldiers.length} troops`, { size: 'caption', color: P.textMuted }); d.position.set(S.x1, 32); r.addChild(d); return r; }) : [(() => { const r = row(w - S.x2 * 2, 48); const t = label('No craft ready', { size: 'body', color: P.textMuted }); t.position.set(S.x1, 14); r.addChild(t); return r; })()]);
    this.popupOpen = true; const close = modal({ title: 'Launch craft', body: list, w, buttons: [{ label: 'CANCEL', variant: 'ghost', onTap: () => { this.popupOpen = false; } }] });
    const origClose = close; (this as any)._close = () => { origClose(); this.popupOpen = false; };
  }
  private interceptMenu() {
    const s = getState(); const w = Math.min(560, app.w - S.x4); const list = new ListView(w - S.x2 * 2, Math.min(320, app.h - 240), { onTap: (i) => { const c = s.craft[i]; close(); this.popupOpen = false; if (c.status === 'out') { returnToBase(s, c.id); toast(`${c.name} returning to base`); } else if (c.status === 'ready') this.targetChooser(c.id); else toast(`${c.name} is ${c.status}`, 'warn'); } });
    list.setRows(s.craft.map((c) => { const r = row(w - S.x2 * 2, 56); const n = label(c.name, { size: 'control', weight: '600' }); n.position.set(S.x1, 8); r.addChild(n); const d = readout(`${c.status.toUpperCase()} · fuel ${c.fuel} · damage ${c.damage}`, { size: 'caption', color: P.textMuted }); d.position.set(S.x1, 32); r.addChild(d); return r; }));
    this.popupOpen = true; const close = modal({ title: 'Craft', body: list, w, buttons: [{ label: 'CLOSE', variant: 'ghost', onTap: () => { this.popupOpen = false; } }] });
  }
  private targetChooser(craftId: number) {
    const s = getState(); const targets: { text: string; dest: any }[] = [];
    for (const u of s.ufos) if (u.detected || u.status !== 'flying') targets.push({ text: `${u.hyperDetected ? UFOS[u.type].name : 'UFO'} (${u.status})`, dest: { kind: 'ufo', id: u.id, lon: u.lon, lat: u.lat } });
    for (const st of s.sites) if (st.detected) targets.push({ text: `${st.kind === 'terror' ? 'Terror site ' + st.city : st.kind === 'alien-base' ? 'Alien base' : st.kind + ' site'}`, dest: { kind: 'site', id: st.id, lon: st.lon, lat: st.lat } });
    const craft = s.craft.find((c) => c.id === craftId); if (craft?.type === 'avenger' && s.researched.includes('cydonia-or-bust')) targets.push({ text: 'CYDONIA — MARS (final assault)', dest: { kind: 'cydonia' } });
    const w = Math.min(560, app.w - S.x4); const list = new ListView(w - S.x2 * 2, Math.min(320, app.h - 240), { onTap: (i) => { close(); this.popupOpen = false; if (targets[i].dest.kind === 'cydonia') { const r = launchCydonia(s, craftId); if (!r.ok) toast(r.reason!, 'warn'); else this.pendingPopup(); return; } if (sendCraft(s, craftId, targets[i].dest)) { toast('Craft launched'); sfx.play('craft-launch'); s.paused = false; } } });
    list.setRows(targets.length ? targets.map((t) => { const r = row(w - S.x2 * 2, 48); const n = label(t.text, { size: 'control' }); n.position.set(S.x1, 12); r.addChild(n); return r; }) : [(() => { const r = row(w - S.x2 * 2, 48); const t = label('No targets known', { size: 'body', color: P.textMuted }); t.position.set(S.x1, 14); r.addChild(t); return r; })()]);
    this.popupOpen = true; const close = modal({ title: 'Select target', body: list, w, buttons: [{ label: 'CANCEL', variant: 'ghost', onTap: () => { this.popupOpen = false; } }] });
  }
  private markerInfo(kind: string, id: number) {
    const s = getState();
    if (kind === 'base') { scenes.show('base', { baseId: id }); return; }
    if (kind === 'ufo') { const u = s.ufos.find((x) => x.id === id); if (!u) return; this.popupOpen = true; modal({ title: u.hyperDetected ? `${UFOS[u.type].name} (${u.race})` : 'Unknown craft', body: `Status ${u.status} · altitude ${u.altitude} · speed ${u.speed} kt · damage ${u.damage}`, buttons: [{ label: 'CLOSE', onTap: () => { this.popupOpen = false; } }, { label: 'SEND CRAFT', variant: 'primary', onTap: () => { this.popupOpen = false; this.craftChooser({ kind: 'ufo', id: u.id, lon: u.lon, lat: u.lat }); } }] }); return; }
    if (kind === 'site') { const st = s.sites.find((x) => x.id === id); if (!st) return; this.popupOpen = true; const left = st.expiresAt ? Math.max(0, Math.round((st.expiresAt - s.time) / 3600000)) : null; modal({ title: st.kind === 'terror' ? `Terror site — ${st.city}` : 'Alien base', body: `${st.race} · ${left !== null ? `${left} h remaining` : 'permanent'}`, buttons: [{ label: 'CLOSE', onTap: () => { this.popupOpen = false; } }, { label: 'SEND CRAFT', variant: 'primary', onTap: () => { this.popupOpen = false; this.craftChooser({ kind: 'site', id: st.id, lon: st.lon, lat: st.lat }); } }] }); return; }
    if (kind === 'craft') { const c = s.craft.find((x) => x.id === id); if (!c) return; this.popupOpen = true; modal({ title: c.name, body: `${c.status} · fuel ${c.fuel} · damage ${c.damage} · ${c.soldiers.length} troops`, buttons: [{ label: 'CLOSE', onTap: () => { this.popupOpen = false; } }, { label: 'RETURN TO BASE', variant: 'primary', onTap: () => { this.popupOpen = false; returnToBase(s, c.id); } }] }); }
  }
  private funding() {
    const s = getState(); const w = Math.min(560, app.w - S.x4); const list = new ListView(w - S.x2 * 2, Math.min(360, app.h - 240));
    list.setRows(s.countries.map((c) => { const r = row(w - S.x2 * 2, 44); const n = label(COUNTRIES[c.id].name, { size: 'body' }); n.position.set(S.x1, 12); r.addChild(n); const v = readout(c.pact ? 'PACT' : fmtMoney(c.funding), { size: 'body', weight: '600', align: 'right', color: c.pact ? P.critical : P.text }); v.position.set(w - S.x2 * 2 - S.x1, 12); r.addChild(v); return r; }));
    this.popupOpen = true; modal({ title: `Monthly funding — ${fmtMoney(s.countries.reduce((a, c) => a + c.funding, 0))}`, body: list, w, buttons: [{ label: 'CLOSE', variant: 'primary', onTap: () => { this.popupOpen = false; } }] });
  }
  private graphs() {
    const s = getState(); const w = Math.min(640, app.w - S.x4); const c = new Container(); const g = new Graphics(); c.addChild(g); const reports = s.reports.slice(-12); const gw = w - S.x2 * 2, gh = 200;
    g.rect(0, 0, gw, gh).fill(P.shell0).stroke({ width: 1, color: P.shell3 }); const maxV = Math.max(500, ...reports.map((r) => Math.abs(r.score)), ...reports.map((r) => r.totalFunding / 10000));
    const pts = reports.map((r, i) => [S.x1 + (i / Math.max(1, reports.length - 1)) * (gw - S.x2), gh / 2 - (r.score / maxV) * (gh / 2 - 8)]); if (pts.length > 1) g.poly(pts.flat(), false).stroke({ width: 2, color: P.accent }); const fp = reports.map((r, i) => [S.x1 + (i / Math.max(1, reports.length - 1)) * (gw - S.x2), gh - 8 - (r.totalFunding / 10000 / maxV) * (gh - 16)]); if (fp.length > 1) g.poly(fp.flat(), false).stroke({ width: 2, color: P.ok }); g.moveTo(0, gh / 2).lineTo(gw, gh / 2).stroke({ width: 1, color: P.shell3 });
    const l1 = label('Score (cyan) · Funding (green) · last 12 months', { size: 'caption', color: P.textMuted }); l1.position.set(0, gh + S.x1); c.addChild(l1); if (!reports.length) { const t = label('No monthly reports yet', { size: 'body', color: P.textMuted }); t.position.set(S.x2, gh / 2 - 10); c.addChild(t); }
    this.popupOpen = true; modal({ title: 'Graphs', body: c, w, buttons: [{ label: 'CLOSE', variant: 'primary', onTap: () => { this.popupOpen = false; } }] });
  }
  startNewBase() { this.newBase = true; toast('Select a site for the new base'); }
}
