import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  Fog,
  HalfFloatType,
  HemisphereLight,
  MathUtils,
  OrthographicCamera,
  PCFShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Sprite,
  SpriteMaterial,
  AdditiveBlending,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CAMERA, FX, type GraphicsPreset } from '../config';
import type { Camera } from '../render/camera';
import { rng } from '../sim/geom';
import type { ImpactEvent, ScrapeInfo } from '../sim/sim';
import type { LevelDef } from '../sim/types';
import { createAtmos, rockColor, sampleAtmos, type Atmos } from './palette';
import { ParticlePool } from './particles3d';
import { PICK_Z, PlayerModel } from './player3d';
import { Scenery } from './scenery';
import { buildTerrain } from './terrain';
import { makeTextures } from './textures';

export interface ViewFrame {
  bx: number;
  by: number;
  hx: number;
  hy: number;
  ha: number;
  reach: number;
  vx: number;
  vy: number;
}

/** Things the renderer wants the audio side to hear about. */
export interface RenderSignals {
  thunder: number;
}

const DUST_ROCK = new Color();
const DUST_LIGHT = new Color('#f1e6d2');
const WOOD_DUST = new Color('#a77b52');
const ICE_DUST = new Color('#e4f4ff');
const SPARK = new Color('#ffd9a0');
const LEAF = [new Color('#d9822b'), new Color('#c4532f'), new Color('#e8b23c')];
const SNOW = new Color('#f4f8ff');

export class Renderer3D {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  readonly player: PlayerModel;
  readonly preset: GraphicsPreset;
  private skyScene = new Scene();
  private skyCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private composer: EffectComposer | null = null;
  private sun: DirectionalLight;
  private hemi: HemisphereLight;
  private scenery: Scenery;
  private dust: ParticlePool;
  private sparks: ParticlePool;
  private weather: ParticlePool;
  readonly atmos: Atmos = createAtmos();
  private flash = 0;
  private nextLightning = 8;
  private snowAcc = 0;
  private leafAcc = 0;
  private rand = rng(4242);
  private time = 0;
  private w = 1;
  private h = 1;
  readonly signals: RenderSignals = { thunder: 0 };
  private aim: Sprite;

