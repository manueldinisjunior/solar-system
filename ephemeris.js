const toggle = document.getElementById("ephemerisToggle");
const fields = document.getElementById("ephemerisFields");
const form = document.getElementById("ephemerisForm");
const timeInput = document.getElementById("observationTime");
const latInput = document.getElementById("observerLat");
const lonInput = document.getElementById("observerLon");
const status = document.getElementById("ephemerisStatus");
const results = document.getElementById("ephemerisResults");
const names = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
const targets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
let astronomyPromise;

function setNow() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  timeInput.value = local.toISOString().slice(0, 16);
}
setNow();

toggle.addEventListener("click", () => {
  fields.hidden = !fields.hidden;
  toggle.setAttribute("aria-expanded", String(!fields.hidden));
  toggle.textContent = fields.hidden ? "Set date & location" : "Hide settings";
});
document.getElementById("useNow").addEventListener("click", setNow);
document.getElementById("exitEphemeris").addEventListener("click", () => {
  window.solarEphemeris = null;
  document.getElementById("captureSky").disabled = true;
  status.textContent = "Illustrative animation restored.";
  results.replaceChildren();
});
document.getElementById("useLocation").addEventListener("click", () => {
  if (!navigator.geolocation) {
    status.textContent = "Geolocation is not supported. Enter coordinates manually.";
    return;
  }
  status.textContent = "Waiting for location permission…";
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      latInput.value = coords.latitude.toFixed(5);
      lonInput.value = coords.longitude.toFixed(5);
      status.textContent = "Location received. Select Calculate.";
    },
    () => { status.textContent = "Location unavailable or permission denied. Enter coordinates manually."; },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
  );
});

function astronomyEngine() {
  // Lazy load: normal animation has no astronomy-library download cost.
  astronomyPromise ??= import("https://esm.sh/astronomy-engine@2.1.19");
  return astronomyPromise;
}
function formatAngle(value) { return value.toFixed(1) + "°"; }
function buildTable(rows) {
  const table = document.createElement("table");
  const caption = document.createElement("caption");
  caption.textContent = "Sky coordinates at the selected date and location";
  table.append(caption);
  const thead = table.createTHead();
  const header = thead.insertRow();
  ["Body", "Altitude", "Azimuth", "Visible above horizon"].forEach(label => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    header.append(th);
  });
  const tbody = table.createTBody();
  for (const row of rows) {
    const tr = tbody.insertRow();
    [row.name, formatAngle(row.altitude), formatAngle(row.azimuth), row.altitude > 0 ? "Yes" : "No"].forEach(value => {
      const td = tr.insertCell();
      td.textContent = value;
    });
  }
  results.replaceChildren(table);
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const date = new Date(timeInput.value);
  const latitude = Number(latInput.value);
  const longitude = Number(lonInput.value);
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    status.textContent = "Enter a valid date, latitude (−90 to 90) and longitude (−180 to 180).";
    return;
  }
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  status.textContent = "Calculating…";
  try {
    const A = await astronomyEngine();
    const observer = new A.Observer(latitude, longitude, 0);
    const rows = targets.map(name => {
      const eq = A.Equator(name, date, observer, true, true);
      const horizontal = A.Horizon(date, observer, eq.ra, eq.dec, "normal");
      return { name, altitude: horizontal.altitude, azimuth: horizontal.azimuth };
    });
    const positions = Object.fromEntries(names.map(name => {
      const vector = A.HelioVector(name, date);
      const norm = Math.hypot(vector.x, vector.y, vector.z);
      // Map true heliocentric directions onto existing illustrative display radii.
      return [name, { x: vector.x / norm, y: vector.z / norm, z: vector.y / norm }];
    }));
    const moon = A.GeoVector("Moon", date, true);
    const moonNorm = Math.hypot(moon.x, moon.y, moon.z);
    window.solarEphemeris = {
      date: date.toISOString(), positions,
      moonDirection: { x: moon.x / moonNorm, y: moon.z / moonNorm, z: moon.y / moonNorm }
    };
    buildTable(rows);
    document.getElementById("captureSky").disabled = false;
    status.textContent = "Calculated for " + date.toISOString().replace("T", " ").slice(0, 16) +
      " UTC · " + latitude.toFixed(4) + "°, " + longitude.toFixed(4) + "°.";
  } catch (error) {
    status.textContent = "Astronomy calculations could not load. Check your connection and retry.";
    console.error("Ephemeris unavailable:", error);
  } finally {
    submit.disabled = false;
  }
});

document.getElementById("captureSky").addEventListener("click", () => {
  const state = window.solarEphemeris;
  if (!state) return;
  const source = document.getElementById("space");
  const width = source.width;
  const height = source.height;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = width;
  exportCanvas.height = height;
  const context = exportCanvas.getContext("2d");
  context.drawImage(source, 0, 0);
  const dpr = width / source.clientWidth || 1;
  const pad = 22 * dpr;
  context.fillStyle = "rgba(5, 5, 8, 0.86)";
  context.fillRect(0, 0, width, 92 * dpr);
  context.fillStyle = "#fff";
  context.font = `${16 * dpr}px system-ui, sans-serif`;
  context.fillText("Solar System · calculated planetary positions", pad, 30 * dpr);
  context.font = `${12 * dpr}px system-ui, sans-serif`;
  context.fillStyle = "#c7c7ce";
  context.fillText(`${state.date.replace("T", " ").slice(0, 16)} UTC · Lat ${latInput.value}° · Lon ${lonInput.value}°`, pad, 55 * dpr);
  context.fillText("Illustrative 3D view · not a constellation chart", pad, 76 * dpr);
  exportCanvas.toBlob(blob => {
    if (!blob) { status.textContent = "Could not export the image."; return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `solar-system-${state.date.slice(0, 16).replace(/:/g, "-")}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
});
