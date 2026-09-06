// UI kit — every screen is built from these. Colours only via P, sizes via T/S. Touch targets ≥ 44 px.
import { Container, Graphics, Text, Rectangle, Sprite, FederatedPointerEvent } from 'pixi.js';
import { P } from '../design/palette';
import { T, LINE, FONT_UI, FONT_NUM } from '../design/type';
import { S, RADIUS, TOUCH_MIN } from '../design/spacing';
import { tex, has } from '../render/atlas';
import { app } from '../app/App';
import { bus } from '../core/events';
import { sfx } from '../audio/sfx';

export type Size = keyof typeof T;
export interface LabelOpts { size?: Size; color?: number; weight?: '400' | '600'; mono?: boolean; align?: 'left' | 'center' | 'right'; wrap?: number; upper?: boolean; alpha?: number }

export function label(text: string, o: LabelOpts = {}): Text {
  const size = o.size ?? 'body';
  const t = new Text({
    text: o.upper ? text.toUpperCase() : text,
    style: {
      fontFamily: o.mono ? FONT_NUM : FONT_UI, fontSize: T[size], lineHeight: LINE[size], fill: o.color ?? P.text,
      fontWeight: o.weight ?? '400', align: o.align ?? 'left', wordWrap: !!o.wrap, wordWrapWidth: o.wrap ?? 0,
      letterSpacing: o.upper ? 0.6 : 0,
    },
  });
  t.resolution = app.dpr;
  if (o.alpha !== undefined) t.alpha = o.alpha;
  if (o.align === 'right') t.anchor.set(1, 0); else if (o.align === 'center') t.anchor.set(0.5, 0);
  return t;
}
/** Numeric readout — always mono so columns stay aligned. */
export const readout = (text: string | number, o: LabelOpts = {}) => label(String(text), { ...o, mono: true });

export function icon(name: string, size = 24, tint: number = P.text): Sprite {
  const s = new Sprite(tex(`icon/${name}`));
  s.width = size; s.height = size; s.tint = tint; s.label = `icon/${name}`;
  return s;
}

export class Panel extends Container {
  bg = new Graphics();
  content = new Container();
  titleText: Text | null = null;
  constructor(public w: number, public h: number, opts: { title?: string; fill?: number; border?: number; pad?: number; alpha?: number } = {}) {
    super();
    (this as any).kitType = 'panel'; (this as any).bgColor = opts.fill ?? P.shell1;
    this.addChild(this.bg, this.content);
    const pad = opts.pad ?? S.x2;
    this.content.position.set(pad, opts.title ? pad + LINE.caption + S.x1 : pad);
    this.draw(opts);
    if (opts.title) { this.titleText = label(opts.title, { size: 'caption', color: P.textMuted, upper: true, weight: '600' }); this.titleText.position.set(pad, S.x1 + 2); this.addChild(this.titleText); }
  }
  draw(opts: { fill?: number; border?: number; alpha?: number } = {}) {
    this.bg.clear().roundRect(0, 0, this.w, this.h, RADIUS).fill({ color: opts.fill ?? P.shell1, alpha: opts.alpha ?? 1 }).stroke({ width: 1, color: opts.border ?? P.border, alignment: 1 });
  }
  resize(w: number, h: number, opts: { fill?: number; border?: number; alpha?: number } = {}) { this.w = w; this.h = h; this.draw(opts); }
}

export type Variant = 'default' | 'primary' | 'danger' | 'ghost' | 'warn';
export interface ButtonOpts { label?: string; icon?: string; w?: number; h?: number; variant?: Variant; onTap?: () => void; disabled?: boolean; selected?: boolean; size?: Size; mono?: boolean; silent?: boolean; badge?: string }

