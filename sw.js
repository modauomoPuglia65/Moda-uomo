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

// Activate: clear old caches
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

// Fetch: serve from cache, fallback to network
self.addEventListener("fetch", function(e){
  // Skip non-GET and external APIs (meteo, paypal, whatsapp)
  if(e.request.method !== "GET") return;
  var url = e.request.url;
  if(url.indexOf("open-meteo") > -1) return;
  if(url.indexOf("paypal") > -1) return;
  if(url.indexOf("whatsapp") > -1) return;
  if(url.indexOf("googleapis") > -1) return;

  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // Cache successful responses
        if(response && response.status === 200){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function(){
        // Offline fallback: return cached index.html
        return caches.match("/index.html");
      });
    })
  );
});
