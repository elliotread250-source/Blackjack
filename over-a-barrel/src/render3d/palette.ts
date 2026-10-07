import { Color } from 'three';

/** Lighting and sky at a given altitude. Interpolated between keyframes. */
export interface Atmos {
  skyTop: Color;
  skyHorizon: Color;
  skyBottom: Color;
  fog: Color;
  sun: Color;
  sunIntensity: number;
  /** Sun height above the horizon, 0..1 (drops as you climb into the evening). */
  sunElevation: number;
  hemiSky: Color;
  hemiGround: Color;
  hemiIntensity: number;
  /** 0 calm .. 1 full storm: drives snow, rain, wind and lightning. */
  storm: number;
  stars: number;
}

interface Key {
  h: number;
  skyTop: string;
  skyHorizon: string;
  skyBottom: string;
  fog: string;
  sun: string;
  sunIntensity: number;
  sunElevation: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  storm: number;
  stars: number;
}

// Warm golden hour at the bottom, cold stormy night at the top.
const KEYS: Key[] = [
  { h: -20, skyTop: '#5677b0', skyHorizon: '#ffc48a', skyBottom: '#e9a46f', fog: '#f1b98a', sun: '#ffe2b0', sunIntensity: 2.6, sunElevation: 0.32, hemiSky: '#ffe4c4', hemiGround: '#7a5340', hemiIntensity: 1.1, storm: 0, stars: 0 },
  { h: 45, skyTop: '#4a5d9e', skyHorizon: '#ff9d6b', skyBottom: '#d9805c', fog: '#eb9a74', sun: '#ffc68f', sunIntensity: 2.4, sunElevation: 0.2, hemiSky: '#ffd2b0', hemiGround: '#6e4636', hemiIntensity: 1.0, storm: 0, stars: 0 },
  { h: 95, skyTop: '#33357a', skyHorizon: '#d9738a', skyBottom: '#9b5a7c', fog: '#a56f8f', sun: '#ff9e86', sunIntensity: 1.9, sunElevation: 0.08, hemiSky: '#d8b6d8', hemiGround: '#4c3a4e', hemiIntensity: 0.95, storm: 0.12, stars: 0.15 },
  { h: 140, skyTop: '#1f2752', skyHorizon: '#62719a', skyBottom: '#4b5778', fog: '#56648a', sun: '#c9d6ff', sunIntensity: 1.7, sunElevation: 0.18, hemiSky: '#a9b8e0', hemiGround: '#4a5068', hemiIntensity: 1.25, storm: 0.45, stars: 0.35 },
  { h: 185, skyTop: '#121930', skyHorizon: '#3b4866', skyBottom: '#2b354d', fog: '#33405a', sun: '#b8c8f0', sunIntensity: 1.7, sunElevation: 0.3, hemiSky: '#8e9ecc', hemiGround: '#3b4258', hemiIntensity: 1.35, storm: 0.9, stars: 0.4 },
  { h: 230, skyTop: '#0a0f22', skyHorizon: '#3a3466', skyBottom: '#1f2440', fog: '#2a2f50', sun: '#d0dbff', sunIntensity: 1.8, sunElevation: 0.42, hemiSky: '#9aa0d8', hemiGround: '#363a58', hemiIntensity: 1.35, storm: 0.55, stars: 1 },
];

const tmpA = new Color();
const tmpB = new Color();

function mixColor(out: Color, a: string, b: string, t: number): Color {
  tmpA.set(a);
  tmpB.set(b);
  return out.copy(tmpA).lerp(tmpB, t);
}

export function createAtmos(): Atmos {
  return {
    skyTop: new Color(),
    skyHorizon: new Color(),
    skyBottom: new Color(),
    fog: new Color(),
    sun: new Color(),
    sunIntensity: 1,
    sunElevation: 0.3,
    hemiSky: new Color(),
    hemiGround: new Color(),
    hemiIntensity: 1,
    storm: 0,
    stars: 0,
  };
}

export function sampleAtmos(out: Atmos, height: number): Atmos {
  let i = 0;
  while (i < KEYS.length - 2 && height > KEYS[i + 1].h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  let t = (height - a.h) / (b.h - a.h);
  t = Math.min(1, Math.max(0, t));
  t = t * t * (3 - 2 * t);
  mixColor(out.skyTop, a.skyTop, b.skyTop, t);
  mixColor(out.skyHorizon, a.skyHorizon, b.skyHorizon, t);
  mixColor(out.skyBottom, a.skyBottom, b.skyBottom, t);
  mixColor(out.fog, a.fog, b.fog, t);
  mixColor(out.sun, a.sun, b.sun, t);
  mixColor(out.hemiSky, a.hemiSky, b.hemiSky, t);
  mixColor(out.hemiGround, a.hemiGround, b.hemiGround, t);
  out.sunIntensity = a.sunIntensity + (b.sunIntensity - a.sunIntensity) * t;
  out.sunElevation = a.sunElevation + (b.sunElevation - a.sunElevation) * t;
  out.hemiIntensity = a.hemiIntensity + (b.hemiIntensity - a.hemiIntensity) * t;
  out.storm = a.storm + (b.storm - a.storm) * t;
  out.stars = a.stars + (b.stars - a.stars) * t;
  return out;
}

/** Rock tint by the altitude of the rock itself, so the mountain is banded. */
const ROCK_BANDS: [number, string][] = [
  [-10, '#b48d6d'], // warm sandstone
  [30, '#a8745a'],
  [60, '#9c5644'], // red canyon
  [100, '#7e6676'], // dusky violet
  [140, '#7a8396'], // cold granite
  [190, '#7a8298'],
  [230, '#8088a0'],
];

const CAP_BANDS: [number, string][] = [
  [-10, '#87a84b'], // grass
  [40, '#8f9a46'],
  [80, '#b3a77a'], // dry
  [105, '#dfe7ef'], // frost
  [150, '#f3f6fa'], // snow
  [240, '#f6f8fb'],
];

function band(out: Color, bands: [number, string][], y: number): Color {
  let i = 0;
  while (i < bands.length - 2 && y > bands[i + 1][0]) i++;
  const [ha, ca] = bands[i];
  const [hb, cb] = bands[i + 1];
  const t = Math.min(1, Math.max(0, (y - ha) / (hb - ha)));
  return mixColor(out, ca, cb, t);
}

export function rockColor(out: Color, y: number): Color {
  return band(out, ROCK_BANDS, y);
}

export function capColor(out: Color, y: number): Color {
  return band(out, CAP_BANDS, y);
}