export class Button extends Container {
  bg = new Graphics();
  text: Text | null = null;
  ico: Sprite | null = null;
  badge: Text | null = null;
  w: number; h: number;
  private pressed = false;
  disabled: boolean; selected: boolean; variant: Variant;
  constructor(public opts: ButtonOpts) {
    super();
    (this as any).kitType = 'button';
    this.variant = opts.variant ?? 'default';
    this.disabled = !!opts.disabled; this.selected = !!opts.selected;
    this.h = opts.h ?? S.x6;
    const iconSize = 24;
    let contentW = 0;
    if (opts.icon) { this.ico = icon(opts.icon, iconSize); contentW += iconSize; }
    if (opts.label) { this.text = label(opts.label, { size: opts.size ?? 'control', weight: '600', mono: opts.mono }); contentW += this.text.width + (opts.icon ? S.x1 : 0); }
    this.w = opts.w ?? Math.max(TOUCH_MIN, Math.ceil((contentW + S.x2 * 2) / 8) * 8);
    this.addChild(this.bg);
    if (this.ico) this.addChild(this.ico);
    if (this.text) this.addChild(this.text);
    if (opts.badge) { this.badge = readout(opts.badge, { size: 'caption', weight: '600', color: P.shell0 }); this.addChild(this.badge); }
    this.layout();
    this.eventMode = 'static'; this.cursor = 'pointer';
    const hw = Math.max(this.w, TOUCH_MIN), hh = Math.max(this.h, TOUCH_MIN);
    this.hitArea = new Rectangle((this.w - hw) / 2, (this.h - hh) / 2, hw, hh);
    this.on('pointerdown', () => { if (this.disabled) return; this.pressed = true; this.draw(); });
    const release = () => { if (this.pressed) { this.pressed = false; this.draw(); } };
    this.on('pointerup', release); this.on('pointerupoutside', release); this.on('pointercancel', release);
    this.on('pointertap', (e: FederatedPointerEvent) => { if (this.disabled) return; e.stopPropagation(); if (!opts.silent) sfx.play('ui-tap'); opts.onTap?.(); });
    this.accessibleTitle = opts.label ?? opts.icon ?? 'button';
  }
  private layout() {
    let x = 0; const cw = (this.ico ? 24 : 0) + (this.text ? this.text.width + (this.ico ? S.x1 : 0) : 0);
    x = Math.round((this.w - cw) / 2);
    if (this.ico) { this.ico.position.set(x, Math.round((this.h - 24) / 2)); x += 24 + (this.text ? S.x1 : 0); }
    if (this.text) { this.text.position.set(x, Math.round((this.h - this.text.height) / 2)); }
    if (this.badge) { this.badge.position.set(this.w - this.badge.width - 6, 4); }
    this.draw();
  }
  setLabel(t: string) { if (this.text) { this.text.text = t; this.layout(); } }
  setDisabled(d: boolean) { this.disabled = d; this.draw(); }
  setSelected(s: boolean) { this.selected = s; this.draw(); }
  draw() {
    const v = this.variant;
    let fill: number = P.shell2, border: number = P.border, textCol: number = P.text, alpha = 1;
    if (v === 'primary') { fill = P.accentDeep; border = P.accent; }
    if (v === 'danger') { fill = P.criticalDeep; border = P.critical; }
    if (v === 'warn') { fill = P.warnDeep; border = P.warn; }
    if (v === 'ghost') { fill = P.shell1; border = P.shell3; }
    if (this.selected) { fill = P.accentDeep; border = P.accent; textCol = P.text; }
    if (this.pressed) { fill = P.accent; border = P.accent; textCol = P.shell0; }
    if (this.disabled) { alpha = 0.45; }
    (this as any).bgColor = fill;
    this.bg.clear().roundRect(0, 0, this.w, this.h, RADIUS).fill({ color: fill, alpha }).stroke({ width: 1, color: border, alpha, alignment: 1 });
    if (this.badge) { const bw = this.badge.width + 8; this.bg.roundRect(this.w - bw - 4, 2, bw, LINE.caption, RADIUS).fill(P.warn); }
    if (this.text) { this.text.style.fill = textCol; this.text.alpha = alpha; }
    if (this.ico) { this.ico.tint = textCol; this.ico.alpha = alpha; }
  }
}
export const button = (opts: ButtonOpts) => new Button(opts);

