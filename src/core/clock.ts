import { CAMPAIGN_START } from './state';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (ms: number) => { const d = new Date(ms); return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
export const fmtTime = (ms: number) => { const d = new Date(ms); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`; };
export const fmtDateTime = (ms: number) => `${fmtDate(ms)} ${fmtTime(ms)}`;
/** Months elapsed since campaign start (0 = January 1999). */
export const monthIndex = (ms: number) => { const d = new Date(ms), s = new Date(CAMPAIGN_START); return (d.getUTCFullYear() - s.getUTCFullYear()) * 12 + d.getUTCMonth() - s.getUTCMonth(); };
export const monthName = (ms: number) => MONTHS[new Date(ms).getUTCMonth()];
export const HOUR = 3600_000, DAY = 86_400_000, MINUTE = 60_000;
export const daysInMonth = (ms: number) => { const d = new Date(ms); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); };
export const isNightAt = (ms: number, lon: number) => { const h = (new Date(ms).getUTCHours() + lon / 15 + 24) % 24; return h < 6 || h >= 18; };
export const fmtMoney = (n: number) => { const neg = n < 0; const a = Math.abs(Math.round(n)); const s = a.toLocaleString('en-GB'); return (neg ? '-$' : '$') + s; };
