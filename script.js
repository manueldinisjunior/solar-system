const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d");
let W, H, FOV;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  FOV = Math.min(W * 1.2, H) * 1.15;
  buildBackdrop(dpr);
}

// Background is painted once per resize on an offscreen canvas, then reused every frame
const backdrop = document.createElement("canvas");
function buildBackdrop(dpr) {
  backdrop.width = W * dpr;
  backdrop.height = H * dpr;
  const b = backdrop.getContext("2d");
  b.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = Math.max(W, H);

  b.fillStyle = "#050505";
  b.fillRect(0, 0, W, H);

  const washes = [
    [W * 0.5, H * 0.48, R * 0.7, "40,40,42", 0.55],
    [W * 0.1, H * 0.1, R * 0.5, "28,28,30", 0.4],
    [W * 0.92, H * 0.92, R * 0.5, "24,24,26", 0.4],
  ];
  for (const [x, y, r, rgb, a] of washes) {
    const g = b.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    b.fillStyle = g;
    b.fillRect(0, 0, W, H);
  }

  const v = b.createRadialGradient(W / 2, H / 2, R * 0.3, W / 2, H / 2, R * 0.8);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.55)");
  b.fillStyle = v;
  b.fillRect(0, 0, W, H);
}
window.addEventListener("resize", resize);
resize();

const UI = { text: "#ededef", muted: "#8a8a93", accent: "#f2b544" };

// ================== Data ==================
const deg = Math.PI / 180;

const SUN = {
  name: "Sun", type: "Star", radius: 40, color: "#f2b544",
  desc: "The star at the heart of our solar system. It holds 99.8% of all the mass in the solar system.",
  stats: { Diameter: "1,392,700 km", Age: "4.6 billion yrs", "Surface temp": "5,500 °C", "Core temp": "15 million °C", Type: "G-type star", "Light to Earth": "8 min 20 s" },
  fact: "About 1.3 million Earths could fit inside the Sun.",
  pos: { x: 0, y: 0, z: 0 },
};

const PLANETS = [
  {
    name: "Mercury", radius: 5, dist: 72, period: 0.24, incl: 7, color: "#9b9b9b",
    desc: "The smallest planet and the closest one to the Sun.",
    stats: { Diameter: "4,879 km", "From Sun": "57.9M km", Day: "59 Earth days", Year: "88 days", Moons: "0", Temp: "167 °C" },
    fact: "With almost no atmosphere, Mercury swings from -173 °C at night to 427 °C by day."
  },
  {
    name: "Venus", radius: 9, dist: 105, period: 0.62, incl: 3.4, color: "#d9bb8c",
    desc: "Earth's twin in size, wrapped in thick, toxic clouds of carbon dioxide.",
    stats: { Diameter: "12,104 km", "From Sun": "108.2M km", Day: "243 Earth days", Year: "225 days", Moons: "0", Temp: "464 °C" },
    fact: "Venus spins backwards, and its day is longer than its year."
  },
  {
    name: "Earth", radius: 9.5, dist: 145, period: 1, incl: 0, color: "#3d7bd9", land: true,
    desc: "Our home, and the only planet known to support life.",
    stats: { Diameter: "12,756 km", "From Sun": "149.6M km", Day: "24 hours", Year: "365.25 days", Moons: "1", Temp: "15 °C" },
    fact: "About 71% of Earth's surface is covered by water."
  },
  {
    name: "Mars", radius: 7, dist: 185, period: 1.88, incl: 1.85, color: "#c4583a",
    desc: "The Red Planet: dusty, cold and covered in iron oxide (rust).",
    stats: { Diameter: "6,792 km", "From Sun": "227.9M km", Day: "24.6 hours", Year: "687 days", Moons: "2", Temp: "-65 °C" },
    fact: "Mars has Olympus Mons, the tallest volcano in the solar system at about 22 km high."
  },
  {
    name: "Jupiter", radius: 22, dist: 290, period: 11.86, incl: 1.3, color: "#c9a57f", bands: ["#b38a63", "#ddc4a2"],
    desc: "The largest planet: a gas giant with storms bigger than Earth.",
    stats: { Diameter: "142,984 km", "From Sun": "778.5M km", Day: "9.9 hours", Year: "11.9 years", Moons: "95", Temp: "-110 °C" },
    fact: "The Great Red Spot is a storm that has been raging for over 350 years."
  },
  {
    name: "Saturn", radius: 18, dist: 370, period: 29.45, incl: 2.5, color: "#d8c393", bands: ["#c4ab78"], rings: "#cbb68a",
    desc: "Famous for its stunning ring system made of ice and rock.",
    stats: { Diameter: "120,536 km", "From Sun": "1.43B km", Day: "10.7 hours", Year: "29.4 years", Moons: "146", Temp: "-140 °C" },
    fact: "Saturn is so light that it would float in a (very big) bathtub of water."
  },
  {
    name: "Uranus", radius: 13, dist: 445, period: 84, incl: 0.8, color: "#93ccd3",
    desc: "An ice giant that rolls around the Sun on its side.",
    stats: { Diameter: "51,118 km", "From Sun": "2.87B km", Day: "17.2 hours", Year: "84 years", Moons: "28", Temp: "-195 °C" },
    fact: "Uranus is tilted 98°, so each pole gets 42 years of sunlight, then 42 years of darkness."
  },
  {
    name: "Neptune", radius: 12.5, dist: 510, period: 164.8, incl: 1.8, color: "#4a63d3",
    desc: "The windiest planet: dark, cold and very far away.",
    stats: { Diameter: "49,528 km", "From Sun": "4.5B km", Day: "16.1 hours", Year: "164.8 years", Moons: "16", Temp: "-200 °C" },
    fact: "Winds on Neptune reach 2,100 km/h, faster than the speed of sound on Earth."
  },
];

