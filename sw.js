const VERSION='v3';
const SKAL='skal-'+VERSION,DATA='data-'+VERSION,AFF='affischer-v1';
const FILER=['./','index.html','app.css','app.js','manifest.webmanifest','icons/icon-192.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SKAL).then(c=>c.addAll(FILER)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>![SKAL,DATA,AFF].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin===location.origin&&u.pathname.includes('/data/')){e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(DATA).then(ca=>ca.put(u.pathname,c))}return res}).catch(()=>caches.open(DATA).then(ca=>ca.match(u.pathname)).then(m=>m||Response.error())));return}
  if(u.origin===location.origin){e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(SKAL).then(ca=>ca.put(r,c))}return res}).catch(()=>caches.match('index.html'))));return}
  if(r.destination==='image'){e.respondWith(caches.open(AFF).then(ca=>ca.match(r.url).then(m=>m||fetch(r.url,{mode:'no-cors'}).then(res=>{ca.put(r.url,res.clone());return res}))))}
});
self.addEventListener('message',e=>{if(e.data?.typ!=='forhamta')return;const urls=e.data.urls||[];
  e.waitUntil(caches.open(AFF).then(async ca=>{let ok=0;const q=[...urls];await Promise.all(Array.from({length:6},async()=>{while(q.length){const u=q.shift();try{if(!(await ca.match(u))){const res=await fetch(u,{mode:'no-cors'});await ca.put(u,res)}ok++}catch(x){}}}));
   e.source&&e.source.postMessage({typ:'forhamtat',ok,alla:urls.length})}))});