/** Touch-scrollable vertical list. Rows are Containers of `rowH` height (or measured). */
export class ListView extends Container {
  private maskG = new Graphics();
  private inner = new Container();
  private bar = new Graphics();
  private rows: Container[] = [];
  private scrollY = 0; private contentH = 0; private dragging = false; private dragMoved = false; private lastY = 0;
  constructor(public w: number, public h: number, private opts: { gap?: number; onTap?: (index: number, row: Container) => void; bg?: boolean } = {}) {
    super();
    (this as any).kitType = 'list';
    this.addChild(this.maskG, this.inner, this.bar);
    this.mask = this.maskG;
    this.redrawMask();
    this.eventMode = 'static';
    this.hitArea = new Rectangle(0, 0, w, h);
    this.on('pointerdown', (e: FederatedPointerEvent) => { this.dragging = true; this.dragMoved = false; this.lastY = e.globalY; });
    this.on('globalpointermove', (e: FederatedPointerEvent) => { if (!this.dragging) return; const dy = e.globalY - this.lastY; if (Math.abs(dy) > 6 || this.dragMoved) { this.dragMoved = true; this.scrollBy(dy); } this.lastY = e.globalY; });
    const up = (e: FederatedPointerEvent) => {
      if (!this.dragging) return; this.dragging = false;
      if (!this.dragMoved && this.opts.onTap) {
        const local = this.inner.toLocal({ x: e.globalX, y: e.globalY });
        const idx = this.rows.findIndex((r) => local.y >= r.y && local.y < r.y + this.rowHeight(r));
        if (idx >= 0) { sfx.play('ui-tap'); this.opts.onTap(idx, this.rows[idx]); }
      }
    };
    this.on('pointerup', up); this.on('pointerupoutside', up);
  }
  private rowHeight(r: Container) { return (r as any).rowH ?? Math.max(TOUCH_MIN, r.height); }
  private redrawMask() { this.maskG.clear().rect(0, 0, this.w, this.h).fill(0xffffff); }
  resize(w: number, h: number) { this.w = w; this.h = h; this.redrawMask(); this.hitArea = new Rectangle(0, 0, w, h); this.layout(); }
  setRows(rows: Container[]) { this.inner.removeChildren().forEach((c) => c.destroy({ children: true })); this.rows = rows; for (const r of rows) this.inner.addChild(r); this.layout(); }
  layout() {
    let y = 0; const gap = this.opts.gap ?? 0;
    for (const r of this.rows) { r.y = y; y += this.rowHeight(r) + gap; }
    this.contentH = y; this.scrollBy(0); this.drawBar();
  }
  scrollBy(dy: number) { const max = Math.max(0, this.contentH - this.h); this.scrollY = Math.min(max, Math.max(0, this.scrollY - dy)); this.inner.y = -this.scrollY; this.drawBar(); }
  scrollTo(y: number) { this.scrollY = 0; this.scrollBy(-y); }
  private drawBar() {
    this.bar.clear(); const max = this.contentH - this.h; if (max <= 0) return;
    const bh = Math.max(24, (this.h / this.contentH) * this.h), by = (this.scrollY / max) * (this.h - bh);
    this.bar.roundRect(this.w - 4, by, 3, bh, 1.5).fill({ color: P.border, alpha: 0.9 });
  }
  get count() { return this.rows.length; }
}

/** A list row: fixed height, optional selected state, columns laid out by caller. */
export function row(w: number, h = TOUCH_MIN + 4, opts: { selected?: boolean; fill?: number; stripe?: number } = {}): Container & { bg: Graphics; rowH: number } {
  const c = new Container() as Container & { bg: Graphics; rowH: number };
  c.bg = new Graphics(); c.rowH = h; c.addChild(c.bg); (c as any).kitType = 'row'; (c as any).bgColor = opts.selected ? P.shell2 : opts.fill ?? P.shell1;
  c.bg.rect(0, 0, w, h).fill({ color: opts.selected ? P.shell2 : opts.fill ?? P.shell1 }).rect(0, h - 1, w, 1).fill({ color: P.shell3 });
  if (opts.selected) c.bg.rect(0, 0, 4, h).fill(P.accent).rect(0, 0, w, 1).fill(P.accent).rect(0, h - 1, w, 1).fill(P.accent);
  else if (opts.stripe !== undefined) c.bg.rect(0, 0, 4, h).fill(opts.stripe);
  return c;
}

