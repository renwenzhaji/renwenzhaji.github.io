/* 人文札记 · 离线缓存。每次发布新版，请把下面的版本号改一下（如 v2、v3） */
var CACHE="rwzj-v13";
var CORE=["./","./index.html","./style.css","./app.js","./data.js","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("message",function(e){if(e.data==="skip")self.skipWaiting();});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){if(k!==CACHE)return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  var r=e.request;
  if(r.method!=="GET")return;
  var u;
  try{u=new URL(r.url);}catch(err){return;}
  if(u.origin!==location.origin)return;
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(function(res){
      var cp=res.clone();caches.open(CACHE).then(function(c){c.put(r,cp);});return res;
    }).catch(function(){
      return caches.match(r).then(function(m){return m||caches.match("./index.html");});
    }));
    return;
  }
  e.respondWith(caches.match(r).then(function(m){
    return m||fetch(r).then(function(res){
      var cp=res.clone();caches.open(CACHE).then(function(c){c.put(r,cp);});return res;
    });
  }));
});
