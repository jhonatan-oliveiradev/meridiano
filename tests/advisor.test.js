import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../dist/model.js";
import { snapshotOf } from "../dist/advisor.js";
import {
  validateRequest,
  generateAdvice,
  validateResponse,
  AdvisorError,
  DEFAULT_MODEL,
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
    (e) =>
      e.status === 502 &&
      e.code === "PROVIDER_NETWORK" &&
      !e.message.includes("sensitive"),
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
    assert.deepEqual(r.body, {
      available: true,
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    });
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
test("provider failures distinguish key, permission, request, quota and unavailable model without raw details", async () => {
  for (const [status, detail, code] of [
    [
      400,
      {
        message: "API key not valid. secret",
        details: [{ reason: "API_KEY_INVALID" }],
      },
      "PROVIDER_KEY",
    ],
    [403, { message: "permission denied secret" }, "PROVIDER_ACCESS"],
    [
      400,
      { message: "unknown generation property secret" },
      "PROVIDER_REQUEST",
    ],
    [404, { message: "model not found secret" }, "MODEL_UNAVAILABLE"],
    [429, { message: "secret quota metadata" }, "PROVIDER_LIMIT"],
  ]) {
    let calls = 0;
    await assert.rejects(
      generateAdvice(request(), {
        apiKey: "fake",
        fetcher: async () => {
          calls++;
          return new Response(JSON.stringify({ error: detail }), { status });
        },
      }),
      (e) => e.code === code && !e.message.includes("secret"),
    );
    assert.equal(calls, 1);
  }
});
test("legacy model unavailability migrates once; key and quota do not cause model hopping", async () => {
  const models = [];
  const result = await generateAdvice(request(), {
    apiKey: "fake",
    model: "gemini-2.5-flash-lite",
    fetcher: async (url) => {
      models.push(url);
      return models.length === 1
        ? new Response(
            JSON.stringify({ error: { message: "model not found" } }),
            { status: 404 },
          )
        : ok();
    },
  });
  assert.equal(models.length, 2);
  assert.ok(models[1].includes(DEFAULT_MODEL));
  assert.equal(result.model, DEFAULT_MODEL);
  let calls = 0;
  await assert.rejects(
    generateAdvice(request(), {
      apiKey: "fake",
      model: "gemini-2.5-flash-lite",
      fetcher: async () => {
        calls++;
        return new Response("{}", { status: 429 });
      },
    }),
    (e) => e.code === "PROVIDER_LIMIT",
  );
  assert.equal(calls, 1);
});
test("actual timeout is reported separately from network failure", async () => {
  await assert.rejects(
    generateAdvice(request(), {
      apiKey: "fake",
      fetcher: async () => {
        throw new DOMException("private", "TimeoutError");
      },
    }),
    (e) =>
      e.status === 504 &&
      e.code === "TIMEOUT" &&
      !e.message.includes("private"),
  );
});

test("geography context is bounded and allowlisted, with generated states instead of legacy names", async () => {
  const { createCountry } = await import("../dist/country.js");
  const country = createCountry({ seed: 40315, population: 67 });
  const snapshot = snapshotOf(country);
  assert.ok(JSON.stringify(snapshot).length < 24000);
  assert.equal(snapshot.territory.land, undefined);
  snapshot.territory.secret = "drop";
  snapshot.territory.regions[0].shape = "drop";
  const req = validateRequest({ mode: "analysis", snapshot });
  assert.equal(req.snapshot.territory.secret, undefined);
  assert.equal(req.snapshot.territory.regions[0].shape, undefined);
  let context;
  await generateAdvice(req, {
    apiKey: "test",
    fetcher: async (url, options) => {
      context = JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
      return ok();
    },
  });
  assert.deepEqual(
    context.regions.map((r) => r.name),
    country.territory.regions.map((r) => r.name),
  );
  assert.ok(context.regions.every((r) => r.density > 0));
  req.snapshot.territory.regions[0].share = 2;
  assert.throws(() => validateRequest(req), AdvisorError);
});

test("investment context recomputes fiscal cost, strips extras and rejects invalid ledgers", async () => {
  const { startInvestment } = await import("../dist/investments.js");
  const { budget } = await import("../dist/model.js");
  const s = startInvestment(initialState(), 5, "water");
  const snapshot = snapshotOf(s);
  snapshot.investments[0].secret = "drop";
  const req = validateRequest({ mode: "analysis", snapshot });
  assert.equal(req.snapshot.investments[0].secret, undefined);
  assert.equal(budget(req.snapshot).spending, budget(s).spending);
  let context;
  await generateAdvice(req, {
    apiKey: "test",
    fetcher: async (url, options) => {
      context = JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
      return ok();
    },
  });
  assert.equal(
    context.budget.investment.constructionQuarter,
    s.investments[0].cost * 0.1,
  );
  assert.equal(context.investments[0].regionName, "Terras do Sul");
  assert.equal(context.snapshot.investments, undefined);
  assert.equal(context.investments[0].workRequired, undefined);
  assert.ok(context.investments[0].remainingTurns > 0);
  for (const mutate of [
    (p) => (p.paid = -1),
    (p) => (p.cost = NaN),
    (p) => (p.region = 99),
    (p) => (p.phase = "unknown"),
    (p) => (p.regionShare = 0.8),
    (p) => (p.work = 1),
  ]) {
    const bad = structuredClone(snapshot);
    mutate(bad.investments[0]);
    assert.throws(
      () => validateRequest({ mode: "analysis", snapshot: bad }),
      AdvisorError,
    );
  }
});

test("all investment phases validate and a full 48-program portfolio fits the API body limit", async () => {
  const { createCountry } = await import("../dist/country.js");
  const { startInvestment } = await import("../dist/investments.js");
  const { projectDefs, advanceInvestments } = await import(
    "../dist/investment-ledger.js"
  );
  const s = createCountry({ seed: 2, population: 500, areaKm2: 8000000 });
  assert.equal(s.territory.regions.length, 12);
  const projects = [];
  for (let index = 0; index < 12; index++)
    for (const def of projectDefs) {
      const n = startInvestment(s, index, def.key);
      for (let i = 0; i < 20 && n.investments[0].phase !== "operating"; i++) {
        validateRequest({ mode: "analysis", snapshot: snapshotOf(n) });
        advanceInvestments(n);
        n.quarter++;
      }
      assert.equal(n.investments[0].phase, "operating");
      projects.push(n.investments[0]);
    }
  s.investments = projects;
  s.quarter = 20;
  const payload = {
    mode: "question",
    question: "Quais programas estão em operação?",
    snapshot: snapshotOf(s),
  };
  assert.equal(validateRequest(payload).snapshot.investments.length, 48);
  assert.ok(Buffer.byteLength(JSON.stringify(payload)) < 24000);
});
