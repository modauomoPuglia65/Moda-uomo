const CACHE = "moda-uomo-v202609010306";
const FILES = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

// Install: cache files
self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

// Activate: clear ALL old caches immediately
self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: NETWORK FIRST - always try network, fallback to cache
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var url = e.request.url;

  // Skip external APIs
  if(url.indexOf("open-meteo") > -1) return;
  if(url.indexOf("paypal") > -1) return;
  if(url.indexOf("whatsapp") > -1) return;
  if(url.indexOf("googleapis") > -1) return;
  if(url.indexOf("youtube") > -1) return;
  if(url.indexOf("tawk") > -1) return;

  // For HTML pages: network first, cache fallback
  if(url.indexOf(".html") > -1 || url.endsWith("/") || url.indexOf("github.io") > -1){
    e.respondWith(
      fetch(e.request).then(function(response){
        if(response && response.status === 200){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function(){
        return caches.match(e.request).then(function(cached){
          return cached || caches.match("/index.html");
        });
      })
    );
    return;
  }

  // For other assets: cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        if(response && response.status === 200){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function(){
        return caches.match("/index.html");
      });
    })
  );
});

// Listen for skip waiting message
self.addEventListener("message", function(e){
  if(e.data === "skipWaiting") self.skipWaiting();
});
