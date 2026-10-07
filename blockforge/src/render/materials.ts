// Terrain ShaderMaterials (opaque, cutout, translucent, water, lava) sharing one uniform set,
// plus the shadow depth materials, the clip-plane variants for the planar water reflection
// pass and the first-person hand variants.
//
// GLSL is written as GLSL ES 1.00 for ShaderMaterial; three.js adds the #version 300 es
// conversion on WebGL2. Rules followed for WebGL1: no dynamic array indexing, no integer bit
// operations (flags are decoded with floor/mod), no round(), no texture arrays, no
// matrix-from-matrix constructors in fragment shaders.
//
// Shader packs are compile-time defines, so the Off pack runs exactly the cheap shaders:
//   (none)       Off: one texture fetch, one mix and a fog mix per fragment. Lighting, the
//                MC-style light curve, gamma (brightness option), tint and the fog colour are
//                all evaluated per vertex.
//   USE_SHADOWS  sun/moon shadow map, 16-tap bilinear PCF, faded out at the shadow distance
//   WAVING       swaying plants and leaves, gentle swell on liquid surfaces
//   FANCY        sky light split into cool ambient + warm direct sun (shadowed), stronger torch
//                light, reflective water (smooth ripple normals, fresnel sky reflection, glints)
//   ULTRA        HDR output for the post chain: emissive texels (torch flames, glowstone...),
//                hot lava and sun glints go above 1 so the bloom pass picks them up
//   PLANAR       (water) samples the planar reflection texture near sea level
//   CLIP_PLANE   (reflection pass) discards fragments below uClipY
import {
  ShaderMaterial, Color, Vector2, Vector3, Matrix4, FrontSide, DoubleSide, NormalBlending,
  BufferGeometry, BufferAttribute, Sphere, DataTexture, RGBAFormat, UnsignedByteType, NearestFilter,
  ClampToEdgeWrapping,
} from 'three';
import type { IUniform, Texture } from 'three';
import type { MeshLayer } from '../types';
import { ATLAS_SIZE, ATLAS_COLS, MAX_TILES, tileOrigin } from './atlas';
import type { Atlas } from './atlas';
import { EXTRA_TEX, EMIT, FACE_TEX, COUNT } from '../blocks/registry';

export interface SharedUniforms { [k: string]: IUniform }

/** Which shader features are compiled in (see the header). */
export interface PackFlags { shadows: boolean; waving: boolean; fancy: boolean; ultra: boolean; planar: boolean }

export interface Materials {
  opaque: ShaderMaterial; cutout: ShaderMaterial; translucent: ShaderMaterial; water: ShaderMaterial; lava: ShaderMaterial;
  uniforms: SharedUniforms;
  byLayer: ShaderMaterial[];
  setShadows(on: boolean): void;
  /** Extra: compile waving plants/leaves/water swell in or out (also sets uWaving). */
  setWaving(on: boolean): void;
  /** Extra: switch every feature of a shader pack at once (recompiles only what changed). */
  setPack(f: PackFlags): void;
  /** Extra: shadow-pass depth materials (RGBA packed depth) for the opaque and cutout layers. */
  depth: { opaque: ShaderMaterial; cutout: ShaderMaterial };
  /** Extra: planar reflection pass materials (fragments below uClipY discarded). */
  refl: { opaque: ShaderMaterial; cutout: ShaderMaterial; lava: ShaderMaterial };
  /** Extra: frees the GPU programs of the reflection materials (they recompile on next use). */
  releaseReflection(): void;
  dispose(): void;
}

/** Height of a still water surface at sea level (y = 62 + 14/16): the planar reflection plane. */
export const WATER_PLANE_Y = 62 + 14 / 16;

// ---------------------------------------------------------------------------------- GLSL

/** Precision helper: HP is highp where the fragment stage supports it. */
const HP_VS = '#define HP highp\n';
const HP_FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif
`;

/** Uniforms used by the sky colour function (terrain fog, water reflections, sky dome, clouds). */
export const SKY_UNIFORMS_GLSL = `
uniform HP vec3 uSkyTop;
uniform HP vec3 uSkyHorizon;
uniform HP vec3 uGlowColor;
uniform HP vec3 uGlowDir;
uniform HP float uGlow;
`;

/**
 * Sky colour seen along direction d (normalised). Below the horizon it stays the horizon
 * colour, which is also what distant terrain fades into, so the world edge never shows.
 */
export const SKY_FN_GLSL = `
vec3 skyColor(vec3 d) {
  float up = clamp(d.y, 0.0, 1.0);
  float k = 1.0 - up;
  vec3 c = mix(uSkyTop, uSkyHorizon, k * k * k);
  if (uGlow > 0.001) {
    vec2 hd = d.xz / max(length(d.xz), 0.0001);
    float f = dot(hd, uGlowDir.xz) * 0.5 + 0.5;
    float g = uGlow * f * f * f * exp(-abs(d.y) * 3.2);
    c = mix(c, uGlowColor, clamp(g, 0.0, 1.0));
  }
  return c;
}
`;

export const PACK_GLSL = `
vec4 packDepth(highp float v) {
  highp vec4 r = vec4(fract(v * vec3(16777216.0, 65536.0, 256.0)), v);
  r.yzw -= r.xyz * (1.0 / 256.0);
  return r * (256.0 / 255.0);
}
`;

export const LIGHT_FN_GLSL = `
float lightCurve(float l) { return l / (4.0 - 3.0 * l); }
// sum of sky and block light -> final multiplier: ambient floor, then the brightness
// option as a gamma lift (0 = moody, 1 = bright), like the original game's lightmap.
vec3 finishLight(vec3 c) {
  c = clamp(c, 0.0, 1.0) * 0.95 + 0.05;
  vec3 ic = 1.0 - c;
  ic *= ic; ic *= ic;
  return mix(c, 1.0 - ic, uBrightness);
}
`;

const TERRAIN_VS = `
attribute vec2 auv;
attribute vec4 atint;
attribute vec4 alight;

