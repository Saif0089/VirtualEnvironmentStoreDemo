const cacheName = "DefaultCompany-ModelPreviewWebGL-0.3-" + new Date().getTime(); // Unique cache name per update
const contentToCache = [
    "Build/WebGLBuild.loader.js",
    "Build/WebGLBuild.framework.js",
    "Build/WebGLBuild.data",
    "Build/WebGLBuild.wasm",
    "TemplateData/style.css"
];

// Force cache update on install
self.addEventListener("install", function (e) {
    console.log("[Service Worker] Install");
    e.waitUntil(
        (async function () {
            const cache = await caches.open(cacheName);
            console.log("[Service Worker] Caching all: app shell and content");
            await cache.addAll(contentToCache);
            self.skipWaiting(); // Activate new worker immediately
        })()
    );
});

// Clear old caches when activating the new service worker
self.addEventListener("activate", function (e) {
    console.log("[Service Worker] Activate");
    e.waitUntil(
        (async function () {
            const keys = await caches.keys();
            await Promise.all(
                keys.map((key) => {
                    if (key !== cacheName) {
                        console.log(`[Service Worker] Deleting old cache: ${key}`);
                        return caches.delete(key);
                    }
                })
            );
            self.clients.claim(); // Take control of all pages immediately
        })()
    );
});

// Always fetch fresh resources
self.addEventListener("fetch", function (e) {
    e.respondWith(
        (async function () {
            console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
            return fetch(e.request)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type !== "basic") {
                        return response;
                    }
                    // Clone the response and cache it
                    const responseClone = response.clone();
                    caches.open(cacheName).then((cache) => {
                        cache.put(e.request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(e.request)); // Use cache only if fetch fails
        })()
    );
});
