# v0.27C verification: Comparison and polish

Date: 2026-08-24

## Release boundary

This gate verifies the certified-versus-scenario contribution comparison, candidate-complete inspector copy, ranked-list keyboard movement, selection handoff, and narrow-screen layout.

## Focused results

- 16 of 16 scenario delta, explanation, and contribution-comparison tests pass.
- 5 of 5 focused third-party browser journeys pass.
- The Stein-leading comparison shows certified Trump structure and modeled Stein structure against their respective runner-up.
- A geography row opens the existing inspector, where certified plurality, scenario plurality, and the H-T diagnostic are distinct.
- Arrow-key focus movement works inside ranked geography lists.
- At 390 by 844, the comparison uses one column and produces no document-level horizontal overflow.
- ESLint passes.
- TypeScript and the Vite production build pass.

## Aggregate result

- 231 of 231 aggregate model, replay, and analytics tests pass.
- Aggregate duration: 1,117,919.578 ms.
- Frozen Pennsylvania, Michigan, national composition, reducer, seek, playback, and reported-analytics outputs remain unchanged.

## Accepted warning

The existing Vite chunk-size warning remains. deck.gl is lazy-loaded and remains the sole production map renderer.
