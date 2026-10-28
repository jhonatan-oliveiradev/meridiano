import test from "node:test";
import assert from "node:assert/strict";
import {
  readTutorial,
  moveTutorial,
  placeCoach,
  tutorialSteps,
} from "../dist/onboarding-model.js";

test("tutorial resumes skipped progress, completes only at the final step and can restart", () => {
  let p = readTutorial(null);
  assert.deepEqual(p, { version: 1, index: 0, status: "new" });
  p = moveTutorial(p, "next");
  p = moveTutorial(p, "next");
  p = moveTutorial(p, "skip");
  assert.equal(p.status, "paused");
  assert.equal(readTutorial(JSON.stringify(p)).index, 2);
  p = moveTutorial(p, "back");
  assert.equal(p.index, 1);
  assert.equal(p.status, "active");
  for (let i = 0; i < tutorialSteps.length; i++) p = moveTutorial(p, "next");
  assert.equal(p.status, "completed");
  assert.equal(p.index, tutorialSteps.length - 1);
  assert.equal(moveTutorial(p, "restart").index, 0);
});
test("corrupt, incompatible and out of bounds tutorial data cannot skip onboarding", () => {
  for (const raw of [
    "no",
    "null",
    "[]",
    '{"version":2}',
    '{"version":1,"index":99,"status":"completed"}',
    '{"version":1,"index":-1,"status":"active"}',
  ]) {
    assert.equal(readTutorial(raw).status, "new");
    assert.equal(readTutorial(raw).index, 0);
  }
});
test("coach fits narrow and short viewports and chooses a free side of the target", () => {
  const top = placeCoach(
    { left: 100, top: 30, right: 240, bottom: 70 },
    900,
    700,
    340,
    240,
  );
  assert.ok(top.y >= 70);
  const bottom = placeCoach(
    { left: 100, top: 620, right: 240, bottom: 670 },
    900,
    700,
    340,
    240,
  );
  assert.ok(bottom.y + bottom.height <= 620);
  for (const [w, h] of [
    [390, 844],
    [320, 568],
    [844, 390],
    [280, 260],
  ]) {
    const p = placeCoach(
      { left: 0, top: 0, right: w, bottom: h },
      w,
      h,
      340,
      280,
    );
    assert.ok(p.x >= 12 && p.y >= 12);
    assert.ok(p.x + p.width <= w - 12);
    assert.ok(p.y + p.height <= h - 12);
  }
});
