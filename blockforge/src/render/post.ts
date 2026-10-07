// Ultra shader pack post-processing: the scene renders into an off-screen target (HDR when the
// GPU can render to half floats), then full-screen passes add bloom, god rays and height fog
// and roll off the highlights. GLSL ES 1.00 through ShaderMaterial (three converts for WebGL2).
// WebGL1 without WEBGL_depth_texture skips the depth-based passes (rays use brightness instead).
import {
  WebGLRenderer, WebGLRenderTarget, DepthTexture, UnsignedIntType, UnsignedShortType, HalfFloatType, UnsignedByteType,
  LinearFilter, NearestFilter, RGBAFormat, ClampToEdgeWrapping, ShaderMaterial, Mesh, BufferGeometry, BufferAttribute,
  OrthographicCamera, Scene, Vector2, Vector3, Matrix4, Color, NoBlending,
} from 'three';
import type { PerspectiveCamera, Texture } from 'three';

const VERT = `
varying vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// Bright pass: keep what glows (HDR above ~0.85), with a soft knee, at half resolution.
const BRIGHT = `
uniform sampler2D tColor;
uniform vec2 uTexel;
uniform float uThreshold;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tColor, vUv + vec2(-uTexel.x, -uTexel.y)).rgb + texture2D(tColor, vUv + vec2(uTexel.x, -uTexel.y)).rgb
         + texture2D(tColor, vUv + vec2(-uTexel.x, uTexel.y)).rgb + texture2D(tColor, vUv + vec2(uTexel.x, uTexel.y)).rgb;
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  float k = clamp((l - uThreshold) / max(l, 0.0001), 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  gl_FragColor = vec4(c * k, 1.0);
}
`;

// Separable 9-tap gaussian.
const BLUR = `
uniform sampler2D tColor;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tColor, vUv).rgb * 0.2270270270;
  c += texture2D(tColor, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tColor, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tColor, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture2D(tColor, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}
`;

// God rays: radial blur of the sky around the sun (or moon), terrain blocks it.
const RAYS = `
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uLight;
uniform float uUseDepth;
uniform float uAspect;
varying vec2 vUv;
float sky(vec2 uv) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  float open;
  if (uUseDepth > 0.5) open = step(0.99995, texture2D(tDepth, uv).r);
  else { vec3 c = texture2D(tColor, uv).rgb; open = smoothstep(0.75, 1.0, max(c.r, max(c.g, c.b))); }
  vec2 d = (uv - uLight) * vec2(uAspect, 1.0);
  return open * exp(-dot(d, d) * 9.0);
}
void main() {
  vec2 delta = (vUv - uLight) / 28.0;
  vec2 uv = vUv;
  float sum = 0.0, w = 1.0;
  for (int i = 0; i < 28; i++) {
    sum += sky(uv) * w;
    w *= 0.955;
    uv -= delta;
  }
  gl_FragColor = vec4(vec3(sum / 12.0), 1.0);
}
`;

// Final composite: scene + height fog + bloom + rays, highlight roll-off, grading, vignette.
const COMPOSITE = `
uniform sampler2D tColor;
uniform sampler2D tBloom;
uniform sampler2D tBloom2;
uniform sampler2D tRays;
uniform sampler2D tDepth;
uniform float uUseDepth;
uniform float uBloom;
uniform vec3 uRayColor;
uniform float uRayStrength;
uniform vec3 uFogColor;
uniform vec3 uSunColor;
uniform vec3 uLightDir;
uniform float uFogDensity;
uniform float uFogFar;
uniform vec3 uCamPos;
uniform mat4 uInvProj;
uniform mat4 uInvView;
uniform float uUnderwater;
varying vec2 vUv;
vec3 rolloff(vec3 c) {
  // linear up to 0.8, then a soft shoulder towards 1 (HDR glow from torches, lava, the sun)
  vec3 x = max(c - 0.8, 0.0);
  return min(c, vec3(0.8)) + 0.2 * (1.0 - exp(-x * 2.2));
}
void main() {
  vec3 col = texture2D(tColor, vUv).rgb;
  if (uUseDepth > 0.5 && uUnderwater < 0.5) {
    float d = texture2D(tDepth, vUv).r;
    if (d < 0.99995) {
      vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
      vp /= vp.w;
      vec3 wp = (uInvView * vec4(vp.xyz, 1.0)).xyz;
      vec3 ray = wp - uCamPos;
      float dist = length(ray);
      vec3 dir = ray / max(dist, 0.0001);
      // thicker in valleys and near water level, thinner on mountain tops
      float h = clamp(exp(-(wp.y - 58.0) * 0.045), 0.25, 2.5);
      float f = (1.0 - exp(-dist * uFogDensity * h)) * (1.0 - smoothstep(uFogFar * 0.85, uFogFar, dist) * 0.6);
      float sunward = pow(max(dot(dir, uLightDir), 0.0), 6.0);
      vec3 fogc = mix(uFogColor, uSunColor * 1.15, sunward * 0.55);
      col = mix(col, fogc, clamp(f, 0.0, 0.85));
    }
  }
  vec3 bloom = texture2D(tBloom, vUv).rgb * 0.6 + texture2D(tBloom2, vUv).rgb * 0.9;
  col += bloom * uBloom;
  col += texture2D(tRays, vUv).r * uRayColor * uRayStrength;
  col = rolloff(col);
  // a touch more saturation and contrast
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 1.1);
  col = (col - 0.5) * 1.04 + 0.5;
  vec2 q = vUv - 0.5;
  col *= 1.0 - dot(q, q) * 0.35;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const COPY = `
uniform sampler2D tColor;
varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(tColor, vUv).rgb, 1.0); }
`;

