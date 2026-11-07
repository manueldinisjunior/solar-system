# Interactive Solar System

A responsive, interactive solar system explorer built with the Canvas 2D API and vanilla JavaScript. No installation or build process is required.

**Live site:** https://manueldinisjunior.github.io/solar-system/

## Features

- Drag to orbit the camera; scroll or pinch to zoom.
- Select the Sun or one of eight planets to see facts and orbital details.
- Change simulation speed, pause motion, and toggle orbital paths and labels.
- Use the keyboard-accessible planet menu and controls.
- Honors the operating system's reduced-motion preference by starting paused.

## Run locally

Open `index.html` in a browser, or use a local static server:

```bash
python3 -m http.server 8080
```

Visit http://localhost:8080/.

## Deployment

The `.github/workflows/pages.yml` workflow publishes the root directory to GitHub Pages on pushes to `main`. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. No API keys or server-side services are used.

## Notes

This is a visual educational simulation, not a scientifically scale-accurate orbital model. Planet sizes, distances, and orbital speeds are intentionally adjusted for usability. Planet/moon counts and other facts are illustrative and may change with new discoveries.

## Credits

The initial visual prototype was provided as an uploaded archive. The source HTML originally credited `@coding.stella`; that attribution is documented here and in `LICENSE-NOTICE.md` until provenance and licensing are confirmed. Do not assume this project grants redistribution rights to third-party code.

## Earth map and satellites

Earth uses a remotely loaded 2048px equirectangular image from the [three.js examples](https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg). It falls back to the original procedural rendering if the texture cannot load. Select Earth to see markers for the International Space Station (ISS), Hubble Space Telescope and a representative GPS satellite. Their orbits are illustrative, not real-time positions or scale-accurate trajectories. The texture requires an internet connection and is subject to the upstream image host's availability and licensing.

## Date and observer location

Open **Set date & location** to calculate planetary positions for a chosen local date/time and observer latitude/longitude. **Use my location** requests browser geolocation permission; coordinates are used locally and are not sent to this repository. The calculation uses [astronomy-engine](https://github.com/cosinekitty/astronomy) loaded on demand from esm.sh. The sky table reports topocentric altitude and azimuth (north = 0°, east = 90°), including whether each body is above the geometric horizon. Times in results are UTC. The canvas shows calculated heliocentric directions and Moon direction, but retains intentionally compressed orbital distances, planet sizes, and a freely rotatable camera. It is **not** a perspective-accurate sky view, a star chart, or a live satellite tracker. The original illustrative simulation remains available via **Simulation**. Offline use of this feature requires a locally hosted astronomy-engine bundle.
