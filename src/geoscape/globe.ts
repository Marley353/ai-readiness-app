// Orthographic filled-polygon globe rendered with Pixi Graphics; retessellated only when the view changes.
import { Container, Graphics } from 'pixi.js';
import { P } from '../design/palette';
import { LAND } from './world';
const R = Math.PI / 180;
export class Globe extends Container {
  private g = new Graphics(); private night = new Graphics();
  lon0 = 0; lat0 = 30; radius = 300; private dirty = true; private lastSun = -1;
  constructor() { super(); this.addChild(this.g, this.night); }
  setView(lon0: number, lat0: number, radius: number) { this.lon0 = ((lon0 + 540) % 360) - 180; this.lat0 = Math.max(-85, Math.min(85, lat0)); this.radius = radius; this.dirty = true; }
  project(lon: number, lat: number): { x: number; y: number; visible: boolean } {
    const φ = lat * R, λ = (lon - this.lon0) * R, φ0 = this.lat0 * R;
    const cosc = Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ);
    const x = this.radius * Math.cos(φ) * Math.sin(λ), y = -this.radius * (Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(λ));
    return { x, y, visible: cosc >= 0 };
  }
  unproject(x: number, y: number): { lon: number; lat: number } | null {
    const ρ = Math.sqrt(x * x + y * y); if (ρ > this.radius) return null; const c = Math.asin(ρ / this.radius); const φ0 = this.lat0 * R;
    const yy = -y; const lat = Math.asin(Math.cos(c) * Math.sin(φ0) + (ρ === 0 ? 0 : (yy * Math.sin(c) * Math.cos(φ0)) / ρ)) / R;
    const lon = this.lon0 + Math.atan2(x * Math.sin(c), ρ * Math.cos(c) * Math.cos(φ0) - yy * Math.sin(c) * Math.sin(φ0)) / R;
    return { lon: ((lon + 540) % 360) - 180, lat };
  }
  /** Redraw if the view changed; sunLon = subsolar longitude for the night overlay. */
  draw(sunLon: number) {
    if (this.dirty) {
      const g = this.g; g.clear(); g.circle(0, 0, this.radius).fill(P.water);
      for (const ring of LAND) {
        const pts: number[] = []; let any = false;
        for (let i = 0; i < ring.length; i++) { const [lon, lat] = ring[i]; const p = this.project(lon, lat); if (p.visible) { any = true; pts.push(p.x, p.y); } else { const dir = Math.atan2(p.y, p.x); pts.push(Math.cos(dir) * this.radius, Math.sin(dir) * this.radius); } }
        if (!any || pts.length < 6) continue;
        const polar = ring.every(([, lat]) => Math.abs(lat) > 60); g.poly(pts).fill(polar ? P.snow : P.grass);
      }
      for (let lat = -60; lat <= 60; lat += 30) { const pts: number[] = []; for (let lon = -180; lon <= 180; lon += 5) { const p = this.project(lon, lat); if (p.visible) pts.push(p.x, p.y); else if (pts.length) { g.poly(pts, false).stroke({ width: 1, color: P.shell3, alpha: 0.4 }); pts.length = 0; } } if (pts.length > 2) g.poly(pts, false).stroke({ width: 1, color: P.shell3, alpha: 0.4 }); }
      for (let lon = -180; lon < 180; lon += 30) { const pts: number[] = []; for (let lat = -80; lat <= 80; lat += 5) { const p = this.project(lon, lat); if (p.visible) pts.push(p.x, p.y); else if (pts.length) { g.poly(pts, false).stroke({ width: 1, color: P.shell3, alpha: 0.4 }); pts.length = 0; } } if (pts.length > 2) g.poly(pts, false).stroke({ width: 1, color: P.shell3, alpha: 0.4 }); }
      g.circle(0, 0, this.radius + 1).stroke({ width: 2, color: P.accent, alpha: 0.3 });
      this.dirty = false; this.lastSun = -1;
    }
    const sun = Math.round(sunLon / 3) * 3;
    if (sun !== this.lastSun) { this.lastSun = sun; const n = this.night; n.clear(); const pts: number[] = []; for (let a = 0; a <= 360; a += 6) { const t = a * R; const lat = 89.9 * Math.sin(t); const lon = sun + 180 + 90 * Math.cos(t); const p = this.project(lon, lat); if (p.visible) pts.push(p.x, p.y); else { const d = Math.atan2(p.y, p.x); pts.push(Math.cos(d) * this.radius, Math.sin(d) * this.radius); } } if (pts.length > 6) n.poly(pts).fill({ color: P.night, alpha: 0.45 }); }
  }
}