function rt(w: number, h: number, type: typeof UnsignedByteType | typeof HalfFloatType, linear = true): WebGLRenderTarget {
  return new WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
    format: RGBAFormat, type, minFilter: linear ? LinearFilter : NearestFilter, magFilter: linear ? LinearFilter : NearestFilter,
    wrapS: ClampToEdgeWrapping, wrapT: ClampToEdgeWrapping, depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
  });
}

function pass(frag: string, uniforms: Record<string, { value: unknown }>): ShaderMaterial {
  return new ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, blending: NoBlending });
}

export interface PostFrame {
  camera: PerspectiveCamera;
  lightDir: Vector3;       // towards the sun (day) or moon (night)
  lightStrength: number;   // 0..1: how strong the god rays may be (sun high and visible)
  rayColor: Color;
  fogColor: Color;
  sunColor: Color;
  fogFar: number;
  dawnDusk: number;        // 0..1, thicker fog around sunrise and sunset
  underwater: boolean;
}

export class PostFX {
  readonly hdr: boolean;
  readonly depth: boolean;
  private gl: WebGLRenderer;
  private scene: WebGLRenderTarget;
  private half: WebGLRenderTarget;
  private halfB: WebGLRenderTarget;
  private quarter: WebGLRenderTarget;
  private quarterB: WebGLRenderTarget;
  private rays: WebGLRenderTarget;
  private quad: Mesh;
  private fsScene = new Scene();
  private fsCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private mBright: ShaderMaterial;
  private mBlur: ShaderMaterial;
  private mRays: ShaderMaterial;
  private mComp: ShaderMaterial;
  private mCopy: ShaderMaterial;
  private w = 1;
  private h = 1;
  private tmp = new Vector3();
  private invProj = new Matrix4();
  private invView = new Matrix4();

  constructor(gl: WebGLRenderer) {
    this.gl = gl;
    const ext = gl.extensions;
    this.hdr = gl.capabilities.isWebGL2 ? ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float')
      : ext.has('OES_texture_half_float') && ext.has('EXT_color_buffer_half_float');
    this.depth = gl.capabilities.isWebGL2 || ext.has('WEBGL_depth_texture');
    const type = this.hdr ? HalfFloatType : UnsignedByteType;
    this.scene = new WebGLRenderTarget(1, 1, {
      format: RGBAFormat, type, minFilter: LinearFilter, magFilter: LinearFilter, wrapS: ClampToEdgeWrapping, wrapT: ClampToEdgeWrapping,
      depthBuffer: true, stencilBuffer: false, generateMipmaps: false,
    });
    if (this.depth) {
      const dt = new DepthTexture(1, 1);
      dt.type = gl.capabilities.isWebGL2 ? UnsignedIntType : UnsignedShortType;
      dt.minFilter = NearestFilter; dt.magFilter = NearestFilter;
      this.scene.depthTexture = dt;
    }
    this.half = rt(1, 1, type); this.halfB = rt(1, 1, type);
    this.quarter = rt(1, 1, type); this.quarterB = rt(1, 1, type);
    this.rays = rt(1, 1, UnsignedByteType);

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.mBright = pass(BRIGHT, { tColor: { value: null }, uTexel: { value: new Vector2() }, uThreshold: { value: this.hdr ? 0.85 : 0.78 } });
    this.mBlur = pass(BLUR, { tColor: { value: null }, uDir: { value: new Vector2() } });
    this.mRays = pass(RAYS, { tColor: { value: null }, tDepth: { value: null }, uLight: { value: new Vector2() }, uUseDepth: { value: this.depth ? 1 : 0 }, uAspect: { value: 1 } });
    this.mComp = pass(COMPOSITE, {
      tColor: { value: null }, tBloom: { value: null }, tBloom2: { value: null }, tRays: { value: null }, tDepth: { value: null },
      uUseDepth: { value: this.depth ? 1 : 0 }, uBloom: { value: 0.9 }, uRayColor: { value: new Color() }, uRayStrength: { value: 0 },
      uFogColor: { value: new Color() }, uSunColor: { value: new Color() }, uLightDir: { value: new Vector3(0, 1, 0) },
      uFogDensity: { value: 0.004 }, uFogFar: { value: 64 }, uCamPos: { value: new Vector3() },
      uInvProj: { value: new Matrix4() }, uInvView: { value: new Matrix4() }, uUnderwater: { value: 0 },
    });
    this.mCopy = pass(COPY, { tColor: { value: null } });
    this.quad = new Mesh(geo, this.mCopy);
    this.quad.frustumCulled = false;
    this.fsScene.add(this.quad);
  }

