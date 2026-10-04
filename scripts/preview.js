/* Serve the production build at its GitHub Pages base path. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "../build");
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};
const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/") {
    response.writeHead(302, { Location: "/raffler/" });
    response.end();
    return;
  }
  if (!url.pathname.startsWith("/raffler/")) {
    response.writeHead(404);
    response.end();
    return;
  }
  const file = path.resolve(
    root,
    "." + decodeURIComponent(url.pathname.slice("/raffler".length)),
    url.pathname.endsWith("/") ? "index.html" : "",
  );
  if (!file.startsWith(root + path.sep)) {
    response.writeHead(403);
    response.end();
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(data);
  });
});
server.listen(Number(process.env.PORT || 4173), "127.0.0.1", () =>
  console.log("Production preview: http://localhost:4173/raffler/"),
);