// Canvas shading for each body: [highlight, base, shadow]
const TONES = {
  Sun: ["#fff7c2", "#fbbf24", "#f97316"],
  Mercury: ["#d6d6d6", "#8c8c8c", "#4a4a4a"],
  Venus: ["#fbe3b5", "#d9a466", "#8a5a2b"],
  Earth: ["#9fd4ff", "#2f80ed", "#123a7a"],
  Mars: ["#ffb08a", "#d9572b", "#6e2510"],
  Jupiter: ["#f5dfc0", "#c99a6b", "#7a5230"],
  Saturn: ["#fff0c8", "#d9b878", "#8a6a35"],
  Uranus: ["#d8fbff", "#7fd6e0", "#2f8a99"],
  Neptune: ["#a9bcff", "#4a6cf7", "#1a2a8a"],
};
SUN.tones = TONES.Sun;

PLANETS.forEach(p => {
  p.tones = TONES[p.name];
  p.type = "Planet";
  p.angle = Math.random() * Math.PI * 2;
  p.speed = 0.5 / Math.sqrt(p.period); // inner planets move faster (not to scale)
  p.spin = 0;
});

const MOON = { angle: 0, dist: 18, radius: 2.6 };

// Asteroid belt between Mars and Jupiter
const ASTEROIDS = Array.from({ length: 400 }, () => ({
  r: 215 + Math.random() * 40,
  a: Math.random() * Math.PI * 2,
  y: (Math.random() - 0.5) * 8,
  speed: 0.08 + Math.random() * 0.05,
  size: Math.random() * 1.1 + 0.4,
}));

// ================== Galaxy background ==================
// Sky objects are directions on a unit sphere, so they rotate with the camera
const STAR_TINTS = ["#ffffff", "#ffffff", "#cfd8ff", "#ffe6c7", "#d9cbff"];
const NEBULA_COLORS = ["#8a8a8f", "#a3a3a8", "#6e6e73"];
const rand = () => Math.random();
const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5; // rough bell curve, -1..1
const pickFrom = arr => arr[Math.floor(rand() * arr.length)];

