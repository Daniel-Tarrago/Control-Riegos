const C="control-riegos-v2",A=["./","./index.html","./style.css","./app.js","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method==="GET")e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{caches.open(C).then(c=>c.put(e.request,x.clone()));return x}).catch(()=>caches.match("./index.html"))))});