  constructor(canvas: HTMLCanvasElement, level: LevelDef, preset: GraphicsPreset) {
    this.preset = preset;
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: preset.msaa && !preset.post,
      powerPreference: preset.post ? 'high-performance' : 'default',
    });
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = preset.shadows;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.renderer.autoClear = false;
    this.camera = new PerspectiveCamera(16, 1, 1, 2400);

    const tex = makeTextures();
    for (const t of Object.values(tex)) t.anisotropy = preset.pbr ? 4 : 1;
    const terrain = buildTerrain(level, tex, { detail: preset.detail, pbr: preset.pbr, shadows: preset.shadows });
    this.scene.add(terrain.group);
    this.scenery = new Scenery(level, tex, terrain.rockMaterial, preset);
    // With post-processing the sky gets its own pass (AO must not see it);
    // otherwise it goes in the main scene, drawn last behind everything.
    if (preset.post) this.skyScene.add(this.scenery.sky);
    else this.scene.add(this.scenery.sky);
    this.scene.add(this.scenery.group);

    this.player = new PlayerModel(tex, preset.shadows, preset.pbr);
    this.scene.add(this.player.root);

    const pmrem = new PMREMGenerator(this.renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.player.setEnvMap(env);
    const ice = terrain.materials.find((m) => 'roughness' in m && (m as { roughness: number }).roughness < 0.2) as
      | { envMap: unknown; envMapIntensity: number }
      | undefined;
    if (ice) {
      ice.envMap = env;
      ice.envMapIntensity = 0.6;
    }

    this.sun = new DirectionalLight(0xffffff, 2);
    this.sun.castShadow = preset.shadows;
    if (preset.shadows) {
      this.sun.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
      this.sun.shadow.bias = -0.0004;
      this.sun.shadow.normalBias = 0.03;
      this.sun.shadow.radius = 2.5;
    }
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new HemisphereLight(0xffffff, 0x444444, 1);
    this.scene.add(this.hemi);
    this.scene.fog = new Fog(0xffffff, CAMERA.distance + 40, CAMERA.distance + 1100);

    const k = preset.particles;
    this.dust = new ParticlePool(Math.round(900 * k) + 60, tex.soft);
    this.sparks = new ParticlePool(Math.round(300 * k) + 30, tex.soft, true);
    this.weather = new ParticlePool(Math.round(1400 * k) + 100, tex.flake);
    this.scene.add(this.dust.points, this.sparks.points, this.weather.points);
    this.aim = new Sprite(new SpriteMaterial({ map: tex.soft, color: new Color('#ffe7b0'), transparent: true, blending: AdditiveBlending, depthTest: false }));
    this.aim.scale.set(0.22, 0.22, 1);
    this.aim.renderOrder = 999;
    this.aim.visible = false;
    this.scene.add(this.aim);

    if (preset.post) {
      const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: preset.msaa ? 4 : 0 });
      this.composer = new EffectComposer(this.renderer, target);
      const skyPass = new RenderPass(this.skyScene, this.skyCam);
      const mainPass = new RenderPass(this.scene, this.camera);
      mainPass.clear = false;
      this.composer.addPass(skyPass);
      this.composer.addPass(mainPass);
      if (preset.ao) {
        const ao = new GTAOPass(this.scene, this.camera, 1, 1);
        ao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.4, thickness: 2, scale: 1.1, samples: 12 });
        ao.blendIntensity = 0.85;
        this.composer.addPass(ao);
      }
      if (preset.bloom) this.composer.addPass(new UnrealBloomPass(new Vector2(256, 256), 0.32, 0.55, 1.0));
      this.composer.addPass(new OutputPass());
    }
  }

  /** Optional aim dot at the virtual cursor. */
  setAim(visible: boolean, x: number, y: number): void {
    this.aim.visible = visible;
    if (visible) this.aim.position.set(x, y, PICK_Z + 0.2);
  }

  resize(w: number, h: number, dpr: number): void {
    this.w = w;
    this.h = h;
    const ratio = Math.min(dpr, this.preset.pixelRatioCap) * this.preset.renderScale;
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);
    if (this.composer) {
      this.composer.setPixelRatio(ratio);
      this.composer.setSize(w, h);
    }
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Burst of dust/sparks for a physics impact. */
  impact(e: ImpactEvent): void {
    if (e.speed < FX.dustThreshold) return;
    const n = Math.max(2, Math.round(Math.min(26, (e.speed - FX.dustThreshold) * 3 + 4) * this.preset.particles));
    const col = e.mat === 'wood' ? WOOD_DUST : e.mat === 'ice' ? ICE_DUST : rockColor(DUST_ROCK, e.y).lerp(DUST_LIGHT, 0.35);
    const z = e.part === 'head' ? PICK_Z : 0;
    for (let i = 0; i < n; i++) {
      const sp = 0.6 + this.rand() * Math.min(5, e.speed * 0.35);
      const a = Math.atan2(e.ny, e.nx) + (this.rand() - 0.5) * 2.4;
      this.dust.spawn({
        x: e.x,
        y: e.y,
        z: z + (this.rand() - 0.5) * 0.8,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp + 0.4,
        vz: (this.rand() - 0.5) * 1.2,
        size: 0.18 + this.rand() * 0.28,
        life: 0.5 + this.rand() * 0.7,
        color: col,
        gravity: 1.5,
        drag: 2.6,
        alpha: 0.75,
      });
    }
    if (e.part === 'head' && e.mat === 'rock' && e.speed > 4) {
      const m = Math.max(2, Math.round(Math.min(16, e.speed * 1.2) * this.preset.particles));
      for (let i = 0; i < m; i++) {
        const a = this.rand() * Math.PI * 2;
        const sp = 2 + this.rand() * 5;
        this.sparks.spawn({
          x: e.x,
          y: e.y,
          z: PICK_Z,
          vx: Math.cos(a) * sp + e.nx * 2,
          vy: Math.sin(a) * sp + e.ny * 2,
          vz: (this.rand() - 0.5) * 2,
          size: 0.07 + this.rand() * 0.06,
          life: 0.18 + this.rand() * 0.25,
          color: SPARK,
          gravity: 14,
          drag: 0.8,
        });
      }
    }
  }

  /** Grit trailing behind anything sliding along the ground. */
  scrape(s: ScrapeInfo, dt: number): void {
    const emit = (speed: number, at: { x: number; y: number }, mat: string, z: number) => {
      if (speed < 1.5) return;
      if (this.rand() > speed * dt * 4.8 * this.preset.particles) return;
      const col = mat === 'wood' ? WOOD_DUST : mat === 'ice' ? ICE_DUST : rockColor(DUST_ROCK, at.y).lerp(DUST_LIGHT, 0.35);
      this.dust.spawn({
        x: at.x,
        y: at.y,
        z: z + (this.rand() - 0.5) * 0.6,
        vx: (this.rand() - 0.5) * 1.2,
        vy: 0.4 + this.rand() * 0.8,
        vz: (this.rand() - 0.5) * 0.6,
        size: 0.14 + this.rand() * 0.18,
        life: 0.4 + this.rand() * 0.4,
        color: col,
        gravity: 0.5,
        drag: 2.5,
        alpha: 0.6,
      });
    };
    emit(s.head, s.headAt, s.headMat, PICK_Z);
    emit(s.barrel, s.barrelAt, s.barrelMat, 0);
  }

  render(view: ViewFrame, cam: Camera, dt: number): void {
    this.time += dt;
    const a = sampleAtmos(this.atmos, cam.oy);

    // Camera: long lens, slightly above, so rock tops show and contacts line up.
    const visH = cam.h / cam.ppm;
    const fov = MathUtils.radToDeg(2 * Math.atan(visH / 2 / CAMERA.distance));
    if (Math.abs(fov - this.camera.fov) > 1e-4) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.set(cam.ox, cam.oy + CAMERA.elevation, CAMERA.distance);
    this.camera.lookAt(cam.ox, cam.oy, 0);

    // Lights and fog from the altitude palette.
    const sunDir = new Vector3(-0.55, 0.3 + a.sunElevation * 1.4, 0.62).normalize();
    this.sun.position.set(cam.ox + sunDir.x * 90, cam.oy + sunDir.y * 90, sunDir.z * 90);
    this.sun.target.position.set(cam.ox, cam.oy, 0);
    this.sun.color.copy(a.sun);
    this.sun.intensity = a.sunIntensity * (1 + this.flash * 1.5);
    const visW = visH * (this.w / this.h);
    if (this.preset.shadows) {
      const sc = this.sun.shadow.camera;
      sc.left = -(visW * 0.75 + 8);
      sc.right = visW * 0.75 + 8;
      sc.top = visH * 0.75 + 8;
      sc.bottom = -(visH * 0.75 + 8);
      sc.near = 1;
      sc.far = 220;
      sc.updateProjectionMatrix();
    }
    this.hemi.color.copy(a.hemiSky);
    this.hemi.groundColor.copy(a.hemiGround);
    this.hemi.intensity = a.hemiIntensity * (1 + this.flash * 2.5);
    (this.scene.fog as Fog).color.copy(a.fog);

    // Lightning in the storm.
    this.signals.thunder = 0;
    if (a.storm > 0.55) {
      this.nextLightning -= dt;
      if (this.nextLightning <= 0) {
        this.flash = 1;
        this.signals.thunder = 0.6 + this.rand() * 0.4;
        this.nextLightning = 5 + this.rand() * 10;
      }
    }
    this.flash = Math.max(0, this.flash - dt * 3.2);
    const flashVis = this.flash > 0.55 ? this.flash : this.flash * (0.6 + 0.4 * Math.sin(this.time * 90));

    // Snow thickens with the storm; leaves drift around the tree.
    const pxPerM = this.h / (2 * Math.tan(MathUtils.degToRad(this.camera.fov) / 2));
    for (const p of [this.dust, this.sparks, this.weather]) p.setScale(pxPerM * this.renderer.getPixelRatio());
    const snowRate = a.storm > 0.2 ? (a.storm - 0.2) * 260 * this.preset.particles : 0;
    this.snowAcc += snowRate * dt;
    while (this.snowAcc > 1) {
      this.snowAcc--;
      this.weather.spawn({
        x: cam.ox + (this.rand() - 0.5) * (visW + 14),
        y: cam.oy + visH * 0.6 + this.rand() * 4,
        z: -6 + this.rand() * 22,
        vx: 2 + a.storm * 6,
        vy: -2.5 - this.rand() * 2,
        vz: 0,
        size: 0.05 + this.rand() * 0.07,
        life: 4 + this.rand() * 2,
        color: SNOW,
        gravity: 0,
        drag: 0,
        fadeIn: true,
        alpha: 0.9,
      });
    }
    if (cam.ox > 40 && cam.ox < 70 && cam.oy < 55) {
      this.leafAcc += dt * 3 * this.preset.particles;
      while (this.leafAcc > 1) {
        this.leafAcc--;
        this.weather.spawn({
          x: 50 + this.rand() * 12,
          y: cam.oy + visH * 0.55,
          z: -2 + this.rand() * 3,
          vx: (this.rand() - 0.3) * 1.5,
          vy: -1 - this.rand(),
          vz: 0,
          size: 0.12 + this.rand() * 0.08,
          life: 6,
          color: LEAF[Math.floor(this.rand() * LEAF.length)],
          gravity: 0,
          drag: 0,
          fadeIn: true,
        });
      }
    }
    this.dust.update(dt);
    this.sparks.update(dt);
    this.weather.update(dt, Math.sin(this.time * 0.7) * a.storm * 2);

    this.scenery.update(dt, a, this.w / this.h, flashVis * 0.55);
    this.player.update(dt, view.bx, view.by, view.hx, view.hy, view.ha, view.reach, view.vx, view.vy);

    if (this.composer) {
      this.composer.render(dt);
    } else {
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
    }
  }
}