function normalize(v) {
  const l = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

// Milky Way plane: N is its normal, U and V span the band
const GAL_N = normalize({ x: 0.35, y: 1, z: 0.55 });
const GAL_U = normalize({ x: GAL_N.y, y: -GAL_N.x, z: 0 });
const GAL_V = {
  x: GAL_N.y * GAL_U.z - GAL_N.z * GAL_U.y,
  y: GAL_N.z * GAL_U.x - GAL_N.x * GAL_U.z,
  z: GAL_N.x * GAL_U.y - GAL_N.y * GAL_U.x,
};
function galaxyDir(theta, spread) {
  return normalize({
    x: GAL_U.x * Math.cos(theta) + GAL_V.x * Math.sin(theta) + GAL_N.x * spread,
    y: GAL_U.y * Math.cos(theta) + GAL_V.y * Math.sin(theta) + GAL_N.y * spread,
    z: GAL_U.z * Math.cos(theta) + GAL_V.z * Math.sin(theta) + GAL_N.z * spread,
  });
}

const STARS = Array.from({ length: 700 }, () => {
  const u = rand() * 2 - 1, t = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
  return { x: s * Math.cos(t), y: u, z: s * Math.sin(t), b: rand(), c: pickFrom(STAR_TINTS), tw: rand() * 6.28 };
});

// Milky Way band, denser around the galactic core (theta ~ 0)
for (let i = 0; i < 3200; i++) {
  const core = i < 900;
  const theta = core ? gauss() * 0.6 : rand() * Math.PI * 2;
  const d = galaxyDir(theta, gauss() * (core ? 0.16 : 0.1));
  STARS.push({ ...d, b: rand() * 0.7, c: pickFrom(STAR_TINTS), tw: rand() * 6.28, band: true });
}

// Nebula haze: many faint overlapping circles along the band
const NEBULA = [];
for (let c = 0; c < 9; c++) {
  const center = c === 0 ? 0 : rand() * Math.PI * 2;
  const color = c === 0 ? "#b0b0b5" : pickFrom(NEBULA_COLORS);
  for (let i = 0; i < (c === 0 ? 90 : 45); i++) {
    const d = galaxyDir(center + gauss() * 0.5, gauss() * 0.1);
    NEBULA.push({ ...d, r: 0.015 + rand() * 0.05, a: 0.004 + rand() * 0.008, color });
  }
}

let shooting = null, nextShoot = 3;

// ================== Camera ==================
const DEFAULT = { yaw: 0.6, pitch: 0.42, dist: 1350 };
const cam = { ...DEFAULT, tYaw: DEFAULT.yaw, tPitch: DEFAULT.pitch, tDist: DEFAULT.dist };
const target = { x: 0, y: 0, z: 0 };
let viewShift = 0;  // pushes the scene right when the info panel is open (desktop)
let viewShiftY = 0; // pushes it up instead on phones

function rotate(x, y, z) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const x1 = x * cy - z * sy;
  const z1 = x * sy + z * cy;
  return { x: x1, y: y * cp + z1 * sp, z: z1 * cp - y * sp };
}

// 3D world point -> 2D screen point (further away = smaller)
function project(p) {
  const r = rotate(p.x - target.x, p.y - target.y, p.z - target.z);
  const depth = r.z + cam.dist;
  if (depth < 5) return null;
  const s = FOV / depth;
  return { x: W / 2 + viewShift + r.x * s, y: H / 2 + viewShiftY - r.y * s, s, depth };
}

function orbitPoint(dist, angle, incl) {
  const z = dist * Math.sin(angle);
  return { x: dist * Math.cos(angle), y: z * Math.sin(incl * deg), z: z * Math.cos(incl * deg) };
}

// ================== State ==================
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let timeScale = 1, paused = prefersReducedMotion.matches, showOrbits = true, showLabels = true;
let selected = null, hovered = null;
let screenObjects = [];
let dragging = false, moved = false, lastX = 0, lastY = 0;

// ================== Drawing ==================
function circle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Stars are infinitely far away, so only camera rotation matters
function projectSky(d) {
  const r = rotate(d.x, d.y, d.z);
  if (r.z <= 0.05) return null;
  return { x: W / 2 + (r.x / r.z) * FOV * 0.5, y: H / 2 - (r.y / r.z) * FOV * 0.5, z: r.z };
}

