import type { CountryDef, RegionDef } from './types';
const c = (id: string, name: string, fundingMin: number, fundingMax: number, region: string, areas: [number, number, number, number][], labelLon: number, labelLat: number): CountryDef => ({ id, name, fundingMin: fundingMin * 1000, fundingMax: fundingMax * 1000, region, areas, labelLon, labelLat });
// Funding ranges ($k/month) from the original; areas are [lonMin, lonMax, latMin, latMax] boxes.
export const COUNTRIES: Record<string, CountryDef> = Object.fromEntries(([
  c('usa', 'USA', 600, 1000, 'north-america', [[-125, -66, 25, 49], [-168, -141, 55, 71]], -98, 39),
  c('russia', 'Russia', 230, 460, 'siberia', [[30, 60, 50, 70], [60, 180, 50, 76]], 60, 60),
  c('uk', 'United Kingdom', 240, 480, 'europe', [[-10, 2, 50, 59]], -2, 54),
  c('france', 'France', 320, 640, 'europe', [[-5, 8, 42, 51]], 2, 47),
  c('germany', 'Germany', 250, 500, 'europe', [[6, 15, 47, 55]], 10, 51),
  c('italy', 'Italy', 160, 320, 'europe', [[7, 18, 37, 47]], 12, 43),
  c('spain', 'Spain', 140, 280, 'europe', [[-9, 3, 36, 44]], -4, 40),
  c('china', 'China', 245, 490, 'central-asia', [[75, 135, 20, 50]], 105, 35),
  c('japan', 'Japan', 400, 800, 'south-east-asia', [[129, 146, 30, 46]], 138, 37),
  c('india', 'India', 150, 300, 'central-asia', [[68, 97, 8, 35]], 78, 22),
  c('brazil', 'Brazil', 300, 600, 'south-america', [[-74, -35, -33, 5]], -52, -10),
  c('australia', 'Australia', 170, 340, 'australasia', [[113, 154, -44, -10]], 134, -25),
  c('nigeria', 'Nigeria', 100, 200, 'north-africa', [[3, 15, 4, 14]], 8, 9),
  c('south-africa', 'South Africa', 140, 280, 'southern-africa', [[16, 33, -35, -22]], 25, -29),
  c('egypt', 'Egypt', 130, 260, 'north-africa', [[25, 36, 22, 32]], 30, 27),
  c('canada', 'Canada', 110, 220, 'north-america', [[-141, -52, 49, 70]], -100, 58),
] as CountryDef[]).map((x) => [x.id, x]));

const rg = (id: string, name: string, baseCost: number, areas: [number, number, number, number][], cities: [string, number, number][], w: number[] = [1, 1, 1, 1]): RegionDef => ({ id, name, baseCost, areas, cities: cities.map(([n, lon, lat]) => ({ name: n, lon, lat })), missionWeights: { research: w, harvest: w, abduction: w, infiltration: w, base: w, terror: w, retaliation: w, supply: w } });
export const REGIONS: Record<string, RegionDef> = Object.fromEntries(([
  rg('north-america', 'North America', 800000, [[-170, -52, 15, 72]], [['New York', -74, 40.7], ['Washington', -77, 38.9], ['Los Angeles', -118.2, 34], ['Chicago', -87.6, 41.9], ['Toronto', -79.4, 43.7], ['Montreal', -73.6, 45.5], ['Mexico City', -99.1, 19.4], ['Houston', -95.4, 29.8], ['San Francisco', -122.4, 37.8], ['Vancouver', -123.1, 49.3]]),
  rg('arctic', 'Arctic', 800000, [[-180, 180, 72, 90]], []),
  rg('antarctica', 'Antarctica', 900000, [[-180, 180, -90, -60]], []),
  rg('south-america', 'South America', 600000, [[-90, -30, -60, 15]], [['Brasilia', -47.9, -15.8], ['Bogota', -74.1, 4.7], ['Buenos Aires', -58.4, -34.6], ['Santiago', -70.7, -33.4], ['Rio de Janeiro', -43.2, -22.9], ['Lima', -77, -12], ['Caracas', -66.9, 10.5]]),
  rg('europe', 'Europe', 1000000, [[-25, 30, 35, 72], [30, 60, 45, 50]], [['London', -0.1, 51.5], ['Paris', 2.3, 48.9], ['Berlin', 13.4, 52.5], ['Rome', 12.5, 41.9], ['Madrid', -3.7, 40.4], ['Moscow', 37.6, 55.8], ['Bonn', 7.1, 50.7], ['Warsaw', 21, 52.2], ['Stockholm', 18.1, 59.3], ['Istanbul', 29, 41]]),
  rg('north-africa', 'North Africa', 600000, [[-20, 52, 5, 35]], [['Cairo', 31.2, 30], ['Lagos', 3.4, 6.5], ['Casablanca', -7.6, 33.6], ['Algiers', 3.1, 36.8], ['Nairobi', 36.8, -1.3]]),
  rg('southern-africa', 'Southern Africa', 500000, [[5, 55, -40, 5]], [['Johannesburg', 28, -26.2], ['Cape Town', 18.4, -33.9], ['Kinshasa', 15.3, -4.3], ['Luanda', 13.2, -8.8]]),
  rg('central-asia', 'Central Asia', 500000, [[45, 100, 5, 50], [100, 135, 20, 50]], [['Beijing', 116.4, 39.9], ['Delhi', 77.2, 28.6], ['Karachi', 67, 24.9], ['Tehran', 51.4, 35.7], ['Baghdad', 44.4, 33.3], ['Shanghai', 121.5, 31.2], ['Hong Kong', 114.2, 22.3], ['Riyadh', 46.7, 24.7]]),
  rg('south-east-asia', 'South East Asia', 600000, [[95, 150, -12, 35]], [['Tokyo', 139.7, 35.7], ['Singapore', 103.8, 1.3], ['Bangkok', 100.5, 13.8], ['Manila', 121, 14.6], ['Jakarta', 106.8, -6.2], ['Seoul', 127, 37.6]]),
  rg('siberia', 'Siberia', 500000, [[60, 180, 50, 72]], [['Novosibirsk', 82.9, 55], ['Vladivostok', 131.9, 43.1]]),
  rg('australasia', 'Australasia', 800000, [[110, 180, -50, -10]], [['Canberra', 149.1, -35.3], ['Sydney', 151.2, -33.9], ['Melbourne', 145, -37.8], ['Perth', 115.9, -32], ['Wellington', 174.8, -41.3]]),
  rg('pacific', 'Pacific', 600000, [[150, 180, -50, 50], [-180, -130, -50, 50]], [['Honolulu', -157.9, 21.3]]),
  rg('north-atlantic', 'North Atlantic', 500000, [[-70, -20, 15, 72]], []),
  rg('south-atlantic', 'South Atlantic', 500000, [[-50, 5, -60, 5]], []),
  rg('indian-ocean', 'Indian Ocean', 500000, [[40, 110, -50, 5]], []),
] as RegionDef[]).map((x) => [x.id, x]));
export const allRegions = () => Object.values(REGIONS);
export const inBox = (lon: number, lat: number, b: [number, number, number, number]) => lon >= b[0] && lon <= b[1] && lat >= b[2] && lat <= b[3];
export const regionAt = (lon: number, lat: number): RegionDef => Object.values(REGIONS).find((r) => r.areas.some((a) => inBox(lon, lat, a))) ?? REGIONS['north-atlantic'];
export const countryAt = (lon: number, lat: number): CountryDef | undefined => Object.values(COUNTRIES).find((c) => c.areas.some((a) => inBox(lon, lat, a)));