export class Gauge extends Container {
  private bg = new Graphics(); private fg = new Graphics(); private txt: Text; private cap: Text | null = null;
  constructor(public w: number, public h: number, private opts: { color?: number; caption?: string; showValue?: boolean; mono?: boolean } = {}) {
    super();
    (this as any).kitType = 'gauge';
    this.addChild(this.bg, this.fg);
    this.txt = readout('', { size: 'caption', weight: '600' }); this.txt.anchor.set(1, 0.5); this.txt.position.set(w - S.half, h / 2); this.addChild(this.txt);
    if (opts.caption) { this.cap = label(opts.caption, { size: 'caption', color: P.text, weight: '600', upper: true }); this.cap.anchor.set(0, 0.5); this.cap.position.set(S.half, h / 2); this.addChild(this.cap); }
    this.set(0, 1);
  }
  set(value: number, max: number, color?: number) {
    const f = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    const col = color ?? this.opts.color ?? P.accent;
    this.bg.clear().roundRect(0, 0, this.w, this.h, 2).fill(P.shell0).stroke({ width: 1, color: P.shell3, alignment: 1 });
    this.fg.clear(); if (f > 0) this.fg.roundRect(0, 0, Math.max(2, this.w * f), this.h, 2).fill({ color: col, alpha: 0.85 });
    this.txt.text = this.opts.showValue === false ? '' : `${Math.round(value)}/${Math.round(max)}`;
  }
}

/** Stepper: −/+ around a mono readout. */
export class Stepper extends Container {
  private val: Text; minus: Button; plus: Button;
  constructor(public value: number, private opts: { min?: number; max?: number; step?: number; onChange?: (v: number) => void; w?: number }) {
    super();
    (this as any).kitType = 'stepper';
    const w = opts.w ?? 176;
    this.minus = button({ icon: 'minus', w: S.x6, onTap: () => this.change(-(opts.step ?? 1)) });
    this.plus = button({ icon: 'plus', w: S.x6, onTap: () => this.change(opts.step ?? 1) }); this.plus.x = w - S.x6;
    this.val = readout(value, { size: 'control', weight: '600', align: 'center' }); this.val.position.set(w / 2, (S.x6 - LINE.control) / 2);
    this.addChild(this.minus, this.plus, this.val);
  }
  change(d: number) { const v = Math.max(this.opts.min ?? 0, Math.min(this.opts.max ?? Infinity, this.value + d)); if (v === this.value) return; this.value = v; this.val.text = String(v); this.opts.onChange?.(v); }
  set(v: number) { this.value = v; this.val.text = String(v); }
}

export class TabBar extends Container {
  buttons: Button[] = [];
  constructor(tabs: { id: string; label: string; icon?: string }[], private onSelect: (id: string) => void, selected: string, w?: number) {
    super();
    const bw = w ? Math.floor(w / tabs.length) : undefined;
    let x = 0;
    for (const t of tabs) {
      const b = button({ label: t.label, icon: t.icon, w: bw, variant: 'ghost', selected: t.id === selected, onTap: () => { this.select(t.id); onSelect(t.id); } });
      b.x = x; x += b.w + (bw ? 0 : S.x1); this.buttons.push(b); (b as any).tabId = t.id; this.addChild(b);
    }
  }
  select(id: string) { for (const b of this.buttons) b.setSelected((b as any).tabId === id); }
}

/** Scene header: back button, title, right-side actions. Height 56 (48 + grid). */
export function header(w: number, title: string, opts: { onBack?: () => void; backLabel?: string; actions?: Button[]; subtitle?: string } = {}): Container {
  const c = new Container(); const H = S.x6 + S.x1; (c as any).kitType = 'header'; (c as any).bgColor = P.shell1;
  const g = new Graphics().rect(0, 0, w, H).fill(P.shell1).rect(0, H - 1, w, 1).fill(P.border); c.addChild(g);
  let x = S.x1;
  if (opts.onBack) { const b = button({ icon: 'back', label: opts.backLabel, onTap: opts.onBack, variant: 'ghost' }); b.position.set(x, S.half); c.addChild(b); x += b.w + S.x2; }
  const t = label(title, { size: 'title', weight: '600' }); t.position.set(x, Math.round((H - LINE.title) / 2)); c.addChild(t);
  if (opts.subtitle) { const numeric = /^[\d.,%$+\-:/ ]+$/.test(opts.subtitle); const s = numeric ? readout(opts.subtitle, { size: 'caption', color: P.textMuted }) : label(opts.subtitle, { size: 'caption', color: P.textMuted, upper: true }); s.position.set(x + t.width + S.x2, Math.round((H - LINE.caption) / 2) + 1); c.addChild(s); }
  let rx = w - S.x1;
  for (const a of (opts.actions ?? []).slice().reverse()) { rx -= a.w; a.position.set(rx, S.half); c.addChild(a); rx -= S.x1; }
  (c as any).height_ = H;
  return c;
}
export const HEADER_H = S.x6 + S.x1;

