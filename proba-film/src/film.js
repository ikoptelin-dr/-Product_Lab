// Proba Lab — 3D-пролёт над лендингом. 14,5 с, 1440×1152.
// Каждый кадр — чистая функция времени: seek(t) считает камеру, подъёмы кусков, плитки логотипа,
// глубину резкости и титр. Никаких таймеров и CSS-переходов внутри фильма.
//
// Мир: страница лежит в плоскости z = 0, x — вправо (0…1440), y — вниз по странице (0…pageH),
// z — вверх от пола. Единица — CSS-пиксель страницы. Камера смотрит «вверх по странице»
// (к hero) и отъезжает назад вниз по странице.
//
// Структура (сек): полёт 0–8,2 · подъём 7,75–9,25 · сверху 9,25–9,47 · пике 9,47–9,97 · титр 9,97–14,5.

/* global FILM_ASSETS */
export const DURATION = 14.5;
const W = 1440, H = 1152, FOCAL = 1880, TILT0 = (56 * Math.PI) / 180;
const BOTTOM_GAP = 42; // низ страницы над нижним краем кадра в конце подъёма
const CARD_W = 1018, CARD_Y = 283, CARD_R = 38;

/* ------------------------------------------------------------ математика */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, t) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const smoother = (a, b, t) => { const x = clamp((t - a) / (b - a)); return x * x * x * (x * (x * 6 - 15) + 10); };
const easeInOutQuad = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
/** Трапеция скорости: разгон r, равномерно, торможение r. Возвращает пройденную долю 0…1. */
function trapezoid(x, r = 0.25) {
  x = clamp(x);
  const vmax = 1 / (1 - r);
  if (x < r) return (0.5 * vmax * x * x) / r;
  if (x > 1 - r) { const y = 1 - x; return 1 - (0.5 * vmax * y * y) / r; }
  return 0.5 * vmax * r + vmax * (x - r);
}

/* ------------------------------------------------------------ сценарий */
let L; // layout.json
let PH, HERO_H, Y0, CRUISE, Y_END;
const SPEED_DT = 0.001;
let travelTable;

/** Нормированная скорость скольжения (1 = крейсерская). 0 → 0,5 к 0,6 с, держим до 1,25,
 *  1,0 к 1,6, ровно до 7,3, затем плавно до 0,12 к 8,3 и до нуля к концу подъёма. */
function speed(t) {
  if (t < 0.6) return 0.5 * sstep(0, 0.6, t);
  if (t < 1.25) return 0.5;
  if (t < 1.6) return 0.5 + 0.5 * sstep(1.25, 1.6, t);
  if (t < 7.3) return 1;
  if (t < 8.3) return 1 - 0.88 * sstep(7.3, 8.3, t);
  return 0.12 * (1 - sstep(8.3, 9.25, t));
}
function buildTravel() {
  const n = Math.ceil(DURATION / SPEED_DT) + 2;
  travelTable = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const t = (i - 0.5) * SPEED_DT;
    travelTable[i] = travelTable[i - 1] + speed(t) * SPEED_DT;
  }
}
const travel = (t) => { const x = clamp(t, 0, DURATION) / SPEED_DT, i = Math.floor(x), f = x - i; return lerp(travelTable[i], travelTable[i + 1] ?? travelTable[i], f); };

/** Дистанция в полёте: 1360 → 1700, только наружу. */
const flightDist = (t) => 1360 + 340 * smoother(0.35, 2.4, t);

