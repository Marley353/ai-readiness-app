import { Container } from 'pixi.js';
import type { Scene } from '../app/SceneManager';
import { scenes } from '../app/SceneManager';
import { app } from '../app/App';
import { label, readout, button, Panel, ListView, row, header, HEADER_H } from '../ui/kit';
import { P } from '../design/palette';
import { S } from '../design/spacing';
import { getState, hasState } from '../core/state';
import { ARTICLES, CATEGORIES, type Category, type Article } from './articles';
import { sprite, has } from '../render/atlas';
export class UfopaediaScene implements Scene {
  private root!: Container; private cat: Category = 'Craft'; private article: Article | null = null;
  mount(root: Container, params: any) { this.root = root; if (params?.article) { this.article = ARTICLES.find((a) => a.id === params.article || a.id === `research-${params.article}` || a.id === `alien-${params.article}`) ?? null; if (this.article) this.cat = this.article.category; } this.build(); }
  unmount() {} update() {} resize() { this.root.removeChildren().forEach((c) => c.destroy({ children: true })); this.build(); }
  private unlocked(a: Article) { if (!a.requires) return true; return hasState() ? getState().researched.includes(a.requires) : false; }
  private build() {
    const w = app.w; this.root.addChild(header(w, 'UFOpaedia', { onBack: () => (hasState() ? scenes.back('geoscape') : scenes.show('menu')), subtitle: this.cat }));
    const x0 = app.safe.left + S.x2, y0 = HEADER_H + S.x2; const ph = app.h - y0 - app.safe.bottom - S.x2;
    const cats = new ListView(216, ph, { onTap: (i) => { this.cat = CATEGORIES[i]; this.article = null; this.resize(); } }); cats.position.set(x0, y0); this.root.addChild(cats);
    cats.setRows(CATEGORIES.map((c) => { const r = row(216, 48, { selected: c === this.cat }); const t = label(c, { size: 'body', weight: c === this.cat ? '600' : '400' }); t.position.set(S.x2, 14); r.addChild(t); return r; }));
    const items = ARTICLES.filter((a) => a.category === this.cat && this.unlocked(a));
    const list = new ListView(248, ph, { onTap: (i) => { this.article = items[i]; this.resize(); } }); list.position.set(x0 + 216 + S.x1, y0); this.root.addChild(list);
    list.setRows(items.length ? items.map((a) => { const r = row(248, 48, { selected: a === this.article }); const t = label(a.title, { size: 'body' }); t.position.set(S.x2, 14); r.addChild(t); return r; }) : [(() => { const r = row(248, 48); const t = label('No entries unlocked', { size: 'body', color: P.textMuted }); t.position.set(S.x2, 14); r.addChild(t); return r; })()]);
    const a = this.article ?? items[0]; if (!a) return;
    const px = x0 + 216 + S.x1 + 248 + S.x2; const pw = w - px - app.safe.right - S.x2;
    const p = new Panel(pw, ph, { title: a.title }); p.position.set(px, y0); this.root.addChild(p);
    let y = 0; if (has(a.sprite)) { const s = sprite(a.sprite); s.scale.set(2); s.position.set(0, 0); p.content.addChild(s); y = s.height + S.x2; }
    const body = label(a.body, { size: 'body', wrap: pw - S.x2 * 2 }); body.position.set(0, y); p.content.addChild(body); y += body.height + S.x2;
    for (const [k, v] of a.stats) { const kk = label(k, { size: 'caption', color: P.textMuted, upper: true }); kk.position.set(0, y); p.content.addChild(kk); const vv = readout(v, { size: 'body', weight: '600', align: 'right' }); vv.position.set(pw - S.x2 * 2, y - 2); p.content.addChild(vv); y += 24; }
  }
}