/** Modal dialog in the overlay layer. Returns close(). */
export function modal(opts: { title: string; body?: Container | string; buttons?: ButtonOpts[]; w?: number; dismissable?: boolean }): () => void {
  const layer = new Container(); layer.label = 'modal';
  const dim = new Graphics().rect(0, 0, app.w, app.h).fill({ color: P.shell0, alpha: 0.7 }); dim.eventMode = 'static'; layer.addChild(dim);
  const w = Math.min(opts.w ?? 480, app.w - S.x4);
  let bodyNode: Container | null = null;
  if (typeof opts.body === 'string') bodyNode = label(opts.body, { wrap: w - S.x2 * 2 }); else if (opts.body) bodyNode = opts.body;
  const bodyH = bodyNode ? Math.ceil(bodyNode.height) : 0;
  const btns = (opts.buttons ?? [{ label: 'OK', variant: 'primary' }]).map((b) => button({ ...b, onTap: () => { close(); b.onTap?.(); } }));
  const btnH = btns.length ? S.x6 : 0;
  const h = S.x2 + LINE.caption + S.x1 + bodyH + (bodyH ? S.x2 : 0) + btnH + S.x2;
  const p = new Panel(w, h, { title: opts.title });
  if (bodyNode) p.content.addChild(bodyNode);
  let bx = w - S.x2;
  for (const b of btns.slice().reverse()) { bx -= b.w; b.position.set(bx - S.x2, bodyH + (bodyH ? S.x2 : 0)); p.content.addChild(b); bx -= S.x1; }
  p.position.set(Math.round((app.w - w) / 2), Math.round((app.h - h) / 2));
  layer.addChild(p);
  app.overlay.addChild(layer);
  const close = () => { if (layer.parent) layer.parent.removeChild(layer); layer.destroy({ children: true }); };
  if (opts.dismissable) dim.on('pointertap', close);
  return close;
}

/** Transient toast at the top centre. */
let toastNode: Container | null = null; let toastTimer: any = null;
export function toast(text: string, kind: 'info' | 'warn' | 'critical' = 'info') {
  if (toastNode) { toastNode.destroy({ children: true }); toastNode = null; }
  const t = label(text, { size: 'body', weight: '600' });
  const w = t.width + S.x3 * 2, h = S.x6;
  const c = new Container();
  const col = kind === 'critical' ? P.critical : kind === 'warn' ? P.warn : P.accent;
  const g = new Graphics().roundRect(0, 0, w, h, RADIUS).fill(P.shell2).stroke({ width: 1, color: col, alignment: 1 }).rect(0, 0, 4, h).fill(col);
  c.addChild(g, t); t.position.set(S.x3, (h - LINE.body) / 2);
  c.position.set(Math.round((app.w - w) / 2), app.safe.top + S.x1);
  c.eventMode = 'none';
  app.overlay.addChild(c); toastNode = c;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { if (toastNode === c) { c.destroy({ children: true }); toastNode = null; } }, 2600);
}
bus.on('toast', (p: { text: string; kind?: 'info' | 'warn' | 'critical' }) => toast(p.text, p.kind));

/** Layout helpers on the 8pt grid. */
export function col(items: Container[], gap = S.x1, x = 0, y = 0) { let yy = y; for (const it of items) { it.position.set(x, yy); yy += it.height + gap; } return yy - gap; }
export function rowLayout(items: Container[], gap = S.x1, x = 0, y = 0) { let xx = x; for (const it of items) { it.position.set(xx, y); xx += it.width + gap; } return xx - gap; }
export function divider(w: number, color = P.shell3) { return new Graphics().rect(0, 0, w, 1).fill(color); }
export function keyValue(k: string, v: string | number, w: number, opts: { mono?: boolean; color?: number } = {}): Container {
  const c = new Container(); const kk = label(k, { size: 'body', color: P.textMuted }); const vv = readout(String(v), { size: 'body', weight: '600', color: opts.color, align: 'right' }); vv.x = w; c.addChild(kk, vv); (c as any).rowH = LINE.body + S.half; return c;
}
export const hasIcon = (name: string) => has(`icon/${name}`);
/** Colour + icon pairs for states so colour is never the sole carrier. */
export const STATE = { ok: { color: P.ok, icon: 'check' }, warn: { color: P.warn, icon: 'warning' }, critical: { color: P.critical, icon: 'critical' }, info: { color: P.accent, icon: 'info' } } as const;
