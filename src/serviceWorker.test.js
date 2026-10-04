const fs = require("fs");
const path = require("path");
const vm = require("vm");
const source = fs
  .readFileSync(path.resolve(__dirname, "../public/serviceWorker.js"), "utf8")
  .replace("__BUILD_REVISION__", "test-build");

function worker() {
  const handlers = {},
    store = new Map();
  const cache = {
    addAll: jest.fn(async (urls) => {
      urls.forEach((url) =>
        store.set(url, {
          ok: true,
          body: url,
          clone() {
            return this;
          },
        }),
      );
    }),
    match: jest.fn(async (request) =>
      store.get(typeof request === "string" ? request : request.url),
    ),
    put: jest.fn(async (request, value) => store.set(request.url, value)),
  };
  const caches = {
    open: jest.fn(async () => cache),
    keys: jest.fn(async () => [
      "raffler-_raffler_-v1",
      "other-app-cache",
      "raffler-_raffler_-test-build",
    ]),
    delete: jest.fn(async () => true),
  };
  const self = {
    registration: { scope: "https://example.test/raffler/" },
    addEventListener: (name, handle) => {
      handlers[name] = handle;
    },
    skipWaiting: jest.fn(),
    clients: { claim: jest.fn() },
  };
  const fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      files: {
        main: "/raffler/static/js/main.hash.js",
        css: "/raffler/static/css/main.hash.css",
        map: "/raffler/static/js/main.hash.js.map",
        logo: "/raffler/static/media/logo.hash.png",
      },
    }),
  }));
  vm.runInNewContext(source, {
    self,
    caches,
    fetch,
    URL,
    Response: class {
      constructor(body, options) {
        this.body = body;
        this.status = options.status;
      }
    },
  });
  const lifetime = async (name) => {
    let promise;
    handlers[name]({
      waitUntil: (value) => {
        promise = value;
      },
    });
    await promise;
  };
  const request = async (url, mode = "navigate", method = "GET") => {
    let promise;
    handlers.fetch({
      request: { url, mode, method },
      respondWith: (value) => {
        promise = value;
      },
      waitUntil: () => {},
    });
    return promise;
  };
  return { handlers, cache, caches, self, fetch, lifetime, request };
}
test("install precaches the shell and all hashed assets but not sourcemaps", async () => {
  const w = worker();
  await w.lifetime("install");
  expect(w.cache.addAll.mock.calls[0][0]).toEqual(
    expect.arrayContaining([
      "https://example.test/raffler/index.html",
      "https://example.test/raffler/static/js/main.hash.js",
      "https://example.test/raffler/static/css/main.hash.css",
      "https://example.test/raffler/static/media/logo.hash.png",
    ]),
  );
  expect(
    w.cache.addAll.mock.calls[0][0].some((url) => url.endsWith(".map")),
  ).toBe(false);
  expect(w.self.skipWaiting).toHaveBeenCalled();
});
test("offline navigation and assets are served from the installed build", async () => {
  const w = worker();
  await w.lifetime("install");
  w.fetch.mockRejectedValue(new Error("offline"));
  expect((await w.request("https://example.test/raffler/")).body).toBe(
    "https://example.test/raffler/index.html",
  );
  expect(
    (
      await w.request(
        "https://example.test/raffler/static/js/main.hash.js",
        "cors",
      )
    ).body,
  ).toContain("main.hash.js");
});
test("activation cleans up only older Raffler caches", async () => {
  const w = worker();
  await w.lifetime("activate");
  expect(w.caches.delete).toHaveBeenCalledTimes(1);
  expect(w.caches.delete).toHaveBeenCalledWith("raffler-_raffler_-v1");
  expect(w.self.clients.claim).toHaveBeenCalled();
});
test("cross-origin, other app paths, and writes are never intercepted", async () => {
  const w = worker();
  expect(
    await w.request("https://fonts.googleapis.com/font.css", "cors"),
  ).toBeUndefined();
  expect(await w.request("https://example.test/other-app/")).toBeUndefined();
  expect(
    await w.request("https://example.test/raffler/", "cors", "POST"),
  ).toBeUndefined();
  expect(w.fetch).not.toHaveBeenCalled();
});
test("offline without an installed shell returns a readable fallback", async () => {
  const w = worker();
  w.fetch.mockRejectedValue(new Error("offline"));
  const response = await w.request("https://example.test/raffler/");
  expect(response.status).toBe(503);
  expect(response.body).toMatch(/one online visit/);
});
