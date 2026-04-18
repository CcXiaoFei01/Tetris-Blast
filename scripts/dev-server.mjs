import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { networkInterfaces } from "node:os";
import { cwd } from "node:process";
import { spawn } from "node:child_process";

const root = cwd();
const args = new Set(process.argv.slice(2));
const port = 3000;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function resolvePath(urlPath) {
  const requestPath = decodeURIComponent((urlPath || "/").split("?")[0]);
  const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const relativePath = safePath === "/" || safePath === "\\" ? "index.html" : safePath.replace(/^[/\\]+/, "");
  return join(root, relativePath);
}

const server = createServer((request, response) => {
  const filePath = resolvePath(request.url || "/");

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });

  createReadStream(filePath).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  const localUrl = `http://127.0.0.1:${port}`;
  const lanUrls = getLanUrls(port);
  console.log(`Local test server: ${localUrl}`);
  lanUrls.forEach((url) => console.log(`LAN test server:   ${url}`));
  console.log("Recommended: open DevTools mobile mode or TikTok devtools for final verification.");

  if (args.has("--open")) {
    spawn("cmd", ["/c", "start", "", localUrl], {
      detached: true,
      stdio: "ignore",
    }).unref();
  }
});

function getLanUrls(portNumber) {
  const interfaces = networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((entries) => {
    entries?.forEach((entry) => {
      if (!entry || entry.internal || entry.family !== "IPv4") {
        return;
      }
      urls.push(`http://${entry.address}:${portNumber}`);
    });
  });

  return urls;
}