  /** Match the drawing buffer size (device pixels). */
  setSize(w: number, h: number): void {
    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h;
    this.scene.setSize(w, h);
    if (this.scene.depthTexture) { this.scene.depthTexture.image.width = w; this.scene.depthTexture.image.height = h; }
    const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1), qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2);
    this.half.setSize(hw, hh); this.halfB.setSize(hw, hh);
    this.quarter.setSize(qw, qh); this.quarterB.setSize(qw, qh);
    this.rays.setSize(qw, qh);
  }

  /** Where the 3D scene should be drawn this frame. */
  get target(): WebGLRenderTarget { return this.scene; }

  private draw(m: ShaderMaterial, out: WebGLRenderTarget | null): void {
    this.quad.material = m;
    this.gl.setRenderTarget(out);
    this.gl.render(this.fsScene, this.fsCam);
  }

  /** Run the passes and write the final image to the canvas. */
  finish(f: PostFrame): void {
    const sceneTex = this.scene.texture as Texture;
    const depthTex = (this.scene.depthTexture as Texture | null) ?? null;
    // bloom
    this.mBright.uniforms.tColor.value = sceneTex;
    (this.mBright.uniforms.uTexel.value as Vector2).set(0.5 / this.w, 0.5 / this.h);
    this.draw(this.mBright, this.half);
    const blur = (src: WebGLRenderTarget, tmp: WebGLRenderTarget, dst: WebGLRenderTarget, w: number, h: number) => {
      this.mBlur.uniforms.tColor.value = src.texture;
      (this.mBlur.uniforms.uDir.value as Vector2).set(1 / w, 0);
      this.draw(this.mBlur, tmp);
      this.mBlur.uniforms.tColor.value = tmp.texture;
      (this.mBlur.uniforms.uDir.value as Vector2).set(0, 1 / h);
      this.draw(this.mBlur, dst);
    };
    blur(this.half, this.halfB, this.half, this.half.width, this.half.height);
    this.mCopy.uniforms.tColor.value = this.half.texture;
    this.draw(this.mCopy, this.quarter);
    blur(this.quarter, this.quarterB, this.quarter, this.quarter.width, this.quarter.height);
    blur(this.quarter, this.quarterB, this.quarter, this.quarter.width, this.quarter.height);

    // god rays: only when the light source is in front of the camera
    const cam = f.camera;
    const p = this.tmp.copy(cam.position).addScaledVector(f.lightDir, 1000).project(cam);
    const facing = this.tmp.set(0, 0, -1).applyQuaternion(cam.quaternion).dot(f.lightDir);
    let rayStrength = 0;
    if (facing > 0 && !f.underwater && f.lightStrength > 0.01) {
      const sx = p.x * 0.5 + 0.5, sy = p.y * 0.5 + 0.5;
      const edge = Math.max(0, Math.max(Math.abs(sx - 0.5), Math.abs(sy - 0.5)) - 0.5);
      rayStrength = f.lightStrength * Math.min(1, facing * 1.6) * Math.max(0, 1 - edge * 2.5);
      if (rayStrength > 0.01) {
        const u = this.mRays.uniforms;
        u.tColor.value = sceneTex;
        u.tDepth.value = depthTex;
        (u.uLight.value as Vector2).set(sx, sy);
        u.uAspect.value = this.w / Math.max(1, this.h);
        this.draw(this.mRays, this.rays);
      }
    }

    // composite to the canvas
    const c = this.mComp.uniforms;
    c.tColor.value = sceneTex;
    c.tBloom.value = this.half.texture;
    c.tBloom2.value = this.quarter.texture;
    c.tRays.value = this.rays.texture;
    c.tDepth.value = depthTex;
    (c.uRayColor.value as Color).copy(f.rayColor);
    c.uRayStrength.value = rayStrength * 0.55;
    (c.uFogColor.value as Color).copy(f.fogColor);
    (c.uSunColor.value as Color).copy(f.sunColor);
    (c.uLightDir.value as Vector3).copy(f.lightDir);
    c.uFogDensity.value = 0.0035 + f.dawnDusk * 0.006;
    c.uFogFar.value = f.fogFar;
    (c.uCamPos.value as Vector3).copy(cam.position);
    this.invProj.copy(cam.projectionMatrixInverse);
    this.invView.copy(cam.matrixWorld);
    (c.uInvProj.value as Matrix4).copy(this.invProj);
    (c.uInvView.value as Matrix4).copy(this.invView);
    c.uUnderwater.value = f.underwater ? 1 : 0;
    this.draw(this.mComp, null);
  }

  dispose(): void {
    for (const t of [this.scene, this.half, this.halfB, this.quarter, this.quarterB, this.rays]) t.dispose();
    this.scene.depthTexture?.dispose();
    for (const m of [this.mBright, this.mBlur, this.mRays, this.mComp, this.mCopy]) m.dispose();
    this.quad.geometry.dispose();
  }
}
