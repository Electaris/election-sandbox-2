import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { listDetailedStateManifests } from "../src/data/detailedStateManifest.ts";
import { DEFAULT_STATE_BEHAVIOR_SETTINGS } from "../src/data/scenarioPortfolio.ts";
import { DEFAULT_ELECTION_NIGHT_BEHAVIOR } from "../src/replay/threeStateElectionNight.ts";
import { THREE_STATE_NIGHT_PROTOCOL } from "../src/runtime/threeStateNightProtocol.ts";

test("queued playback ticks cannot resume a paused, reset, sought, or completed election night", async (t) => {
  const originalSelf = globalThis.self;
  const originalFetch = globalThis.fetch;
  t.after(() => {
    if (originalSelf === undefined) delete globalThis.self;
    else globalThis.self = originalSelf;
    globalThis.fetch = originalFetch;
  });
  let requestId = 0;
  const responses = new Map();
  globalThis.self = { postMessage: (response) => responses.get(response.requestId)(response) };
  globalThis.fetch = async (path) => ({
    ok: true,
    json: async () => JSON.parse(await readFile(new URL(`../public/${path}`, import.meta.url), "utf8")),
  });
  await import("../src/runtime/threeStateNight.worker.ts");
  const send = (message) => new Promise((resolve) => {
    const id = ++requestId;
    responses.set(id, (response) => {
      responses.delete(id);
      resolve(response);
    });
    self.onmessage({ data: { ...message, requestId: id, protocolVersion: THREE_STATE_NIGHT_PROTOCOL } });
  });
  const command = (value) => send({ type: "COMMAND", command: value });
  const ready = await send({
    type: "INITIALIZE",
    states: listDetailedStateManifests().map((manifest) => ({
      stateCode: manifest.code,
      loader: manifest.runtime.loader,
      artifactUrl: manifest.runtime.artifactPath,
      settings: DEFAULT_STATE_BEHAVIOR_SETTINGS,
    })),
    behavior: DEFAULT_ELECTION_NIGHT_BEHAVIOR,
  });
  assert.equal(ready.type, "READY", ready.message);
  await command({ type: "PLAY" });
  const advanced = await command({ type: "ADVANCE_LOGICAL_TIME", deltaMs: 180_000 });
  assert.equal(advanced.current.controller.status, "playing");
  assert.ok(advanced.current.controller.logicalReplayTimeMs > ready.current.controller.logicalReplayTimeMs);

  const stopped = command({ type: "PAUSE" });
  const queuedTick = command({ type: "ADVANCE_LOGICAL_TIME", deltaMs: 180_000 });
  const paused = await stopped;
  assert.equal(paused.current.controller.status, "paused");
  assert.deepEqual((await queuedTick).current, paused.current);

  for (const action of [
    { type: "RESET" },
    { type: "SEEK_PROGRESS", progressMillionths: 250_000 },
    { type: "SEEK_PROGRESS", progressMillionths: 1_000_000 },
  ]) {
    const endpoint = await command(action);
    const afterTick = await command({ type: "ADVANCE_LOGICAL_TIME", deltaMs: 180_000 });
    assert.deepEqual(afterTick.current, endpoint.current);
    if (action.progressMillionths === 1_000_000) {
      assert.equal(endpoint.current.controller.status, "complete");
      assert.equal(endpoint.current.election.national.totalReportedVotes, 16_145_836);
    }
  }
});
