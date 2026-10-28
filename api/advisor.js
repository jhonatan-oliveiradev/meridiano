import { createHash } from "node:crypto";
import {
  AdvisorError,
  validateRequest,
  generateAdvice,
  DEFAULT_MODEL,
} from "../server/advisor.js";
const buckets = new Map();
// Best effort per warm instance. Provider quota and Vercel WAF remain the global controls.
export function takeQuota(identity, now = Date.now()) {
  const key = createHash("sha256").update(identity).digest("hex"),
    last = buckets.get(key);
  if (buckets.size > 1000)
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  if (buckets.size >= 2000 && !last) return false;
  const b = !last || last.reset < now ? { count: 0, reset: now + 60000 } : last;
  if (b.count >= 4) return false;
  b.count++;
  buckets.set(key, b);
  return true;
}
export function sameOrigin(req) {
  const origin = req.headers.origin,
    host = req.headers.host;
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return ["http:", "https:"].includes(url.protocol) && url.host === host;
  } catch {
    return false;
  }
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method === "GET")
    return res.status(200).json({
      available: !!process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    });
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res
      .status(405)
      .json({ code: "METHOD_NOT_ALLOWED", message: "Método não permitido." });
  }
  if (!sameOrigin(req) || req.headers["x-meridiano-client"] !== "1")
    return res.status(403).json({
      code: "ORIGIN_REJECTED",
      message: "Abra o Meridiano neste domínio para fazer a consulta.",
    });
  if (!String(req.headers["content-type"] || "").startsWith("application/json"))
    return res.status(415).json({
      code: "INVALID_CONTENT",
      message: "Formato de consulta inválido.",
    });
  try {
    if (
      Number(req.headers["content-length"] || 0) > 48000 ||
      JSON.stringify(req.body ?? null).length > 48000
    )
      throw new AdvisorError(
        413,
        "PAYLOAD_TOO_LARGE",
        "A consulta é muito longa. Reduza a pergunta.",
      );
    const request = validateRequest(req.body);
    if (!process.env.GEMINI_API_KEY)
      throw new AdvisorError(
        503,
        "NOT_CONFIGURED",
        "O conselheiro ainda não está conectado. Você pode continuar a simulação.",
      );
    const ip = String(
      req.headers["x-vercel-forwarded-for"] ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        "anonymous",
    )
      .split(",")[0]
      .trim();
    if (!takeQuota(ip)) {
      res.setHeader("Retry-After", "60");
      throw new AdvisorError(
        429,
        "RATE_LIMIT",
        "Você fez várias consultas seguidas. Aguarde um minuto.",
      );
    }
    return res.status(200).json(
      await generateAdvice(request, {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      }),
    );
  } catch (error) {
    const e =
      error instanceof AdvisorError
        ? error
        : new AdvisorError(
            500,
            "INTERNAL_ERROR",
            "Não foi possível concluir a consulta. Tente novamente.",
          );
    if (e.status >= 500)
      console.warn("meridiano.advisor", { code: e.code, status: e.status });
    return res.status(e.status).json({ code: e.code, message: e.message });
  }
}
