const CACHE_NAME = 'atsv-jugendtrainer-v2';
const APP_SHELL = [
  './','./index.html','./style.css','./wappen.css?v=1','./mobile-fix.css?v=1','./nav.css?v=1','./nav.js?v=1','./app.js','./dashboard.js',
  './spieler.html','./spieler.js?v=4','./anwesenheit.html','./anwesenheit.js','./termine.html','./termine.js?v=2','./statistiken.html','./statistiken.js?v=2','./spiele.html','./spiele.js?v=4','./vorbereitung.html','./vorbereitung.js?v=2','./aufgaben.html','./aufgaben.js?v=1','./mannschaftskasse.html','./mannschaftskasse.js?v=1'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}return response;})));});
