import { majorPartyBands } from "../../map/atlasPalette";

/** Render the map's actual discrete colors, rather than an approximate gradient. */
export function AtlasMarginLegend() {
  const colors = [...[...majorPartyBands].reverse().map(band => band.dem), ...majorPartyBands.map(band => band.gop)];
  return <figure className="atlas-margin-legend" aria-label="Map winning margin key">
    <figcaption><span>Harris</span><span>Winning margin · percentage points</span><span>Trump</span></figcaption>
    <div className="atlas-margin-swatches" role="img" aria-label="Discrete margin bands on each side: under 1, 1–3, 3–5, 5–10, 10–15, 15–20, 20–30, 30–40, 40–50, 50–60, and 60 or more percentage points.">{colors.map((color, index) => <i key={index} style={{ backgroundColor: color }} />)}</div>
    <div className="atlas-margin-ticks" aria-hidden="true"><span>60+</span><span>Under 1</span><span>60+</span></div>
  </figure>;
}