/** Камера: позиция глаза, базис и фокус. */
function camera(t) {
  let D, tilt = TILT0, tx = W / 2, ty;
  const flightY = Y0 + CRUISE * travel(t);
  const Dend = (FOCAL * PH) / (H - 2 * BOTTOM_GAP); // вся страница — одна полоса между 42 и 1110
  if (t < 7.75) {
    D = flightDist(t); ty = flightY;
  } else if (t < 9.25) {
    // подъём: ровный по логарифму масштаба, скорость — трапеция; наклон уходит в 0 за 8,15–8,95
    const D0 = flightDist(7.75);
    D = Math.exp(lerp(Math.log(D0), Math.log(Dend), trapezoid((t - 7.75) / 1.5, 0.3)));
    tilt = TILT0 * (1 - smoother(8.15, 8.95, t));
    // передача: нижний край страницы удерживается на 42 px над низом кадра
    const s = Math.sin(tilt), c = Math.cos(tilt), yb = H - BOTTOM_GAP - H / 2;
    const delta = (yb * D) / (FOCAL * c + yb * s);
    ty = lerp(flightY, PH - delta, smoother(7.8, 8.7, t));
  } else if (t < 9.47) {
    // сверху: вся страница одной полосой по центру, подползаем на 3,5 %
    tilt = 0; ty = PH / 2;
    D = Dend / (1 + 0.035 * sstep(9.25, 9.47, t));
  } else {
    // пике и титр: камера строго сверху, масштаб — по логарифму с квадратичным easing,
    // верхний край страницы — точка опоры, едет к y = 283; карта шириной 1018 px
    tilt = 0;
    const sA = FOCAL / (Dend / 1.035), sB = CARD_W / W;
    const yA = H / 2 - (PH / 2) * sA;
    const e = easeInOutQuad(clamp((t - 9.47) / 0.5));
    let s = Math.exp(lerp(Math.log(sA), Math.log(sB), e));
    let ytop = lerp(yA, CARD_Y, e);
    if (t > 10.6) {
      // титр: карта подползает на 2 % вокруг своего центра
      const k = 1 + 0.02 * smoother(10.6, 14.5, t);
      const cy = CARD_Y + (HERO_H * sB) / 2;
      s = sB * k; ytop = cy - (HERO_H * s) / 2;
    }
    D = FOCAL / s; ty = (H / 2 - ytop) / s;
  }
  const s = Math.sin(tilt), c = Math.cos(tilt);
  const eye = [tx, ty + D * s, D * c];
  return { eye, r: [1, 0, 0], u: [0, -c, s], f: [0, -s, -c], D, tilt, tx, ty };
}

/** Состояние подъёма куска: 0 — лежит, 1 — поднят и стоит. */
function liftOf(p, t, cam) {
  let k;
  if (p.hero) k = smoother(0.1 + p.delay, 1.35, t);
  else {
    const rel = p.y + p.h / 2 - cam.ty; // > 0 — кусок ещё ближе к камере, чем середина кадра
    k = 1 - smoother(-120, 700, rel);
  }
  return k * (1 - smoother(7.95, 9.1, t)); // к полосе сверху всё ложится обратно
}

/* ------------------------------------------------------------ плитки логотипа */
// Старт — четыре плитки по 32 px справа от кнопки; висят за верхними углами страницы;
// в конце две садятся на верхние углы карты, две уходят.
function tileState(i, t, cam) {
  const b = L.button;
  const start = { x: b.x + b.w + 30 + i * 42, y: b.y + b.h / 2, z: 0, size: 32, phi: 0, psi: 0, a: 1 };
  const hang = [
    { x: -60, y: -150, z: 200, size: 190, phi: 0.95, psi: -0.1 },
    { x: 150, y: -320, z: 120, size: 140, phi: 0.9, psi: 0.08 },
    { x: 1500, y: -160, z: 220, size: 200, phi: 0.95, psi: 0.12 },
    { x: 1290, y: -330, z: 130, size: 150, phi: 0.9, psi: -0.06 },
  ][i];
  const k = smoother(0.1 + i * 0.07, 1.35, t);
  const arc = Math.sin(Math.PI * k) * 140; // дуга вверх при перелёте
  let s = {
    x: lerp(start.x, hang.x, k), y: lerp(start.y, hang.y, k), z: lerp(start.z, hang.z, k) + arc,
    size: lerp(start.size, hang.size, k), phi: lerp(0, hang.phi, k), psi: lerp(0, hang.psi, k), a: 1,
  };
  // подъём → вид сверху: плитки ложатся лицом к камере (наклон уходит вместе с камерой)
  const flat = smoother(8.15, 8.95, t);
  s.phi *= 1 - flat;
  if (t > 9.47) {
    const e = easeInOutQuad(clamp((t - 9.47) / 0.5));
    const sB = CARD_W / W;
    const land = [
      { x: 18, y: 10, z: 60, size: 118 / sB, psi: -0.12 },
      null,
      { x: W - 18, y: 10, z: 60, size: 118 / sB, psi: 0.1 },
      null,
    ][i];
    if (land) s = { ...s, x: lerp(s.x, land.x, e), y: lerp(s.y, land.y, e), z: lerp(s.z, land.z, e), size: lerp(s.size, land.size, e), psi: lerp(s.psi, land.psi, e), phi: 0 };
    else { s.x += (i === 1 ? -1 : 1) * 900 * e; s.y -= 700 * e; s.a = 1 - sstep(0, 0.6, e); }
  }
  return s;
}

