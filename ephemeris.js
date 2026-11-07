const toggle = document.getElementById("ephemerisToggle");
const fields = document.getElementById("ephemerisFields");
const form = document.getElementById("ephemerisForm");
const timeInput = document.getElementById("observationTime");
const cityInput = document.getElementById("citySearch");
const cityResults = document.getElementById("cityResults");
const selectedCity = document.getElementById("selectedCity");
const zodiacResult = document.getElementById("zodiacResult");
let city = null;
let cityRequest = 0;
let citySearchTimer;
let citySearchController;
const SIGN_DETAILS = {
  Aries: ["Fire", "initiative", "Your courage can open doors. Choose one meaningful step and give it your full attention."],
  Taurus: ["Earth", "steadiness", "May patience reward your efforts. Build something lasting, one careful decision at a time."],
  Gemini: ["Air", "curiosity", "Stay open to a new conversation. A fresh perspective may reveal an opportunity."],
  Cancer: ["Water", "care", "May you find comfort in the people and places that help you feel at home."],
  Leo: ["Fire", "creativity", "Let your work speak for you. Share an idea you believe in and make room for joy."],
  Virgo: ["Earth", "precision", "Trust the progress of small improvements. Your attention to detail is a strength."],
  Libra: ["Air", "balance", "May clarity guide your choices. Make time for both your ambitions and your peace."],
  Scorpio: ["Water", "determination", "Your persistence matters. Release what you cannot control and focus on what you can change."],
  Sagittarius: ["Fire", "exploration", "Keep learning and exploring. The next useful discovery may be closer than you think."],
  Capricorn: ["Earth", "discipline", "May your steady effort lead to worthwhile results. Give yourself credit for the distance travelled."],
  Aquarius: ["Air", "originality", "Make space for your own ideas. A practical experiment could lead somewhere interesting."],
  Pisces: ["Water", "imagination", "Protect your curiosity. Let a thoughtful idea become one real action today."]
};
function sunSign(date) {
  const value = (date.getMonth() + 1) * 100 + date.getDate();
  const starts = [[120,"Aquarius"],[219,"Pisces"],[321,"Aries"],[420,"Taurus"],[521,"Gemini"],[621,"Cancer"],[723,"Leo"],[823,"Virgo"],[923,"Libra"],[1023,"Scorpio"],[1122,"Sagittarius"],[1222,"Capricorn"]];
  return [...starts].reverse().find(([start]) => value >= start)?.[1] || "Capricorn";
}
function showZodiac(date) {
  const sign = sunSign(date);
  const [element, trait, wish] = SIGN_DETAILS[sign];
  zodiacResult.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = sign + " · Western zodiac Sun sign";
  const detail = document.createElement("p");
  detail.textContent = "Element: " + element + " · Associated quality: " + trait + ".";
  const message = document.createElement("p");
  message.textContent = wish;
  const note = document.createElement("small");
  note.textContent = "Based on calendar-date zodiac conventions, not an astronomical birth chart. Dates near sign boundaries may vary.";
  zodiacResult.append(heading, detail, message, note);
}
async function searchCities() {
  const query = cityInput.value.trim();
  if (query.length < 2) { status.textContent = "Enter at least two characters to find a city."; return; }
  const requestId = ++cityRequest;
  citySearchController?.abort();
  citySearchController = new AbortController();
  city = null;
  selectedCity.textContent = "Searching…";
  cityResults.replaceChildren();
  try {
    const response = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(query) + "&count=8&language=en&format=json", { signal: citySearchController.signal });
    if (!response.ok) throw new Error("Geocoding failed");
    const data = await response.json();
    if (requestId !== cityRequest) return;
    const locations = data.results || [];
    if (!locations.length) { selectedCity.textContent = "No matching city. Try a more specific name."; return; }
    selectedCity.textContent = "Select a city from the results:";
    for (const item of locations) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = [item.name, item.admin1, item.country].filter(Boolean).join(", ");
      button.addEventListener("click", () => {
        city = { latitude: item.latitude, longitude: item.longitude, label: button.textContent };
        cityInput.value = item.name;
        selectedCity.textContent = "Selected: " + city.label;
        cityResults.replaceChildren();
      });
      cityResults.append(button);
    }
  } catch (error) {
    if (error.name !== "AbortError" && requestId === cityRequest) selectedCity.textContent = "City search unavailable. Check your connection and retry.";
  }
}
document.getElementById("searchCity").addEventListener("click", () => {
  clearTimeout(citySearchTimer);
  searchCities();
});
cityInput.addEventListener("keydown", event => {
  if (event.key === "Enter") { event.preventDefault(); searchCities(); }
});
cityInput.addEventListener("input", () => {
  city = null;
  ++cityRequest;
  citySearchController?.abort();
  clearTimeout(citySearchTimer);
  selectedCity.textContent = "Select a city to continue.";
  cityResults.replaceChildren();
  if (cityInput.value.trim().length >= 2) citySearchTimer = setTimeout(searchCities, 350);
});
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
  zodiacResult.replaceChildren();
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
  if (!Number.isFinite(date.getTime()) || !city) {
    status.textContent = "Enter a valid date and select a city from search results.";
    return;
  }
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  status.textContent = "Calculating…";
  try {
    const A = await astronomyEngine();
    const observer = new A.Observer(city.latitude, city.longitude, 0);
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
    showZodiac(date);
    document.getElementById("captureSky").disabled = false;
    status.textContent = "Calculated for " + date.toISOString().replace("T", " ").slice(0, 16) +
      " UTC · " + city.label + ".";
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
  context.fillText("See Constellation · planetary positions", pad, 30 * dpr);
  context.font = `${12 * dpr}px system-ui, sans-serif`;
  context.fillStyle = "#c7c7ce";
  context.fillText(`${state.date.replace("T", " ").slice(0, 16)} UTC · ${city?.label || "Unknown location"}`, pad, 55 * dpr);
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
