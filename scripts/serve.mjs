import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import handler from "../api/advisor.js";
import { audioRange } from "../server/audio-range.js";
const root = resolve("dist"),
  types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".xml": "application/xml; charset=utf-8",
    ".woff2": "font/woff2",
    ".mp3": "audio/mpeg",
  };
// Local-only .env support. Production reads Vercel environment variables directly.
try {
  process.loadEnvFile(".env.local");
} catch {}
http
  .createServer(async (req, res) => {
    if (new URL(req.url, "http://localhost").pathname === "/api/advisor") {
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (value) => res.end(JSON.stringify(value));
      try {
        let size = 0,
          chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 24000) {
            res.status(413).json({
              code: "PAYLOAD_TOO_LARGE",
              message: "Consulta muito longa.",
            });
            return;
          }
          chunks.push(chunk);
        }
        const raw = Buffer.concat(chunks).toString();
        req.body = raw ? JSON.parse(raw) : undefined;
        await handler(req, res);
      } catch {
        if (!res.writableEnded)
          res
            .status(400)
            .json({ code: "INVALID_JSON", message: "Consulta inválida." });
      }
      return;
    }
    try {
      const pathname = decodeURIComponent(
          new URL(req.url, "http://localhost").pathname,
        ),
        path = resolve(
          root,
          "." + (pathname === "/" ? "/index.html" : pathname),
        );
      if (path !== root && !path.startsWith(root + sep)) {
        res.writeHead(403).end();
        return;
      }
      const data = await readFile(path);
      if (extname(path) === ".mp3") {
        const headers = {
          "Content-Type": "audio/mpeg",
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-store",
        };
        if (req.headers.range) {
          const range = audioRange(req.headers.range, data.length);
          if (!range) {
            res
              .writeHead(416, {
                ...headers,
                "Content-Range": `bytes */${data.length}`,
              })
              .end();
            return;
          }
          const { start, end } = range;
          res
            .writeHead(206, {
              ...headers,
              "Content-Range": `bytes ${start}-${end}/${data.length}`,
              "Content-Length": end - start + 1,
            })
            .end(data.subarray(start, end + 1));
        } else
          res
            .writeHead(200, { ...headers, "Content-Length": data.length })
            .end(data);
        return;
      }
      res
        .writeHead(200, {
          "Content-Type": types[extname(path)] || "application/octet-stream",
          "Cache-Control": "no-store",
        })
        .end(data);
    } catch {
      res
        .writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
        .end("Arquivo não encontrado.");
    }
  })
  .listen(4173, "0.0.0.0", () =>
    console.log("Meridiano: http://localhost:4173"),
  );