/* ------------------------------------------------------------ WebGL */
let gl, canvas, overlay, octx;
let progPlane, progFloor, progShadowPage, progAccum;
let quadVAO, fsVAO;
let pageTiles = [], pieceTex = [], tileTex;
let fbo, fboTex, accFbo, accTex, floatOK = false;
let emblemImg;

const VS = `#version 300 es
in vec2 aCorner;
uniform vec3 uCenter; uniform vec2 uHalf; uniform float uMargin; uniform float uPhi, uPsi;
uniform vec4 uUV;
uniform vec3 uEye, uR, uU, uF; uniform float uFocal; uniform vec2 uView;
out vec2 vUV; out vec2 vLocal; out float vDepth; out vec3 vWorld;
void main() {
  vec2 l = mix(-uHalf - uMargin, uHalf + uMargin, aCorner);
  vLocal = l;
  vUV = mix(uUV.xy, uUV.zw, (l + uHalf) / (2.0 * uHalf));
  float cs = cos(uPsi), sn = sin(uPsi);
  vec2 lr = vec2(l.x * cs - l.y * sn, l.x * sn + l.y * cs);
  vec3 p = uCenter + vec3(lr.x, lr.y * cos(uPhi), -lr.y * sin(uPhi));
  vWorld = p;
  vec3 d = p - uEye;
  float depth = dot(d, uF);
  vDepth = depth;
  gl_Position = vec4(2.0 * uFocal / uView.x * dot(d, uR), 2.0 * uFocal / uView.y * dot(d, uU), depth - 20.0, depth);
}`;