uniform float uTime;
uniform float uAtlasSize;
uniform vec3 uCamWrap;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uFogColor;
uniform vec3 uSkyLightColor;
uniform vec3 uBlockLightColor;
uniform float uBrightness;
${SKY_UNIFORMS_GLSL}
#ifdef USE_SHADOWS
uniform mat4 uShadowMatrix;
uniform vec3 uLightDir;
uniform float uShadowNormalOffset;
uniform vec2 uShadowFade;
varying HP vec4 vShadow;
varying float vShadowFade;
varying float vSkyB;
varying vec3 vBlock;
#endif
#if defined(CLIP_PLANE) || defined(PLANAR)
varying HP float vWorldY;
#endif
#ifdef HAND
uniform vec2 uHandLight;
#endif

varying HP vec2 vUv;
varying vec3 vColor;
varying vec4 vFog;
#ifdef LAYER_OPAQUE
varying vec3 vTint;
#endif
#if defined(LAYER_WATER) || defined(LAYER_LAVA)
varying HP vec2 vFace;
varying HP vec3 vRel;
varying vec3 vNormal;
varying vec3 vTintW;
varying float vSkyVis;
#endif

${SKY_FN_GLSL}
${LIGHT_FN_GLSL}

void main() {
  float flags = floor(alight.w * 255.0 + 0.5);
  float face = mod(flags, 8.0);
  float axis = floor(face * 0.5);
  float sgn = 1.0 - 2.0 * mod(face, 2.0);
  vec3 n = vec3(equal(vec3(axis), vec3(0.0, 1.0, 2.0))) * sgn; // zero for face 6 (no normal)

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
#ifdef HAND
  vec3 rel = vec3(0.0);
#else
  // World-space offset from the camera (precise: modelViewMatrix is built in doubles on the CPU)
  vec3 rel = mv.xyz * mat3(viewMatrix);
  // World position wrapped every 1024 blocks, for animation patterns
  vec3 wpat = uCamWrap + rel;
#ifdef WAVING
  float wave = mod(floor(flags / 8.0), 4.0);
  if (wave > 0.5) {
    float t = uTime;
    vec3 d = vec3(0.0);
    if (wave < 1.5) {
      // plants: only the top vertices sway, with slow gusts
      float top = step(31.5, flags);
      float gust = 0.6 + 0.4 * sin(t * 0.63 + wpat.x * 0.071 + wpat.z * 0.053);
      d.x = (sin(t * 1.93 + wpat.x * 0.73 + wpat.z * 0.41) + 0.4 * sin(t * 3.71 + wpat.z * 1.37)) * 0.07 * gust * top;
      d.z = (sin(t * 1.61 + wpat.z * 0.67 - wpat.x * 0.29) + 0.4 * sin(t * 3.13 + wpat.x * 1.19)) * 0.055 * gust * top;
    } else if (wave < 2.5) {
      // leaves: small wobble; neighbours share corners so the canopy never cracks
      d.x = sin(t * 1.7 + wpat.x * 0.9 + wpat.y * 0.6 + wpat.z * 0.3) * 0.026;
      d.y = sin(t * 2.3 + wpat.z * 0.8 + wpat.x * 0.4 + wpat.y * 0.5) * 0.016;
      d.z = sin(t * 1.9 + wpat.y * 0.7 + wpat.z * 0.9 - wpat.x * 0.3) * 0.026;
    } else {
      // liquid surface: gentle swell, only ever downwards so it stays below the side faces
      float s = sin(t * 1.4 + wpat.x * 0.55 + wpat.z * 0.31) + sin(t * 1.9 - wpat.z * 0.47 + wpat.x * 0.23);
      d.y = -(0.5 + 0.25 * s) * 0.05;
    }
    rel += d;
    wpat += d;
    mv.xyz += mat3(viewMatrix) * d;
  }
#endif
#if defined(CLIP_PLANE) || defined(PLANAR)
  vWorldY = wpat.y;
#endif
#endif
  gl_Position = projectionMatrix * mv;
  vUv = auv / uAtlasSize;

#ifndef DEPTH
#ifdef HAND
  vec2 lv = uHandLight;
#else
  vec2 lv = alight.xy;
#endif
  float shade = alight.z;
  float sb = lightCurve(lv.x);
  float bb = lightCurve(lv.y);
#ifdef FANCY
  // torches reach a little further and burn a little warmer
  bb = min(bb * 1.22, 1.2);
  vec3 blkL = vec3(bb * 1.04, bb * ((bb * 0.55 + 0.4) * 0.58 + 0.36), bb * (bb * bb * 0.5 + 0.28)) * uBlockLightColor;
#else
  vec3 blkL = vec3(bb, bb * ((bb * 0.6 + 0.4) * 0.6 + 0.4), bb * (bb * bb * 0.6 + 0.4)) * uBlockLightColor;
#endif
  vec3 skyL = sb * uSkyLightColor;
  float masked = step(0.5, atint.a);
#ifdef LAYER_OPAQUE
  vTint = mix(vec3(1.0), atint.rgb, masked);          // masked tint: applied per texel in the FS
  vec3 faceTint = mix(atint.rgb, vec3(1.0), masked);
#else
  vec3 faceTint = atint.rgb;
#endif
#if defined(LAYER_WATER)
  faceTint = vec3(1.0);
  vTintW = atint.rgb;
  vSkyVis = lv.x * lv.x;
#endif
#if defined(LAYER_LAVA) || defined(FULLBRIGHT)
  vColor = faceTint * mix(1.0, shade, 0.25);
#elif defined(USE_SHADOWS)
  vSkyB = sb;
  vBlock = blkL;
  vColor = faceTint * shade;
#else
  vColor = finishLight(skyL + blkL) * shade * faceTint;
#endif

#ifdef HAND
  vFog = vec4(0.0);
#else
  float dist = max(length(rel.xz), abs(rel.y));
  float fog = clamp((dist - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  vFog = vec4(fog > 0.0 ? skyColor(rel / max(length(rel), 0.0001)) : uFogColor, fog);
#endif

#ifdef USE_SHADOWS
  float noNormal = step(5.5, face);
  float ndl = mix(dot(n, uLightDir), 1.0, noNormal);
  vec3 off = mix(n, uLightDir, noNormal);
  // normal offset: about one shadow texel, more at grazing light (no acne, no peter-panning
  // on blocks: receivers move out of their own surface, casters stay where they are)
  float graze = 1.0 - clamp(abs(ndl), 0.0, 1.0);
  vShadow.xyz = (uShadowMatrix * vec4(rel + off * uShadowNormalOffset * (0.7 + 1.3 * graze), 1.0)).xyz;
  // faces turned away from the light are in their own shadow (smoothly, to hide acne at grazing angles)
  vShadow.w = clamp(ndl * 4.0 + 0.25, 0.0, 1.0);
  vShadowFade = smoothstep(uShadowFade.x, uShadowFade.y, length(rel.xz));
#endif

#if (defined(LAYER_WATER) || defined(LAYER_LAVA)) && !defined(HAND)
  vec3 an = abs(n);
  vFace = an.y > 0.5 ? wpat.xz : (an.x > 0.5 ? wpat.zy : wpat.xy);
  vRel = rel;
  vNormal = n;
#endif
#endif
}
`;

const SHADOW_FS_GLSL = `
#ifdef USE_SHADOWS
uniform sampler2D uShadowMap;
uniform HP float uShadowTexel;
uniform HP float uShadowBias;
uniform vec3 uAmbientLight;
uniform vec3 uDirectLight;
varying HP vec4 vShadow;
varying float vShadowFade;
varying float vSkyB;
varying vec3 vBlock;
HP float unpackDepth(HP vec4 v) {
  return dot(v, vec4(255.0 / 256.0 / 16777216.0, 255.0 / 256.0 / 65536.0, 255.0 / 256.0 / 256.0, 255.0 / 256.0));
}
float shadowTap(HP vec2 uv, HP float z) { return step(z, unpackDepth(texture2D(uShadowMap, uv))); }
float shadowRow(HP vec2 uv, HP float z, HP float t, vec2 w) {
  return shadowTap(uv - vec2(t, 0.0), z) * w.x + shadowTap(uv, z) + shadowTap(uv + vec2(t, 0.0), z)
       + shadowTap(uv + vec2(2.0 * t, 0.0), z) * w.y;
}
// 3x3 texel box filter, bilinearly weighted: 16 taps, soft edges about 3 texels wide
float shadowLit() {
  HP vec3 sp = vShadow.xyz;
  if (sp.x <= 0.0 || sp.x >= 1.0 || sp.y <= 0.0 || sp.y >= 1.0 || sp.z >= 1.0) return 1.0;
  HP float t = uShadowTexel;
  HP float z = sp.z - uShadowBias;
  HP vec2 tc = sp.xy / t - 0.5;
  HP vec2 f = fract(tc);
  HP vec2 b = (floor(tc) + 0.5) * t;
  vec2 wx = vec2(1.0 - f.x, f.x);
  float s = shadowRow(b - vec2(0.0, t), z, t, wx) * (1.0 - f.y)
          + shadowRow(b, z, t, wx)
          + shadowRow(b + vec2(0.0, t), z, t, wx)
          + shadowRow(b + vec2(0.0, 2.0 * t), z, t, wx) * f.y;
  return s * (1.0 / 9.0);
}
// how much direct sun (or moon) light reaches this fragment, 0..1
float sunLit() {
  if (vShadow.w <= 0.0) return 0.0;
  if (vShadowFade >= 0.999) return vShadow.w;
  return mix(shadowLit(), 1.0, vShadowFade) * vShadow.w;
}
// cool sky ambient everywhere, warm direct light where the sun reaches; block light untouched
vec3 shadowedLight(float lit) {
  vec3 amb = vSkyB * uAmbientLight + vBlock;
  return mix(finishLight(amb), finishLight(amb + vSkyB * uDirectLight), lit);
}
#endif
`;

// Fragment stage: mediump by default. Uniforms that the vertex stage also declares are
// explicitly HP, because WebGL requires matching precision for uniforms shared by both stages.
const FS_COMMON = `
precision mediump float;
uniform sampler2D uAtlas;
uniform HP float uBrightness;
varying HP vec2 vUv;
varying vec3 vColor;
varying vec4 vFog;
${LIGHT_FN_GLSL}
${SHADOW_FS_GLSL}
#if defined(CLIP_PLANE) || defined(PLANAR)
varying HP float vWorldY;
#endif
#ifdef CLIP_PLANE
uniform HP float uClipY;
#endif
`;

const TERRAIN_FS = `
${FS_COMMON}
#ifdef LAYER_OPAQUE
varying vec3 vTint;
#endif
#ifdef ULTRA
uniform sampler2D uEmissive;
uniform float uEmissiveBoost;
#endif
void main() {
#ifdef CLIP_PLANE
  if (vWorldY < uClipY) discard;
#endif
  vec4 tex = texture2D(uAtlas, vUv);
#if defined(LAYER_CUTOUT)
  if (tex.a < 0.5) discard;
#endif
  vec3 c = tex.rgb;
#ifdef LAYER_OPAQUE
  c *= mix(vTint, vec3(1.0), tex.a);
#endif
#if defined(USE_SHADOWS) && !defined(FULLBRIGHT)
  c *= vColor * shadowedLight(sunLit());
#else
  c *= vColor;
#endif
#if defined(ULTRA) && !defined(LAYER_TRANSLUCENT)
  // light sources: their bright texels glow (HDR, picked up by the bloom pass)
  float em = texture2D(uEmissive, vUv).r;
  float lum = dot(tex.rgb, vec3(0.3, 0.59, 0.11));
  c = mix(c, tex.rgb * uEmissiveBoost, em * smoothstep(0.4, 0.8, lum));
#endif
#ifdef LAYER_TRANSLUCENT
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), tex.a);
#else
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), 1.0);
#endif
}
`;

const WATER_FS = `
${FS_COMMON}
uniform HP float uAtlasSize;
uniform HP float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform HP vec3 uFogColor;
uniform vec2 uWaterTile;
uniform float uUnderwater;
${SKY_UNIFORMS_GLSL}
#ifdef FANCY
uniform HP vec3 uLightDir;
#endif
#ifdef PLANAR
uniform sampler2D uReflection;
uniform HP vec2 uScreenInv;
uniform HP float uPlanarY;
uniform float uPlanarOn;
#endif
#ifdef ULTRA
uniform float uGlintBoost;
#endif
varying HP vec2 vFace;
varying HP vec3 vRel;
varying vec3 vNormal;
varying vec3 vTintW;
varying float vSkyVis;
${SKY_FN_GLSL}
void main() {
  HP float t = uTime;
  float isTop = step(0.5, abs(vNormal.y));
  // one ripple value per texture pixel (16 per block)
  HP vec2 cell = floor(vFace * 16.0);
  cell.y += (1.0 - isTop) * floor(t * 12.0);   // falling pattern on the sides
  HP vec2 q = cell + 0.5;
  HP float a1 = dot(q, vec2(0.37, 0.21)) + t * 1.9;
  HP float a2 = dot(q, vec2(-0.17, 0.33)) + t * 1.4;
  HP float a3 = dot(q, vec2(0.29, -0.41)) - t * 2.3;
  HP float a4 = dot(q, vec2(0.61, 0.53)) + t * 3.1;
  float h = sin(a1) * 0.45 + sin(a2) * 0.35 + sin(a3) * 0.3 + sin(a4) * 0.12;
  vec2 g = cos(a1) * 0.45 * vec2(0.37, 0.21) + cos(a2) * 0.35 * vec2(-0.17, 0.33)
         + cos(a3) * 0.3 * vec2(0.29, -0.41) + cos(a4) * 0.12 * vec2(0.61, 0.53);
  HP float dist = length(vRel);
  float detail = 1.0 - smoothstep(20.0, 72.0, dist);   // calm far water: no sparkle aliasing
  g *= detail;

  // animated texture pixel (whole-pixel scrolling, like the classic animated water)
  HP vec2 tp = mod(cell + vec2(floor(t * 1.5), floor(t * 2.5)), 16.0);
  // (bias: the quantised uv has huge derivatives at pixel edges, keep the full-size level)
  float tx = mix(0.75, texture2D(uAtlas, (uWaterTile + tp + 0.5) / uAtlasSize, -16.0).r, detail);

  vec3 V = -vRel / max(dist, 0.0001);
  vec3 tang = vec3(abs(vNormal.z), 0.0, abs(vNormal.x));
  vec3 N;
#ifdef FANCY
  // smooth wind ripples: five directional waves in world space, calmer in the distance
  HP vec2 p = vFace;
  HP float ph;
  vec2 gs = vec2(0.0);
  ph = dot(p, vec2(0.80, 0.60)) * 1.3 + t * 1.6;    gs += cos(ph) * 0.078 * vec2(0.80, 0.60);
  ph = dot(p, vec2(-0.45, 0.89)) * 2.1 + t * 2.1;   gs += cos(ph) * 0.074 * vec2(-0.45, 0.89);
  ph = dot(p, vec2(0.20, -0.98)) * 3.7 + t * 2.9;   gs += cos(ph) * 0.066 * vec2(0.20, -0.98);
  ph = dot(p, vec2(-0.93, -0.37)) * 5.3 + t * 3.7;  gs += cos(ph) * 0.053 * vec2(-0.93, -0.37);
  ph = dot(p, vec2(0.62, -0.78)) * 8.9 + t * 5.1;   gs += cos(ph) * 0.040 * vec2(0.62, -0.78);
  float far = smoothstep(16.0, 110.0, dist);
  gs = gs * mix(1.0, 0.3, far) + g * 0.35;
  if (isTop > 0.5) N = normalize(vec3(-gs.x, 1.0, -gs.y)) * sign(vNormal.y);
  else N = normalize(vNormal + tang * g.x * 0.6);
#else
  if (isTop > 0.5) {
    N = normalize(vec3(-g.x * 1.4, 1.0, -g.y * 1.4)) * sign(vNormal.y);
  } else {
    N = normalize(vNormal + tang * g.x * 0.6);
  }
#endif
  if (!gl_FrontFacing) N = -N;
  float cosT = clamp(dot(N, V), 0.0, 1.0);
  float ic = 1.0 - cosT;
  float ic2 = ic * ic;
  float fres = 0.02 + 0.98 * ic2 * ic2 * ic;

#ifdef USE_SHADOWS
  float lit = sunLit();
  vec3 light = vColor * shadowedLight(lit);
#else
  float lit = 1.0;
  vec3 light = vColor;
#endif

  HP vec3 R = reflect(-V, N);
#ifdef FANCY
  // ---- reflective water: sky (or the planar reflection), fresnel, a bright glint path
  vec3 refl = skyColor(normalize(vec3(R.x, abs(R.y) + 0.015, R.z))) * mix(0.25, 1.0, vSkyVis);
#ifdef PLANAR
  float pw = uPlanarOn * isTop * step(0.0, vNormal.y) * (1.0 - smoothstep(0.1, 0.4, abs(vWorldY - uPlanarY)));
  if (pw > 0.001 && gl_FrontFacing) {
    HP vec2 suv = gl_FragCoord.xy * uScreenInv;
    vec2 dn = (viewMatrix * vec4(N.x, 0.0, N.z, 0.0)).xy;
    suv += dn * (0.045 / (1.0 + dist * 0.04));
    suv.y = 1.0 - suv.y;             // the mirror camera image is upside down
    vec3 pr = texture2D(uReflection, clamp(suv, vec2(0.002), vec2(0.998))).rgb;
    refl = mix(refl, pr, pw);
  }
#endif
  float shallow = 1.0 - exp(-1.7 / max(cosT, 0.05));
  float a0 = mix(0.5, 0.88, shallow);
  vec3 body = vTintW * light * (0.36 + 0.3 * tx + 0.05 * h * detail);
  float fr = mix(fres, 1.0, 0.04);
  HP float sd = max(dot(R, uLightDir), 0.0);
  float sp = pow(sd, 1600.0) * 6.0 + pow(sd, 180.0) * 1.1 + pow(sd, 20.0) * 0.07;
  vec3 spec = uSunColor * sp * vSkyVis * lit;
#ifdef ULTRA
  spec *= uGlintBoost;
#endif
  vec3 prem = refl * fr + body * a0 * (1.0 - fr) + spec;
  float alpha = clamp(fr + a0 * (1.0 - fr) + dot(spec, vec3(0.333)), 0.0, 1.0);
  vec3 col = prem / max(alpha, 0.001);
#else
  // ---- simple water (Off pack)
  vec3 refl = skyColor(normalize(vec3(R.x, abs(R.y) + 0.02, R.z))) * vSkyVis;
  vec3 body = vTintW * light * (0.5 + 0.55 * tx + 0.07 * h * detail);
  // deeper-looking water at grazing angles (longer path through the water)
  float absorb = 1.0 - exp(-2.2 / max(cosT, 0.06));
  float alpha = mix(0.48, 0.9, absorb);
  vec3 col = mix(body, refl, fres * 0.8);
  alpha = max(alpha, fres * 0.95);

  // sun glints: tight pixel sparkles plus a soft sheen, suppressed in shade and caves
  float sd = max(dot(R, uSunDir), 0.0);
  float sd2 = sd * sd; float sd4 = sd2 * sd2; float sd8 = sd4 * sd4; float sd16 = sd8 * sd8;
  float sd64 = sd16 * sd16; sd64 *= sd64;
  float spark = sd64 * sd64 * sd16 * (0.6 + 0.4 * h) * detail;   // ~ pow(sd, 144)
  vec3 spec = uSunColor * (spark * 2.5 + sd16 * 0.12) * vSkyVis * lit;
  col += spec;
  alpha = min(1.0, alpha + dot(spec, vec3(0.333)));
#endif

  if (!gl_FrontFacing && uUnderwater > 0.5) {
    // looking up from below: Snell's window to the sky, total internal reflection outside it
    float win = smoothstep(0.6, 0.76, cosT) * vSkyVis;
    col = mix(uFogColor * 1.15, mix(uSkyTop, uSkyHorizon, 0.4) * 0.9 + body * 0.25, win);
    alpha = mix(0.92, 0.55, win);
  }
  col = mix(col, vFog.rgb, vFog.a);
  alpha = mix(alpha, 1.0, vFog.a);
  gl_FragColor = vec4(col, alpha);
}
`;

const LAVA_FS = `
${FS_COMMON}
uniform HP float uAtlasSize;
uniform HP float uTime;
uniform vec2 uLavaTile;
varying HP vec2 vFace;
varying HP vec3 vRel;
varying vec3 vNormal;
void main() {
#ifdef CLIP_PLANE
  if (vWorldY < uClipY) discard;
#endif
  HP float t = uTime;
  float side = 1.0 - step(0.5, abs(vNormal.y));
  HP vec2 cell = floor(vFace * 16.0);
  cell.y += side * floor(t * 4.0);              // flowing lava creeps down the sides
  HP vec2 w = cell * 0.19;
  float n1 = sin(w.x + t * 0.55 + 1.7 * sin(w.y * 0.83 + t * 0.31));
  float n2 = sin(w.y * 1.13 - t * 0.47 + 1.9 * sin(w.x * 0.71 - t * 0.37));
  float heat = 0.5 + 0.25 * (n1 + n2);
  // churn: texture pixels displaced by whole pixels along a slowly turning field
  HP vec2 tp = mod(cell + floor(vec2(n2, n1) * 1.6 + 0.5) + vec2(floor(t * 0.7), floor(t * 0.45)), 16.0);
  vec3 tex = texture2D(uAtlas, (uLavaTile + tp + 0.5) / uAtlasSize, -16.0).rgb;
  float h2 = heat * heat; float h4 = h2 * h2;
  vec3 c = tex * (0.78 + 0.5 * heat) + vec3(0.42, 0.16, 0.0) * h4 * h2;
  // far away: the plain (mipmapped) tile, so distant lava lakes do not shimmer
  float far = smoothstep(28.0, 72.0, length(vRel));
  c = mix(c, texture2D(uAtlas, vUv).rgb * 1.05, far);
  c *= vColor;
#ifdef ULTRA
  c *= 1.15 + 1.6 * h4;                          // HDR: the hot crust glows through the bloom
#endif
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), 1.0);
}
`;

const DEPTH_FS = `
uniform sampler2D uAtlas;
varying HP vec2 vUv;
${PACK_GLSL}
void main() {
#ifdef LAYER_CUTOUT
  if (texture2D(uAtlas, vUv).a < 0.5) discard;
#endif
  gl_FragColor = packDepth(gl_FragCoord.z);
}
`;

// ---------------------------------------------------------------------------------- factory

/**
 * 32x32 mask, one texel per atlas tile: how strongly that tile emits light. A tile counts only
 * when every block using it is a light source (the pumpkin sides of a jack o'lantern do not glow).
 */
export function buildEmissiveMask(): DataTexture {
  const strength = new Float32Array(MAX_TILES);
  const plain = new Uint8Array(MAX_TILES);
  for (let id = 1; id < COUNT; id++) {
    for (let f = 0; f < 6; f++) {
      const t = FACE_TEX[id * 6 + f];
      if (t >= MAX_TILES) continue;
      if (EMIT[id] > 0) strength[t] = Math.max(strength[t], Math.min(1, EMIT[id] / 15 + 0.1));
      else plain[t] = 1;
    }
  }
  const data = new Uint8Array(ATLAS_COLS * ATLAS_COLS * 4);
  for (let t = 0; t < MAX_TILES; t++) {
    const v = plain[t] ? 0 : Math.round(strength[t] * 255);
    data[t * 4] = v; data[t * 4 + 1] = v; data[t * 4 + 2] = v; data[t * 4 + 3] = 255;
  }
  const tex = new DataTexture(data, ATLAS_COLS, ATLAS_COLS, RGBAFormat, UnsignedByteType);
  tex.name = 'emissive-mask';
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.flipY = false;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export function createSharedUniforms(atlas: Atlas): SharedUniforms {
  const [wx, wy] = tileOrigin(EXTRA_TEX.water_still);
  const [lx, ly] = tileOrigin(EXTRA_TEX.lava_still);
  return {
    uTime: { value: 0 },
    uAtlas: { value: atlas.texture },
    uAtlasSize: { value: ATLAS_SIZE },
    uSunDir: { value: new Vector3(0, 1, 0) },
    uLightDir: { value: new Vector3(0, 1, 0) },     // shadow-casting light: sun by day, moon by night
    uDaylight: { value: 1 },
    uFogColor: { value: new Color(0.75, 0.85, 1) },
    uFogNear: { value: 40 },
    uFogFar: { value: 64 },
    uSkyTop: { value: new Color(0.47, 0.65, 1) },
    uSkyHorizon: { value: new Color(0.75, 0.85, 1) },
    uGlowColor: { value: new Color(1, 0.5, 0.2) },
    uGlowDir: { value: new Vector3(1, 0, 0) },
    uGlow: { value: 0 },
    uBrightness: { value: 0.5 },
    uBlockLightColor: { value: new Color(1, 1, 1) },
    uSkyLightColor: { value: new Color(1, 1, 1) },
    uAmbientLight: { value: new Color(0.4, 0.42, 0.47) },  // Fancy/Ultra: shadowed part of the sky light
    uDirectLight: { value: new Color(0.6, 0.58, 0.53) },   // Fancy/Ultra: direct sun/moon light
    uSunColor: { value: new Color(1, 0.95, 0.8) },
    uWaving: { value: 0 },
    uUnderwater: { value: 0 },
    uCamWrap: { value: new Vector3() },
    uShadowMap: { value: null as Texture | null },
    uShadowMatrix: { value: new Matrix4() },
    uShadowTexel: { value: 1 / 2048 },
    uShadowStrength: { value: 0 },
    uShadowBias: { value: 0.0002 },
    uShadowNormalOffset: { value: 0.1 },
    uShadowFade: { value: new Vector2(48, 60) },
    uWaterTile: { value: new Vector2(wx, wy) },
    uLavaTile: { value: new Vector2(lx, ly) },
    uEmissive: { value: null as Texture | null },
    uEmissiveBoost: { value: 2.6 },
    uGlintBoost: { value: 3.5 },
    uClipY: { value: WATER_PLANE_Y },
    uReflection: { value: null as Texture | null },
    uScreenInv: { value: new Vector2(1 / 1280, 1 / 720) },
    uPlanarY: { value: WATER_PLANE_Y },
    uPlanarOn: { value: 0 },
  };
}

type LayerDefine = 'LAYER_OPAQUE' | 'LAYER_CUTOUT' | 'LAYER_TRANSLUCENT' | 'LAYER_WATER' | 'LAYER_LAVA';

function terrainMaterial(name: string, layer: LayerDefine, fs: string, uniforms: SharedUniforms, extra: Record<string, number | string> = {}): ShaderMaterial {
  const m = new ShaderMaterial({
    name,
    uniforms,
    vertexShader: HP_VS + TERRAIN_VS,
    fragmentShader: HP_FS + fs,
    defines: { [layer]: 1, ...extra },
  });
  m.side = FrontSide;
  m.fog = false;
  m.lights = false;
  return m;
}

function setDefine(m: ShaderMaterial, key: string, on: boolean): void {
  const has = key in m.defines;
  if (on === has) return;
  if (on) m.defines[key] = 1; else delete m.defines[key];
  m.needsUpdate = true;
}

export function createMaterials(atlas: Atlas): Materials {
  const uniforms = createSharedUniforms(atlas);
  const emissive = buildEmissiveMask();
  uniforms.uEmissive.value = emissive;
  const opaque = terrainMaterial('terrain-opaque', 'LAYER_OPAQUE', TERRAIN_FS, uniforms);
  const cutout = terrainMaterial('terrain-cutout', 'LAYER_CUTOUT', TERRAIN_FS, uniforms);
  const translucent = terrainMaterial('terrain-translucent', 'LAYER_TRANSLUCENT', TERRAIN_FS, uniforms);
  translucent.transparent = true;
  translucent.depthWrite = false;
  translucent.blending = NormalBlending;
  const water = terrainMaterial('terrain-water', 'LAYER_WATER', WATER_FS, uniforms);
  water.transparent = true;
  water.depthWrite = true;
  water.side = DoubleSide;
  water.blending = NormalBlending;
  const lava = terrainMaterial('terrain-lava', 'LAYER_LAVA', LAVA_FS, uniforms);

  const depthOpaque = terrainMaterial('depth-opaque', 'LAYER_OPAQUE', DEPTH_FS, uniforms, { DEPTH: 1 });
  const depthCutout = terrainMaterial('depth-cutout', 'LAYER_CUTOUT', DEPTH_FS, uniforms, { DEPTH: 1 });
  // Render both sides into the shadow map: thin plants and leaves cast from either side and
  // back faces reduce acne on the lit side.
  depthOpaque.side = DoubleSide;
  depthCutout.side = DoubleSide;

  // Planar reflection pass: the same shading, fragments under the water plane discarded.
  const reflOpaque = terrainMaterial('refl-opaque', 'LAYER_OPAQUE', TERRAIN_FS, uniforms, { CLIP_PLANE: 1 });
  const reflCutout = terrainMaterial('refl-cutout', 'LAYER_CUTOUT', TERRAIN_FS, uniforms, { CLIP_PLANE: 1 });
  const reflLava = terrainMaterial('refl-lava', 'LAYER_LAVA', LAVA_FS, uniforms, { CLIP_PLANE: 1 });

  const world = [opaque, cutout, translucent, water, lava];
  const refl = [reflOpaque, reflCutout, reflLava];
  const all = [...world, depthOpaque, depthCutout, ...refl];
  const lit = [opaque, cutout, translucent, water, reflOpaque, reflCutout];   // receive shadows
  const flags: PackFlags = { shadows: false, waving: false, fancy: false, ultra: false, planar: false };
  const apply = () => {
    for (const m of lit) setDefine(m, 'USE_SHADOWS', flags.shadows);
    for (const m of all) setDefine(m, 'WAVING', flags.waving);
    for (const m of [...world, ...refl]) {
      setDefine(m, 'FANCY', flags.fancy);
      setDefine(m, 'ULTRA', flags.ultra);
    }
    setDefine(water, 'PLANAR', flags.planar);
    uniforms.uWaving.value = flags.waving ? 1 : 0;
    uniforms.uPlanarOn.value = flags.planar ? 1 : 0;
    if (!flags.shadows) uniforms.uShadowStrength.value = 0;
  };
  return {
    opaque, cutout, translucent, water, lava, uniforms,
    byLayer: [opaque, cutout, translucent, water, lava],
    depth: { opaque: depthOpaque, cutout: depthCutout },
    refl: { opaque: reflOpaque, cutout: reflCutout, lava: reflLava },
    setShadows(on: boolean) { flags.shadows = on; apply(); },
    setWaving(on: boolean) { flags.waving = on; apply(); },
    setPack(f: PackFlags) { Object.assign(flags, f); apply(); },
    releaseReflection() { for (const m of refl) m.dispose(); },
    dispose() { for (const m of all) m.dispose(); emissive.dispose(); },
  };
}

/**
 * Materials for the first-person held block: same shading as the world, but the light
 * comes from `uHandLight` (sky, block in 0..1) instead of the vertices and there is no fog.
 * Index = render layer; water uses the translucent path and lava is fullbright.
 */
export function createHandMaterials(shared: SharedUniforms): { byLayer: ShaderMaterial[]; light: IUniform; dispose(): void } {
  const light: IUniform = { value: new Vector2(1, 0) };
  const uniforms: SharedUniforms = { ...shared, uHandLight: light };
  const mk = (name: string, layer: LayerDefine, extra: Record<string, number> = {}) => {
    const m = terrainMaterial(name, layer, TERRAIN_FS, uniforms, { HAND: 1, ...extra });
    return m;
  };
  const opaque = mk('hand-opaque', 'LAYER_OPAQUE');
  const cutout = mk('hand-cutout', 'LAYER_CUTOUT');
  cutout.side = DoubleSide;
  const translucent = mk('hand-translucent', 'LAYER_TRANSLUCENT');
  translucent.transparent = true;
  translucent.depthWrite = false;
  const water = mk('hand-water', 'LAYER_TRANSLUCENT');
  water.transparent = true;
  water.depthWrite = false;
  const lava = mk('hand-lava', 'LAYER_CUTOUT', { FULLBRIGHT: 1 });
  const byLayer = [opaque, cutout, translucent, water, lava];
  return { byLayer, light, dispose() { for (const m of byLayer) m.dispose(); } };
}

/** Section-local bounding sphere (vertex units, 1/256 block): the whole 16^3 section. */
export const SECTION_SPHERE = new Sphere(new Vector3(2048, 2048, 2048), 3547);

/** BufferGeometry for one mesher layer in the terrain vertex format (see MeshLayer in types.ts). */
export function createLayerGeometry(l: MeshLayer, sphere: Sphere | null = SECTION_SPHERE): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(l.positions, 3));
  g.setAttribute('auv', new BufferAttribute(l.uvs, 2));
  g.setAttribute('atint', new BufferAttribute(l.tints, 4, true));
  g.setAttribute('alight', new BufferAttribute(l.lights, 4, true));
  g.setIndex(new BufferAttribute(l.indices, 1));
  g.setDrawRange(0, l.indexCount);
  if (sphere) g.boundingSphere = sphere.clone();
  else g.computeBoundingSphere();
  return g;
}
