import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../dist/model.js";
import { snapshotOf } from "../dist/advisor.js";
import {
  validateRequest,
  generateAdvice,
  validateResponse,
  AdvisorError,
} from "../server/advisor.js";
import handler, { takeQuota, sameOrigin } from "../api/advisor.js";
const request = () =>
  validateRequest({ mode: "analysis", snapshot: snapshotOf(initialState()) });
const answer = {
  title: "Dívida em alta",
  summary: "O orçamento tem déficit.",
  observations: [
    { heading: "Financiamento", detail: "A despesa supera a receita." },
  ],
  tradeoffs: ["A dívida absorve o déficit."],
  nextSteps: ["Compare outra alíquota."],
};
const ok = () =>
  new Response(
    JSON.stringify({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(answer) }] },
        },
      ],
    }),
    { status: 200 },
  );
function res() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(v) {
      this.body = v;
      return this;
    },
  };
}
const baseReq = () => ({
  method: "POST",
  headers: {
    origin: "https://meridiano.example",
    host: "meridiano.example",
    "content-type": "application/json",
    "x-meridiano-client": "1",
  },
  body: { mode: "analysis", snapshot: snapshotOf(initialState()) },
});
test("only allowlisted fields are sent; bounded numeric scenario required", () => {
  let data = baseReq().body;
  data.snapshot.secret = "do not send";
  assert.ok(!("secret" in validateRequest(data).snapshot));
  data.snapshot.metrics.gdp = NaN;
  assert.throws(() => validateRequest(data), AdvisorError);
  data = baseReq().body;
  data.snapshot.policies.income = 900;
  assert.throws(() => validateRequest(data));
  assert.throws(() =>
    validateRequest({
      mode: "question",
      question: "x".repeat(601),
      snapshot: snapshotOf(initialState()),
    }),
  );
});
test("Gemini uses server header, fixed endpoint, structured JSON and computed budget", async () => {
  let called;
  const result = await generateAdvice(request(), {
    apiKey: "test-only",
    fetcher: async (url, opts) => {
      called = { url, opts };
      return ok();
    },
  });
  assert.equal(result.answer.title, answer.title);
  assert.equal(called.opts.headers["x-goog-api-key"], "test-only");
  assert.ok(!called.url.includes("test-only"));
  const payload = JSON.parse(called.opts.body);
  assert.equal(payload.generationConfig.responseMimeType, "application/json");
  assert.equal(payload.generationConfig.temperature, 0.25);
  assert.ok(payload.contents[0].parts[0].text.includes("balance"));
});
test("no key makes no network call and preserves simulation", async () => {
  let called = false;
  await assert.rejects(
    generateAdvice(request(), {
      fetcher: () => {
        called = true;
      },
    }),
    (e) => e.status === 503 && e.code === "NOT_CONFIGURED",
  );
  assert.equal(called, false);
});
test("provider rate limit and timeout produce safe errors", async () => {
  await assert.rejects(
    generateAdvice(request(), {
      apiKey: "fake",
      fetcher: async () =>
        new Response("secret provider debug", { status: 429 }),
    }),
    (e) => e.status === 429 && !e.message.includes("secret"),
  );
  await assert.rejects(
    generateAdvice(request(), {
      apiKey: "fake",
      fetcher: async () => {
        throw Error("sensitive backend details");
      },
    }),
    (e) => e.status === 504 && !e.message.includes("sensitive"),
  );
});
test("malformed/truncated model output is rejected; strings remain plain data", async () => {
  assert.throws(() =>
    validateResponse({
      ...answer,
      observations: [{ heading: "x", detail: 42 }],
    }),
  );
  const input = { ...answer, summary: "<script>unsafe()</script>" };
  assert.equal(validateResponse(input).summary, input.summary);
  await assert.rejects(
    generateAdvice(request(), {
      apiKey: "fake",
      fetcher: async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                finishReason: "MAX_TOKENS",
                content: { parts: [{ text: JSON.stringify(answer) }] },
              },
            ],
          }),
        ),
    }),
    (e) => e.code === "INVALID_RESPONSE",
  );
});
test("handler rejects cross-origin, wrong method and oversized input", async () => {
  let r = res();
  await handler(
    {
      ...baseReq(),
      headers: { ...baseReq().headers, origin: "https://elsewhere.example" },
    },
    r,
  );
  assert.equal(r.statusCode, 403);
  r = res();
  await handler({ ...baseReq(), method: "DELETE" }, r);
  assert.equal(r.statusCode, 405);
  r = res();
  await handler(
    {
      ...baseReq(),
      headers: { ...baseReq().headers, "content-length": "99999" },
    },
    r,
  );
  assert.equal(r.statusCode, 413);
  assert.equal(
    sameOrigin({ headers: { origin: "not a url", host: "example" } }),
    false,
  );
});
test("status reports availability without exposing a key", async () => {
  const old = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = "test-key-never-return";
    const r = res();
    await handler({ method: "GET", headers: {} }, r);
    assert.deepEqual(r.body, { available: true });
    assert.ok(!JSON.stringify(r.body).includes("test-key"));
  } finally {
    if (old === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = old;
  }
});
test("quota is bounded per identity and resets", () => {
  const t = Date.now();
  for (let i = 0; i < 4; i++) assert.equal(takeQuota("test-ip", t), true);
  assert.equal(takeQuota("test-ip", t), false);
  assert.equal(takeQuota("test-ip", t + 61000), true);
});
