# Slide-up dock adjustment

Date: 2026-10-12. Owner request: the bottom dock should work as it did before. Applied interpretation: restore the slide-up overlay drawer, its collapsed entry state, larger Working/Expanded presets, and original drag thresholds.

The shared Hybrid Premium header, analysis rail, navigation, map utilities, typography, and session state remain in place. The command drawer again slides over the workspace. A compact bottom strip is reserved so its collapsed controls remain reachable; opening the drawer does not shrink the map or change its camera. Desktop edges are inset with rounded upper corners; mobile uses a full-width sheet.

Working is approximately 42% of viewport height with the former 330 px desktop minimum. Expanded can reach approximately 75% of viewport height, bounded below the header. Dragging and keyboard resizing select Collapsed, Working, or Expanded. County/local links still open their inspector; ordinary entry starts collapsed. Playback, seek, and the drawer-state controls remain available on mobile. The explicit resize flag and preserved replay behavior from phase 1 remain intact.

This owner-requested adjustment supersedes phase 1's requirement that the command dock occupy a dedicated row at every height. The analysis rail and other persistent map information retain their new layout regions. The original phase 1 report and screenshots remain dated records of that implementation.

Final package: `b92313db3a44142da9400e05473f53de5013b0c94b2ea9e59c85ea2d164732a4`, version `0.30.0-rc.1`. The loopback preview at `http://127.0.0.1:4173/app/` serves this immutable package. Earlier packages remain preserved.

Validation: all seven shell cases passed in 3.9 minutes, covering six viewport sizes, fixed drawer positioning, no page overflow, stable map bounds and camera through drawer states, and keyboard/pointer/session behavior. The full Election Night desktop/mobile replay and Home cases both passed against the final package in 1.4 minutes. Production build/TypeScript, full lint, foundation retention, package/current-input verification, whitespace, and final HTTP checks passed. No election or replay calculation code changed.

Screenshots are under `screenshots/slide-up/`, with production captures in its `production/` subdirectory. Logs: `work/dock-restore-shell.log`, `dock-restore-replay.log`, `dock-restore-package.log`, and `dock-restore-lint.log`. The auxiliary diagnostic server was stopped; the final preview remains running.