// Слой с глубиной резкости. Режим 0 — кусок/плитка (premultiplied RGBA), 1 — тайл страницы
// (непрозрачный, маска скруглённого прямоугольника и затухание ниже hero), 2 — тень куска.
const FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec2 vLocal; in float vDepth; in vec3 vWorld;
uniform sampler2D uTex;
uniform int uMode, uTaps;
uniform float uFocus, uAlpha;
uniform vec4 uMask; uniform float uRadius, uFadeY, uFade;
uniform vec3 uShadowColor; uniform float uShadowLod; uniform vec2 uShadowUV;
out vec4 o;
float blurPx(float depth) {
  float r = depth < uFocus ? 75.0 * (uFocus - depth) / depth : 6.0 * (depth - uFocus) / depth;
  return min(r, 120.0);
}
float rrect(vec2 p, vec4 rc, float rad, float aa) {
  vec2 c = (rc.xy + rc.zw) * 0.5, h = (rc.zw - rc.xy) * 0.5;
  vec2 q = abs(p - c) - h + rad;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
  return clamp(0.5 - d / aa, 0.0, 1.0);
}
vec4 tap(vec2 uv, vec2 pp, vec2 gx, vec2 gy, float aa) {
  vec4 c = textureGrad(uTex, uv, gx, gy);
  if (uMode == 1) {
    float m = rrect(pp, uMask, uRadius, aa);
    m *= pp.y > uFadeY ? 1.0 - uFade : 1.0;
    c = vec4(c.rgb, 1.0) * m;
  }
  return c;
}
void main() {
  if (uMode == 2) {
    float a = 0.0;
    for (int k = 0; k < 8; k++) {
      float ang = float(k) * 2.39996, rr = sqrt((float(k) + 0.5) / 8.0);
      vec2 uv = vUV + uShadowUV * rr * vec2(cos(ang), sin(ang));
      // за краем изображения тени нет (иначе clamp-to-edge растягивает краевые тексели в квадрат)
      vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
      a += textureLod(uTex, uv, uShadowLod).a * inside.x * inside.y;
    }
    o = vec4(uShadowColor, 1.0) * (a / 8.0) * uAlpha;
    return;
  }
  vec2 dux = dFdx(vUV), duy = dFdy(vUV);
  vec2 dpx = dFdx(vWorld.xy), dpy = dFdy(vWorld.xy);
  float aa = max(length(dpx) + length(dpy), 1e-3) * 0.7;
  float r = blurPx(vDepth);
  vec4 col;
  if (r < 0.6 || uTaps <= 1) col = tap(vUV, vWorld.xy, dux, duy, aa);
  else {
    float n = float(uTaps), g = max(1.0, 1.5 * r / sqrt(n));
    col = vec4(0.0);
    for (int k = 0; k < 64; k++) {
      if (k >= uTaps) break;
      float ang = float(k) * 2.39996, rr = r * sqrt((float(k) + 0.5) / n);
      vec2 off = rr * vec2(cos(ang), sin(ang));
      col += tap(vUV + dux * off.x + duy * off.y, vWorld.xy + dpx * off.x + dpy * off.y, dux * g, duy * g, aa * g);
    }
    col /= n;
  }
  o = col * uAlpha;
}`;

const FS_SHADOW_PAGE = `#version 300 es
precision highp float;
in vec2 vUV; in vec2 vLocal; in float vDepth; in vec3 vWorld;
uniform vec4 uMask; uniform float uRadius, uAlpha; uniform vec3 uShadowColor;
out vec4 o;
void main() {
  vec2 c = (uMask.xy + uMask.zw) * 0.5, h = (uMask.zw - uMask.xy) * 0.5;
  vec2 q = abs(vWorld.xy - c - vec2(0.0, 18.0)) - h + uRadius;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float wide = exp(-pow(max(d + 30.0, 0.0) / 150.0, 2.0)) * 0.13;
  float near = exp(-max(d, 0.0) / 14.0) * 0.10;
  o = vec4(uShadowColor, 1.0) * (wide + near) * uAlpha;
}`;

const VS_FS = `#version 300 es
in vec2 aPos; out vec2 vP;
void main() { vP = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FS_FLOOR = `#version 300 es
precision highp float;
in vec2 vP; out vec4 o;
void main() {
  // студийный пол: #f9fbfb в центре, #f2f3f6 в углах
  float t = clamp(length((vP - 0.5) * vec2(1.25, 1.0)) / 0.8, 0.0, 1.0);
  vec3 mid = vec3(249.0, 251.0, 251.0) / 255.0, corner = vec3(242.0, 243.0, 246.0) / 255.0;
  o = vec4(mix(mid, corner, t * t * (3.0 - 2.0 * t)), 1.0);
}`;
const FS_ACCUM = `#version 300 es
precision highp float;
in vec2 vP; uniform sampler2D uTex; uniform float uGain; out vec4 o;
void main() { o = texture(uTex, vP) * uGain; }`;

function compile(vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
  return { p, u };
}

let aniso;
function texFrom(img) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  return t;
}
const loadImg = (src) => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src; });