function drawGalaxy(t, dt) {
  for (const n of NEBULA) {
    const p = projectSky(n);
    if (!p) continue;
    const r = (n.r * FOV) / p.z;
    if (p.x < -r || p.x > W + r || p.y < -r || p.y > H + r) continue;
    ctx.globalAlpha = n.a;
    circle(p.x, p.y, r, n.color);
  }

  for (const st of STARS) {
    const p = projectSky(st);
    if (!p || p.x < 0 || p.x > W || p.y < 0 || p.y > H) continue;
    const twinkle = 0.75 + 0.25 * Math.sin(t * 0.0015 + st.tw);
    ctx.globalAlpha = (st.band ? 0.3 + st.b * 0.6 : 0.15 + st.b * 0.55) * twinkle;
    ctx.fillStyle = st.c;
    const s = st.b > 0.93 ? 1.8 : 1.1;
    ctx.fillRect(p.x, p.y, s, s);
  }
  ctx.globalAlpha = 1;

  // Shooting star every 5-12 seconds
  nextShoot -= dt;
  if (!shooting && nextShoot <= 0) {
    const ang = (20 + rand() * 25) * deg * (rand() < 0.5 ? 1 : -1);
    shooting = { x: rand() * W, y: rand() * H * 0.4, vx: Math.cos(ang) * 900 * Math.sign(ang), vy: Math.abs(Math.sin(ang)) * 900, life: 0 };
    nextShoot = 5 + rand() * 7;
  }
  if (shooting) {
    const s = shooting;
    s.life += dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    const fade = Math.max(0, 1 - s.life / 0.8);
    ctx.strokeStyle = "#ffffff";
    ctx.lineCap = "round";
    for (let k = 0; k < 4; k++) {
      ctx.globalAlpha = fade * (0.7 - k * 0.16);
      ctx.lineWidth = 1.6 - k * 0.3;
      ctx.beginPath();
      ctx.moveTo(s.x - s.vx * 0.03 * k, s.y - s.vy * 0.03 * k);
      ctx.lineTo(s.x - s.vx * 0.03 * (k + 1), s.y - s.vy * 0.03 * (k + 1));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (fade <= 0) shooting = null;
  }
}

function drawOrbit(p) {
  const active = p === selected || p === hovered;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 160; i++) {
    const pt = project(orbitPoint(p.dist, (i / 160) * Math.PI * 2, p.incl));
    if (!pt) { started = false; continue; }
    started ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y);
    started = true;
  }
  ctx.strokeStyle = active ? "rgba(242,181,68,0.55)" : "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawSun(sp, t) {
  const r = SUN.radius * sp.s;
  const pulse = 1 + Math.sin(t * 0.002) * 0.04;
  const [c0, c1, c2] = SUN.tones;

  const glow = ctx.createRadialGradient(sp.x, sp.y, r * 0.5, sp.x, sp.y, r * 4.5 * pulse);
  glow.addColorStop(0, "rgba(255,200,80,0.5)");
  glow.addColorStop(0.3, "rgba(255,140,40,0.16)");
  glow.addColorStop(1, "rgba(255,100,20,0)");
  circle(sp.x, sp.y, r * 4.5 * pulse, glow);

  const g = ctx.createRadialGradient(sp.x - r * 0.3, sp.y - r * 0.3, r * 0.1, sp.x, sp.y, r);
  g.addColorStop(0, c0);
  g.addColorStop(0.5, c1);
  g.addColorStop(1, c2);
  ctx.shadowColor = c1;
  ctx.shadowBlur = 40 * sp.s;
  circle(sp.x, sp.y, r, g);
  ctx.shadowBlur = 0;

  if (SUN === selected || SUN === hovered) ring(sp.x, sp.y, r + 8, SUN === selected);
}

