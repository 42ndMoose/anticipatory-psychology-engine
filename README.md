# Anticipatory Psychology Engine

A transparent, inspectable sandbox for comparing explicit psychologies.

## What this models

Each psychology is represented as:

- **Values**: weighted priorities for outcomes (e.g. truth accuracy, harm reduction, autonomy).
- **Beliefs**: anticipations about how conditions influence outcomes.
  - `effect`: direct directional judgement.
  - `strength`: reliability of the belief's past predictive performance.
  - `maturity`: how deeply the belief has been tested and refined.
  - `predicts`: expected effects on named outcomes.

Scenarios activate beliefs using condition IDs, then:

1. Computes confidence from strength × maturity.
2. Computes value-weighted prediction impact.
3. Produces an alignment score and verdict (`LIKE`, `DISLIKE`, `INVESTIGATE`).

## UI capabilities

- Switch active psychology and inspect its values.
- Evaluate all curated scenarios with transparent belief trace.
- Compare all psychologies side-by-side per scenario.
- Calibrate belief **strength** and **maturity** live.
- Run custom scenarios by selecting arbitrary condition combinations.

## Data layout

- `psychologies/*.json` — encoded psychology profiles.
- `scenarios.json` — shared scenarios with condition sets.
- `engine.js` — evaluation and rendering logic.
- `index.html` / `style.css` — app UI.

Runs as a static site (e.g. GitHub Pages).