function makeTarget(internal, format, type) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, W, H, 0, format, type, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return ok ? { fb, tex } : null;
}

/** Плитка логотипа: белый скруглённый квадрат с эмблемой. */
function logoTileCanvas() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  const r = 116;
  x.beginPath(); x.roundRect(8, 8, 496, 496, r);
  x.fillStyle = "#ffffff"; x.fill();
  x.lineWidth = 3; x.strokeStyle = "rgba(19,32,31,0.08)"; x.stroke();
  const s = 330, ar = emblemImg.height / emblemImg.width;
  x.drawImage(emblemImg, 256 - s / 2, 256 - (s * ar) / 2, s, s * ar);
  return c;
}

export async function init(root, assets) {
  L = assets.layout;
  PH = L.pageH; HERO_H = L.heroH;
  Y0 = HERO_H * 0.3;                // «центр верхней половины hero»
  Y_END = PH - 560;                 // подвал у середины кадра, когда скольжение гаснет
  buildTravel();
  CRUISE = (Y_END - Y0) / travel(8.2);
  for (const p of L.pieces) { p.hero = p.y < HERO_H; p.delay = p.hero ? 0.08 * (p.id.charCodeAt(2) % 4) : 0; }

  canvas = root.querySelector("canvas.film-gl");
  overlay = root.querySelector("canvas.film-2d");
  canvas.width = overlay.width = W;
  canvas.height = overlay.height = H;
  gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: true, alpha: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL2 недоступен");
  octx = overlay.getContext("2d");
  aniso = gl.getExtension("EXT_texture_filter_anisotropic");
  floatOK = !!gl.getExtension("EXT_color_buffer_float");

  progPlane = compile(VS, FS);
  progShadowPage = compile(VS, FS_SHADOW_PAGE);
  progFloor = compile(VS_FS, FS_FLOOR);
  progAccum = compile(VS_FS, FS_ACCUM);

  quadVAO = gl.createVertexArray();
  gl.bindVertexArray(quadVAO);
  const qb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, qb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  for (const pr of [progPlane, progShadowPage]) { const loc = gl.getAttribLocation(pr.p, "aCorner"); if (loc >= 0) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); } }
  fsVAO = gl.createVertexArray();
  gl.bindVertexArray(fsVAO);
  const fb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  for (const pr of [progFloor, progAccum]) { const loc = gl.getAttribLocation(pr.p, "aPos"); if (loc >= 0) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); } }
  gl.bindVertexArray(null);

  const [tiles, pieces, emb] = await Promise.all([
    Promise.all(assets.tiles.map(loadImg)),
    Promise.all(assets.pieces.map(loadImg)),
    loadImg(assets.emblem),
  ]);
  emblemImg = emb;
  pageTiles = L.tiles.map((t, i) => ({ ...t, tex: texFrom(tiles[i]) }));
  pieceTex = pieces.map(texFrom);
  tileTex = texFrom(logoTileCanvas());

  const sc = makeTarget(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
  fbo = sc.fb; fboTex = sc.tex;
  const ac = (floatOK && makeTarget(gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT)) || makeTarget(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
  accFbo = ac.fb; accTex = ac.tex;
  await document.fonts.load('500 74px "Geist"');
  await document.fonts.load('italic 82px "PT Serif"');
}

/* ------------------------------------------------------------ отрисовка сцены */
function setCam(pr, cam) {
  const u = pr.u;
  gl.uniform3fv(u.uEye, cam.eye); gl.uniform3fv(u.uR, cam.r); gl.uniform3fv(u.uU, cam.u); gl.uniform3fv(u.uF, cam.f);
  gl.uniform1f(u.uFocal, FOCAL); gl.uniform2f(u.uView, W, H);
}
function drawQuad(pr, q) {
  const u = pr.u;
  gl.uniform3f(u.uCenter, q.cx, q.cy, q.cz || 0);
  gl.uniform2f(u.uHalf, q.hw, q.hh);
  gl.uniform1f(u.uMargin, q.margin || 0);
  gl.uniform1f(u.uPhi, q.phi || 0);
  gl.uniform1f(u.uPsi, q.psi || 0);
  if (u.uUV) gl.uniform4fv(u.uUV, q.uv || [0, 0, 1, 1]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/** Маска страницы: в пике всё ниже hero гаснет, прямоугольник сжимается до hero, углы 24 → 38 px экрана. */
function pageMask(t) {
  const e = easeInOutQuad(clamp((t - 9.47) / 0.5));
  const sB = CARD_W / W;
  const h = lerp(PH, HERO_H, smoother(9.55, 9.97, t));
  return { rect: [0, 0, W, h], radius: lerp(24, CARD_R / sB, e), fadeY: HERO_H, fade: smoother(9.47, 9.8, t) };
}

function drawScene(t, taps) {
  const cam = camera(t);
  gl.viewport(0, 0, W, H);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // пол
  gl.useProgram(progFloor.p);
  gl.bindVertexArray(fsVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(quadVAO);

  const mask = pageMask(t);
  // мягкая широкая тень вокруг страницы
  gl.useProgram(progShadowPage.p);
  setCam(progShadowPage, cam);
  // тень гаснет вместе со страницей ниже hero
  const shRect = [0, 0, W, lerp(mask.rect[3], HERO_H, mask.fade)];
  gl.uniform4fv(progShadowPage.u.uMask, shRect);
  gl.uniform1f(progShadowPage.u.uRadius, mask.radius);
  gl.uniform1f(progShadowPage.u.uAlpha, 1);
  gl.uniform3f(progShadowPage.u.uShadowColor, 0x1a / 255, 0x21 / 255, 0x33 / 255);
  drawQuad(progShadowPage, { cx: W / 2, cy: shRect[3] / 2, hw: W / 2, hh: shRect[3] / 2, margin: 420 });

  const P = progPlane, u = P.u;
  gl.useProgram(P.p);
  setCam(P, cam);
  gl.uniform1f(u.uFocus, cam.D);
  gl.uniform1i(u.uTaps, taps);
  gl.uniform1i(u.uTex, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform3f(u.uShadowColor, 0x1a / 255, 0x21 / 255, 0x33 / 255);

  // страница: тайлы. У крайних тайлов поле 160 px, чтобы размытие краёв не обрезалось.
  gl.uniform1i(u.uMode, 1);
  gl.uniform4fv(u.uMask, mask.rect);
  gl.uniform1f(u.uRadius, mask.radius);
  gl.uniform1f(u.uFadeY, mask.fadeY);
  gl.uniform1f(u.uFade, mask.fade);
  gl.uniform1f(u.uAlpha, 1);
  for (const tl of pageTiles) {
    if (tl.y0 > mask.rect[3] + 200) continue;
    const span = tl.ty1 - tl.ty0;
    const m = 160;
    const top = tl.y0 === 0 ? -m : tl.y0, bot = tl.y1 === PH ? PH + m : tl.y1;
    const cy = (top + bot) / 2, hh = (bot - top) / 2;
    // uv по x выходит за [0,1] на полях — маска там всё равно обнуляет вклад
    const ux = (W / 2 + m) / W;
    gl.bindTexture(gl.TEXTURE_2D, tl.tex);
    drawQuad(P, { cx: W / 2, cy, hw: W / 2 + m, hh, uv: [0.5 - ux, (top - tl.ty0) / span, 0.5 + ux, (bot - tl.ty0) / span] });
  }

  // куски: сначала все тени, затем сами куски от низких к высоким
  const states = L.pieces.map((p, i) => {
    const k = liftOf(p, t, cam);
    return { p, i, k, z: p.z * k, phi: ((p.stand * Math.PI) / 180) * k };
  }).filter((s) => s.p.y + s.p.h > 0 && s.p.y < mask.rect[3]);
  const fadeBelow = (s) => (s.p.y + s.p.h / 2 > HERO_H ? 1 - mask.fade : 1);
  gl.uniform1i(u.uMode, 2);
  for (const s of states) {
    const p = s.p;
    const blur = 7 + 0.5 * s.z, ox = 0.1 * s.z, oy = 4 + 0.36 * s.z;
    const a = 0.26 * (0.4 + 0.6 * s.k) * fadeBelow(s);
    if (a < 0.003) continue;
    gl.uniform1f(u.uAlpha, a);
    gl.uniform1f(u.uShadowLod, Math.max(0, Math.log2(blur * L.dpr * 0.7)));
    gl.uniform2f(u.uShadowUV, blur / p.w, blur / p.h);
    gl.bindTexture(gl.TEXTURE_2D, pieceTex[s.i]);
    const hh = (p.h / 2) * Math.cos(s.phi);
    drawQuad(P, { cx: p.x + p.w / 2 + ox, cy: p.y + p.h / 2 + oy, hw: p.w / 2, hh, margin: blur * 1.2, uv: [0, 0, 1, 1] });
  }
  gl.uniform1i(u.uMode, 0);
  states.sort((a, b) => a.z - b.z);
  for (const s of states) {
    const p = s.p;
    const a = fadeBelow(s);
    if (a < 0.003) continue;
    gl.uniform1f(u.uAlpha, a);
    gl.bindTexture(gl.TEXTURE_2D, pieceTex[s.i]);
    drawQuad(P, { cx: p.x + p.w / 2, cy: p.y + p.h / 2, cz: s.z, hw: p.w / 2, hh: p.h / 2, phi: s.phi, margin: 36 });
  }

  // плитки логотипа (выше всего) — тень, затем плитка
  const tiles = [0, 1, 2, 3].map((i) => tileState(i, t, cam)).sort((a, b) => a.z - b.z);
  for (const s of tiles) {
    if (s.a < 0.003) continue;
    const blur = 7 + 0.5 * s.z;
    gl.uniform1i(u.uMode, 2);
    gl.uniform1f(u.uAlpha, 0.26 * s.a * (1 - 0.6 * smoother(0.2, 1.2, t) * (1 - smoother(9.5, 9.97, t))));
    gl.uniform1f(u.uShadowLod, Math.max(0, Math.log2(((blur * 512) / s.size) * 0.7)));
    gl.uniform2f(u.uShadowUV, blur / s.size, blur / s.size);
    gl.bindTexture(gl.TEXTURE_2D, tileTex);
    const hs = s.size / 2;
    drawQuad(P, { cx: s.x + 0.1 * s.z, cy: s.y + 4 + 0.36 * s.z, hw: hs, hh: hs * Math.cos(s.phi), psi: s.psi, margin: blur * 1.2 });
    gl.uniform1i(u.uMode, 0);
    gl.uniform1f(u.uAlpha, s.a);
    drawQuad(P, { cx: s.x, cy: s.y, cz: s.z, hw: hs, hh: hs, phi: s.phi, psi: s.psi, margin: 24 });
  }
  return cam;
}

/* ------------------------------------------------------------ титр */
const TITLE = { line1: "Доказать. Законно сказать.", line2: "Продать." };
function wordRise(x, start, t) {
  const k = clamp((t - start) / 0.34);
  const e = 1 - Math.pow(1 - k, 3);
  return { a: e, dy: 16 * (1 - e), blur: 12 * (1 - e) };
}
function drawTitle(t) {
  octx.clearRect(0, 0, W, H);
  if (t < 10.0) return;
  octx.textBaseline = "alphabetic";
  // бейдж: белая пилюля, эмблема + «Proba Lab», 21 px, y = 44
  {
    const w = wordRise(0, 10.02, t);
    octx.save();
    octx.globalAlpha = w.a;
    octx.filter = w.blur > 0.05 ? `blur(${w.blur.toFixed(2)}px)` : "none";
    octx.font = '500 21px "Geist", "Inter", sans-serif';
    const label = "Proba Lab";
    const tw = octx.measureText(label).width;
    const ph = 44, iw = 26, gap = 10, padX = 18;
    const pw = padX + iw + gap + tw + padX;
    const x0 = W / 2 - pw / 2, y0 = 44 + w.dy;
    octx.shadowColor = "rgba(26,33,51,0.10)"; octx.shadowBlur = 18; octx.shadowOffsetY = 4;
    octx.beginPath(); octx.roundRect(x0, y0, pw, ph, ph / 2); octx.fillStyle = "#ffffff"; octx.fill();
    octx.shadowColor = "transparent";
    const ar = emblemImg.height / emblemImg.width;
    octx.drawImage(emblemImg, x0 + padX, y0 + ph / 2 - (iw * ar) / 2, iw, iw * ar);
    octx.fillStyle = "#16171c";
    octx.fillText(label, x0 + padX + iw + gap, y0 + ph / 2 + 7.5);
    octx.restore();
  }
  const line = (text, font, color, baseline, start, step) => {
    octx.font = font;
    const words = text.split(" ");
    const space = octx.measureText(" ").width;
    const widths = words.map((w) => octx.measureText(w).width);
    let x = W / 2 - (widths.reduce((a, b) => a + b, 0) + space * (words.length - 1)) / 2;
    words.forEach((w, i) => {
      const r = wordRise(x, start + i * step, t);
      if (r.a > 0) {
        octx.save();
        octx.globalAlpha = r.a;
        octx.filter = r.blur > 0.05 ? `blur(${r.blur.toFixed(2)}px)` : "none";
        octx.fillStyle = color;
        octx.fillText(w, x, baseline + r.dy);
        octx.restore();
      }
      x += widths[i] + space;
    });
  };
  octx.letterSpacing = "-1.5px";
  line(TITLE.line1, '500 74px "Geist", "Inter", sans-serif', "#16171c", 170, 10.12, 0.06);
  octx.letterSpacing = "-0.5px";
  line(TITLE.line2, 'italic 400 82px "PT Serif", serif', "#8b8b92", 258, 10.36, 0.05);
  octx.letterSpacing = "0px";
}

/* ------------------------------------------------------------ кадр */
/** Кадр в момент t. sub — число подкадров для смаза движения (затвор 180°), taps — отсчёты DOF. */
export function seek(t, opts = {}) {
  const sub = opts.sub || 1, taps = opts.taps || 16, fps = opts.fps || 60;
  t = clamp(t, 0, DURATION);
  if (sub <= 1) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    drawScene(t, taps);
  } else {
    gl.bindFramebuffer(gl.FRAMEBUFFER, accFbo);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const shutter = 0.5 / fps;
    for (let k = 0; k < sub; k++) {
      const ts = clamp(t - shutter / 2 + (shutter * (k + 0.5)) / sub, 0, DURATION);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      drawScene(ts, taps);
      gl.bindFramebuffer(gl.FRAMEBUFFER, accFbo);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(progAccum.p);
      gl.bindVertexArray(fsVAO);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fboTex);
      gl.uniform1i(progAccum.u.uTex, 0);
      gl.uniform1f(progAccum.u.uGain, 1 / sub);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.BLEND);
    gl.useProgram(progAccum.p);
    gl.bindTexture(gl.TEXTURE_2D, accTex);
    gl.uniform1f(progAccum.u.uGain, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }
  drawTitle(t);
  if (opts.sync) gl.finish();
  return t;
}

/** Для проверки тайминга: камера и скорость скольжения в момент t. */
export function probe(t) {
  const c = camera(t);
  return { t, ty: c.ty, D: c.D, tilt: (c.tilt * 180) / Math.PI, eyeY: c.eye[1], eyeZ: c.eye[2], speed: speed(t), cruise: CRUISE };
}