function ring(x, y, r, strong) {
  ctx.strokeStyle = strong ? UI.accent : "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}


// Real Earth imagery: the 2K equirectangular Earth texture from the three.js examples.
// Loaded once, only when available; the original procedural globe remains the fallback.
const earthTexture = new Image();
earthTexture.decoding = "async";
earthTexture.crossOrigin = "anonymous";
earthTexture.src = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
let earthTextureReady = false;
earthTexture.onload = () => { earthTextureReady = true; };
earthTexture.onerror = () => { earthTextureReady = false; };

// Cache a correctly projected globe instead of stretching the entire world map into strips.
const earthSourceCanvas = document.createElement("canvas");
const earthSourceContext = earthSourceCanvas.getContext("2d", { willReadFrequently: true });
const earthGlobeCanvas = document.createElement("canvas");
const earthGlobeContext = earthGlobeCanvas.getContext("2d");
let earthPixels = null;
let earthGlobeKey = "";
let earthMapUnavailable = false;

function prepareEarthMap() {
  if (!earthTextureReady || earthPixels || earthMapUnavailable) return;
  try {
    earthSourceCanvas.width = earthTexture.naturalWidth;
    earthSourceCanvas.height = earthTexture.naturalHeight;
    earthSourceContext.drawImage(earthTexture, 0, 0);
    earthPixels = earthSourceContext.getImageData(0, 0, earthSourceCanvas.width, earthSourceCanvas.height);
  } catch (error) {
    earthMapUnavailable = true;
    console.warn("Earth texture could not be read; using fallback.", error);
  }
}

function drawEarthTexture(x, y, r, spin) {
  prepareEarthMap();
  if (!earthPixels || r < 3) return false;
  const diameter = Math.min(256, Math.max(16, Math.round(r * 2)));
  const longitudeOffset = Math.round(spin * 0.04 * 180) / 180;
  const key = diameter + ":" + longitudeOffset;
  if (key !== earthGlobeKey) {
    earthGlobeCanvas.width = diameter;
    earthGlobeCanvas.height = diameter;
    const output = earthGlobeContext.createImageData(diameter, diameter);
    const src = earthPixels.data;
    const sw = earthPixels.width, sh = earthPixels.height;
    const dst = output.data;
    for (let py = 0; py < diameter; py++) {
      const ny = 1 - 2 * (py + 0.5) / diameter;
      for (let px = 0; px < diameter; px++) {
        const nx = 2 * (px + 0.5) / diameter - 1;
        const rr = nx * nx + ny * ny;
        if (rr > 1) continue;
        // Inverse orthographic projection: preserve both latitude and longitude.
        const nz = Math.sqrt(1 - rr);
        const latitude = Math.asin(ny);
        const longitude = Math.atan2(nx, nz);
        const u = ((0.5 + longitude / (2 * Math.PI) + longitudeOffset) % 1 + 1) % 1;
        const sx = Math.min(sw - 1, Math.floor(u * sw));
        const sy = Math.min(sh - 1, Math.floor((0.5 - latitude / Math.PI) * sh));
        const si = (sy * sw + sx) * 4;
        const di = (py * diameter + px) * 4;
        dst[di] = src[si]; dst[di + 1] = src[si + 1]; dst[di + 2] = src[si + 2]; dst[di + 3] = 255;
      }
    }
    earthGlobeContext.putImageData(output, 0, 0);
    earthGlobeKey = key;
  }
  ctx.drawImage(earthGlobeCanvas, x - r, y - r, r * 2, r * 2);
  return true;
}

function drawPlanet(p, pp, sunScreen) {
  const r = Math.max(p.radius * pp.s, 1.5);
  const { x, y } = pp;

  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();

  const [c0, c1, c2] = p.tones;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, c0);
  g.addColorStop(0.55, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);

  // Gas giant bands
  if (p.bands) {
    const rows = [-0.62, -0.3, 0.05, 0.38, 0.68];
    ctx.globalAlpha = 0.55;
    rows.forEach((row, i) => {
      ctx.fillStyle = p.bands[i % p.bands.length];
      ctx.fillRect(x - r, y + row * r, r * 2, r * (i % 2 ? 0.14 : 0.2));
    });
    ctx.globalAlpha = 1;
    if (p.name === "Jupiter") { // Great Red Spot
      const sx = x - r * 1.5 + ((p.spin * r * 0.6) % (r * 3));
      ctx.fillStyle = "rgba(190,80,50,0.8)";
      ctx.beginPath(); ctx.ellipse(sx, y + r * 0.22, r * 0.2, r * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Real mapped globe when the image is ready; graceful offline fallback.
  if (p.land && !drawEarthTexture(x, y, r, p.spin)) {
    ctx.fillStyle = "rgba(76,175,80,0.85)";
    const shift = (p.spin * r * 0.5) % (r * 4);
    for (const [ox, oy, rx, ry] of [[-0.5, -0.2, 0.35, 0.45], [0.6, 0.15, 0.3, 0.35], [1.6, -0.3, 0.4, 0.3], [2.6, 0.3, 0.3, 0.4]]) {
      const cx = x - r * 2 + ((ox * r + shift + r * 4) % (r * 4));
      ctx.beginPath(); ctx.ellipse(cx, y + oy * r, rx * r, ry * r, 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(x - r, y - r, r * 2, r * 0.18);
    ctx.fillRect(x - r, y + r * 0.85, r * 2, r * 0.2);
  }

  // Night side: darken the half facing away from the Sun
  let dx = sunScreen.x - x, dy = sunScreen.y - y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  const shade = ctx.createRadialGradient(x + dx * r * 0.6, y + dy * r * 0.6, r * 0.2, x + dx * r * 0.4, y + dy * r * 0.4, r * 1.6);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(0.55, "rgba(0,0,10,0.45)");
  shade.addColorStop(1, "rgba(0,0,10,0.92)");
  ctx.fillStyle = shade;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();

  // Atmosphere rim
  if (p.land || ["Venus", "Uranus", "Neptune"].includes(p.name)) {
    ctx.strokeStyle = p.land ? "rgba(120,190,255,0.5)" : "rgba(200,220,255,0.25)";
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath(); ctx.arc(x, y, r * 1.02, 0, Math.PI * 2); ctx.stroke();
  }

  if (p === selected || p === hovered) ring(x, y, r * (p.rings ? 2.5 : 1) + 7, p === selected);
}

// Saturn's rings are drawn in two halves (back, then front) so the planet sits inside them
function drawRings(p, pp, half) {
  const tilt = 27 * deg;
  const bands = [[1.4, 0.35], [1.65, 0.7], [1.9, 0.55], [2.15, 0.3]];
  ctx.strokeStyle = p.rings;
  for (const [mult, alpha] of bands) {
    const rr = p.radius * mult;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    let drawing = false;
    for (let i = 0; i <= 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      const lz = rr * Math.sin(a);
      const sp = project({ x: p.pos.x + rr * Math.cos(a), y: p.pos.y + lz * Math.sin(tilt), z: p.pos.z + lz * Math.cos(tilt) });
      const isFront = sp && sp.depth < pp.depth;
      if (!sp || (half === "front") !== isFront) { drawing = false; continue; }
      drawing ? ctx.lineTo(sp.x, sp.y) : ctx.moveTo(sp.x, sp.y);
      drawing = true;
    }
    ctx.lineWidth = Math.max(1, p.radius * 0.2 * pp.s);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawRock(sp, a) {
  const size = Math.min(a.size * sp.s * 0.9, 2);
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, Math.max(size, 0.5), 0, Math.PI * 2);
  ctx.fill();
}

function drawLabel(text, x, y, active) {
  ctx.font = `500 ${active ? 12 : 11}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = active ? UI.text : UI.muted;
  ctx.fillText(text, x, y);
}

// ================== Main loop ==================
let last = performance.now();

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const step = paused ? 0 : dt * timeScale;

  PLANETS.forEach(p => {
    p.angle += p.speed * step;
    p.spin += step * 3;
    const ephemerisDirection = window.solarEphemeris?.positions?.[p.name];
    p.pos = ephemerisDirection
      ? { x: ephemerisDirection.x * p.dist, y: ephemerisDirection.y * p.dist, z: ephemerisDirection.z * p.dist }
      : orbitPoint(p.dist, p.angle, p.incl);
  });
  const earth = PLANETS[2];
  MOON.angle += step * 4;
  const moonDir = window.solarEphemeris?.moonDirection;
  MOON.pos = moonDir
    ? { x: earth.pos.x + moonDir.x * MOON.dist, y: earth.pos.y + moonDir.y * MOON.dist, z: earth.pos.z + moonDir.z * MOON.dist }
    : {
        x: earth.pos.x + Math.cos(MOON.angle) * MOON.dist,
        y: earth.pos.y + Math.sin(MOON.angle) * 3,
        z: earth.pos.z + Math.sin(MOON.angle) * MOON.dist,
      };
  ASTEROIDS.forEach(a => (a.a += a.speed * step));

  // Ease the camera toward its targets for smooth movement
  if (!dragging && !selected && !paused) cam.tYaw += dt * 0.03; // slow auto-rotate
  cam.yaw += (cam.tYaw - cam.yaw) * 0.1;
  cam.pitch += (cam.tPitch - cam.pitch) * 0.1;
  // Responsive, frame-rate-independent easing without the long trailing zoom lag.
  const zoomEase = 1 - Math.exp(-Math.min(dt, 0.05) * 15);
  cam.dist += (cam.tDist - cam.dist) * zoomEase;
  const focus = selected ? selected.pos : SUN.pos;
  target.x += (focus.x - target.x) * 0.08;
  target.y += (focus.y - target.y) * 0.08;
  target.z += (focus.z - target.z) * 0.08;
  viewShift += ((selected && W > 760 ? 160 : 0) - viewShift) * 0.08;
  viewShiftY += ((selected && W <= 760 ? -H * 0.22 : 0) - viewShiftY) * 0.08;

  ctx.drawImage(backdrop, 0, 0, W, H);
  drawGalaxy(now, dt);
  // Schematic circular paths do not represent the calculated ephemeris.
  if (showOrbits && !window.solarEphemeris) PLANETS.forEach(drawOrbit);

  const sunScreen = project(SUN.pos) || { x: W / 2, y: H / 2, s: 0, depth: 1e9 };

  // Asteroids behind the Sun are drawn now, the ones in front right after the Sun
  const front = [];
  ctx.fillStyle = "#6e6a63";
  for (const a of ASTEROIDS) {
    const sp = project({ x: a.r * Math.cos(a.a), y: a.y, z: a.r * Math.sin(a.a) });
    if (!sp) continue;
    if (sp.depth < sunScreen.depth) { front.push(sp, a); continue; }
    drawRock(sp, a);
  }

  // Draw far -> near so closer bodies cover the ones behind
  const bodies = [{ obj: SUN, sp: sunScreen }];
  PLANETS.forEach(p => { const sp = project(p.pos); if (sp) bodies.push({ obj: p, sp }); });
  const moonSp = project(MOON.pos);
  if (moonSp) bodies.push({ obj: MOON, sp: moonSp });
  bodies.sort((a, b) => b.sp.depth - a.sp.depth);

  screenObjects = [];
  for (const { obj, sp } of bodies) {
    if (obj === SUN) {
      drawSun(sp, now);
      ctx.fillStyle = "#6e6a63";
      for (let i = 0; i < front.length; i += 2) drawRock(front[i], front[i + 1]);
    } else if (obj === MOON) {
      const mr = Math.max(MOON.radius * sp.s, 1);
      const mg = ctx.createRadialGradient(sp.x - mr * 0.3, sp.y - mr * 0.3, 0, sp.x, sp.y, mr);
      mg.addColorStop(0, "#f0f0f0");
      mg.addColorStop(1, "#6b6b6b");
      circle(sp.x, sp.y, mr, mg);
      continue;
    } else {
      if (obj.rings) drawRings(obj, sp, "back");
      drawPlanet(obj, sp, sunScreen);
      if (obj.rings) drawRings(obj, sp, "front");
    }
    screenObjects.push({ obj, x: sp.x, y: sp.y, r: obj.radius * sp.s, depth: sp.depth });
  }


  // Labels: active first, then nearest; skip any that would overlap another
  if (showLabels) {
    const isActive = o => o.obj === selected || o.obj === hovered;
    const placed = [];
    const order = [...screenObjects].sort((a, b) => isActive(b) - isActive(a) || a.depth - b.depth);
    for (const o of order) {
      ctx.font = "500 11px Inter, system-ui, sans-serif";
      const ly = o.y - o.r * (o.obj.rings ? 1.5 : 1) - 12;
      const w = ctx.measureText(o.obj.name).width + 8;
      const box = { x1: o.x - w / 2, x2: o.x + w / 2, y1: ly - 12, y2: ly + 3 };
      if (placed.some(b => box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1)) continue;
      placed.push(box);
      drawLabel(o.obj.name, o.x, ly, isActive(o));
    }
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ================== Interaction ==================
const pointers = new Map();
let pinchDist = 0;

function pick(x, y) {
  // screenObjects is far -> near, so check from the end to hit the nearest first
  for (let i = screenObjects.length - 1; i >= 0; i--) {
    const o = screenObjects[i];
    if (Math.hypot(x - o.x, y - o.y) < Math.max(o.r, 6) + 8) return o.obj;
  }
  return null;
}

canvas.addEventListener("pointerdown", e => {
  pointers.set(e.pointerId, e);
  canvas.setPointerCapture(e.pointerId);
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }
  dragging = true; moved = false;
  lastX = e.clientX; lastY = e.clientY;
  hideHint();
});

canvas.addEventListener("pointermove", e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e);

  // Two fingers = pinch zoom
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (pinchDist && d > 0) zoom(Math.pow(pinchDist / d, 0.85));
    pinchDist = d; moved = true;
    return;
  }

  if (dragging) {
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    cam.tYaw -= dx * 0.005;
    cam.tPitch = Math.max(-1.45, Math.min(1.45, cam.tPitch + dy * 0.005));
    lastX = e.clientX; lastY = e.clientY;
    canvas.classList.toggle("dragging", moved);
  } else {
    hovered = pick(e.clientX, e.clientY);
    canvas.classList.toggle("pointer", !!hovered);
  }
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size > 0) return;
  if (dragging && !moved) { // a tap, not a drag
    const hit = pick(e.clientX, e.clientY);
    if (hit) select(hit);
  }
  dragging = false; pinchDist = 0;
  canvas.classList.remove("dragging");
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

function zoom(factor) {
  cam.tDist = Math.max(60, Math.min(3000, cam.tDist * factor));
}
canvas.addEventListener("wheel", e => {
  e.preventDefault();
  // Normalize wheel units (pixels / lines / pages) and avoid large jumps.
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1;
  const delta = Math.max(-100, Math.min(100, e.deltaY * unit));
  zoom(Math.exp(delta * 0.00065));
  hideHint();
}, { passive: false });

// ================== UI ==================
const info = document.getElementById("info");
const bar = document.getElementById("planetBar");
const ALL = [SUN, ...PLANETS];

ALL.forEach(o => {
  const b = document.createElement("button");
  b.className = "chip";
  b.type = "button";
  b.setAttribute("aria-pressed", "false");
  b.innerHTML = `<i style="background:${o.color}"></i>${o.name}`;
  b.addEventListener("click", () => select(o));
  o.chip = b;
  bar.appendChild(b);
});

function select(o) {
  selected = o;
  cam.tDist = o === SUN ? 520 : o.radius * 12 + 120;
  ALL.forEach(p => {
    p.chip.classList.toggle("active", p === o);
    p.chip.setAttribute("aria-pressed", String(p === o));
  });
  o.chip.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", inline: "center", block: "nearest" });

  document.getElementById("infoDot").style.background = o.color;
  document.getElementById("infoType").textContent = o.type;
  document.getElementById("infoName").textContent = o.name;
  document.getElementById("infoDesc").textContent = o.desc;
  document.getElementById("infoFact").textContent = o.fact;
  document.getElementById("infoStats").innerHTML = Object.entries(o.stats)
    .map(([k, v]) => `<div class="stat"><dt>${k}</dt><dd>${v}</dd></div>`)
    .join("");
  info.classList.add("show");
  info.setAttribute("aria-hidden", "false");
}

function deselect() {
  selected = null;
  cam.tDist = DEFAULT.dist;
  info.classList.remove("show");
  info.setAttribute("aria-hidden", "true");
  ALL.forEach(p => { p.chip.classList.remove("active"); p.chip.setAttribute("aria-pressed", "false"); });
}

document.getElementById("closeInfo").addEventListener("click", deselect);
document.addEventListener("keydown", e => { if (e.key === "Escape") deselect(); });

const speedInput = document.getElementById("speed");
const speedVal = document.getElementById("speedVal");
speedInput.addEventListener("input", () => {
  timeScale = +speedInput.value;
  speedVal.textContent = timeScale.toFixed(1) + "×";
});

const ICONS = {
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" /></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z" /></svg>',
};
const pauseBtn = document.getElementById("pauseBtn");
function syncPlaybackControl() {
  pauseBtn.innerHTML = paused ? ICONS.play : ICONS.pause;
  pauseBtn.title = paused ? "Resume animation" : "Pause animation";
  pauseBtn.setAttribute("aria-label", pauseBtn.title);
  pauseBtn.setAttribute("aria-pressed", String(paused));
}
syncPlaybackControl();
pauseBtn.addEventListener("click", () => {
  paused = !paused;
  syncPlaybackControl();
});

const orbitBtn = document.getElementById("orbitBtn");
orbitBtn.addEventListener("click", () => { showOrbits = !showOrbits; orbitBtn.classList.toggle("on", showOrbits); orbitBtn.setAttribute("aria-pressed", String(showOrbits)); });

const labelBtn = document.getElementById("labelBtn");
labelBtn.addEventListener("click", () => { showLabels = !showLabels; labelBtn.classList.toggle("on", showLabels); labelBtn.setAttribute("aria-pressed", String(showLabels)); });

document.getElementById("resetBtn").addEventListener("click", () => {
  deselect();
  cam.tYaw = DEFAULT.yaw; cam.tPitch = DEFAULT.pitch; cam.tDist = DEFAULT.dist;
  speedInput.value = "1"; timeScale = 1; speedVal.textContent = "1.0×";
});

const hint = document.getElementById("hint");
if (matchMedia("(pointer: coarse)").matches) hint.textContent = "Drag to rotate · Pinch to zoom · Tap a planet";
function hideHint() { hint.classList.add("hide"); }
setTimeout(hideHint, 7000);
