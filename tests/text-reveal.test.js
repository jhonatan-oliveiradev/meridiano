import test from "node:test";
import assert from "node:assert/strict";
import { createTextReveal } from "../dist/text-reveal.js";
function clock() {
  const tasks = new Map();
  let id = 0;
  return {
    schedule(fn) {
      tasks.set(++id, fn);
      return id;
    },
    unschedule(key) {
      tasks.delete(key);
    },
    tick() {
      const [key, fn] = tasks.entries().next().value || [];
      if (fn) {
        tasks.delete(key);
        fn();
      }
    },
    drain() {
      for (let i = 0; tasks.size && i < 1000; i++) this.tick();
      assert.equal(tasks.size, 0);
    },
    get size() {
      return tasks.size;
    },
  };
}
test("reply reveals in order, keeps Unicode intact and completes once", () => {
  const c = clock(),
    first = { textContent: "" },
    second = { textContent: "" };
  let done = 0;
  const r = createTextReveal({
    schedule: c.schedule,
    unschedule: c.unschedule,
  });
  const text =
    "Composição do orçamento: ausência de transferências, políticas, previdência, déficit e serviços. Olá 🌍. ".repeat(
      12,
    );
  r.start(
    [
      { node: first, text },
      { node: second, text: "Próximo trimestre" },
    ],
    {
      onDone() {
        done++;
      },
    },
  );
  assert.ok(
    first.textContent.length > 0 && first.textContent.length < text.length,
  );
  assert.equal(second.textContent, "");
  assert.ok(!first.textContent.match(/[\uD800-\uDBFF]$/u));
  c.drain();
  assert.equal(first.textContent, text);
  assert.equal(second.textContent, "Próximo trimestre");
  assert.equal(done, 1);
  assert.equal(r.active, false);
});
test("show complete answer drains all content and cancels scheduled updates", () => {
  const c = clock(),
    node = { textContent: "" };
  let done = 0;
  const r = createTextReveal({
    schedule: c.schedule,
    unschedule: c.unschedule,
  });
  r.start([{ node, text: "Uma resposta extensa. ".repeat(80) }], {
    onDone() {
      done++;
    },
  });
  r.finish();
  r.finish();
  assert.equal(node.textContent, "Uma resposta extensa. ".repeat(80));
  assert.equal(done, 1);
  assert.equal(c.size, 0);
  assert.equal(r.active, false);
});
test("reduced motion reveals immediately with no timer", () => {
  const c = clock(),
    node = { textContent: "" };
  let done = 0;
  const r = createTextReveal({
    reducedMotion: () => true,
    schedule: c.schedule,
    unschedule: c.unschedule,
  });
  r.start([{ node, text: "Os dados do país." }], {
    onDone() {
      done++;
    },
  });
  assert.equal(node.textContent, "Os dados do país.");
  assert.equal(c.size, 0);
  assert.equal(done, 1);
});
test("new reply cancels the previous presentation; cancel does not overwrite later content", () => {
  const c = clock(),
    old = { textContent: "" },
    next = { textContent: "" };
  let oldDone = 0;
  const r = createTextReveal({
    schedule: c.schedule,
    unschedule: c.unschedule,
  });
  r.start([{ node: old, text: "Texto anterior. ".repeat(100) }], {
    onDone() {
      oldDone++;
    },
  });
  const partial = old.textContent;
  r.start([{ node: next, text: "Resposta atual" }]);
  c.drain();
  assert.equal(old.textContent, partial);
  assert.equal(oldDone, 0);
  assert.equal(next.textContent, "Resposta atual");
  r.start([{ node: next, text: "Outro texto. ".repeat(50) }]);
  r.cancel();
  const stopped = next.textContent;
  c.drain();
  assert.equal(next.textContent, stopped);
});
