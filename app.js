'use strict';
const KAT={'New Releases':'Nyheter','SAS Recommends':'SAS tipsar','Awarded & Nominated':'Prisade & nominerade','Adventure':'Äventyr','Comedy':'Komedi','Kids':'Barn','Drama':'Drama','Action':'Action','Thriller':'Thriller','Scandinavian movies':'Skandinaviska filmer','Sci-fi':'Sci-fi','International movies':'Internationella filmer','International':'Internationellt','Crime':'Kriminal','True Stories':'Sanna historier','Silver Screen':'Klassiker','Pride Collection':'Pride','Enter At Your Own Risk':'Skräck & rysare','Horror':'Skräck','Romance':'Romantik','Family':'Familj','Biography':'Biografi'};
const $=s=>document.querySelector(s);
const S={tab:'kat',q:'',sort:'betyg',min:0,kat:new Set(),gen:new Set(),barn:false,forsv:false,nya:false};
let F=[],META={},SENAST=null,vill=new Set();
try{vill=new Set(JSON.parse(localStorage.getItem('viVillSe')||'[]'))}catch(e){}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v.filter(x=>x!=null&&x!==''):(v?[String(v)]:[]);
const num=v=>{const n=parseFloat(v);return isFinite(n)?n:null};
const katNamn=k=>k?(KAT[k]||k):'Övrigt';
const key=f=>f.imdb_id||(f.titel+'|'+f.ar);
function norm(f,i){f=f&&typeof f==='object'?f:{};return{...f,titel:f.titel||f.title||f.originaltitel||'Okänd titel',ar:num(f.ar),langd_min:num(f.langd_min),imdb_betyg:num(f.imdb_betyg),imdb_roster:num(f.imdb_roster),genre:arr(f.genre),roller:arr(f.roller),textning:arr(f.textning),ljud:arr(f.ljud),sas_kategori:f.sas_kategori||'',_i:i,finns:f.finns_vid_avresa!==false,ny:f.ny===true,forst_sedd:ISO(f.forst_sedd)}}
const ISO=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(0,10):null;
const kort=d=>{try{return new Date(d+'T12:00').toLocaleDateString('sv-SE',{day:'numeric',month:'short'}).replace('.','')}catch(e){return d}};
const nyB=f=>f.ny?`<span class="ny${f.forst_sedd&&f.forst_sedd===SENAST?' senast':''}">NY</span>`:'';
async function load(){
  let d=null,ex=false;
  for(const u of ['data/filmer.json','data/exempel.json']){try{const r=await fetch(u,{cache:'no-cache'});if(r.ok){d=await r.json();ex=u.includes('exempel');break}}catch(e){}}
  if(!d){$('#list').innerHTML='<p class="empty">Vi kunde inte läsa filmlistan just nu.</p>';return}
  let list=Array.isArray(d)?d:(d.filmer||d.movies||d.films||Object.values(d).find(Array.isArray)||[]);
  META=Array.isArray(d)?{}:d;F=list.map(norm);SENAST=F.filter(f=>f.ny&&f.forst_sedd).map(f=>f.forst_sedd).sort().pop()||null;
  $('#banner').hidden=!ex&&!META.exempel;
  const dat=META.hamtad?new Date(META.hamtad+'T12:00').toLocaleDateString('sv-SE',{day:'numeric',month:'long',year:'numeric'}):'–';
  $('#meta').innerHTML='Utbud hämtat '+esc(dat)+(META.kalla&&/^https?:/.test(META.kalla)?' · <a href="'+esc(META.kalla)+'" target="_blank" rel="noopener">källa</a>':'');
  const nn=F.filter(f=>f.ny).length;$('#meta').innerHTML+=' · '+(nn?`<span class="nyt">${nn} ${nn===1?'ny film':'nya filmer'}</span>`:'inga nya filmer');
  $('#nyrow').hidden=!nn;$('#nya').textContent='Bara nya ('+nn+')';if(!nn){S.nya=false;$('#nya').classList.remove('on')}
  chips();render();
}
function chips(){
  const ks=[...new Set(F.map(f=>f.sas_kategori))].sort((a,b)=>katNamn(a).localeCompare(katNamn(b),'sv'));
  const gs=[...new Set(F.flatMap(f=>f.genre))].sort((a,b)=>a.localeCompare(b,'sv'));
  const mk=(el,items,set,lab)=>{el.innerHTML=items.map(k=>`<button class="chip" data-v="${esc(k)}">${esc(lab(k))}</button>`).join('');
    el.onclick=e=>{const b=e.target.closest('.chip');if(!b)return;const v=b.dataset.v;set.has(v)?set.delete(v):set.add(v);b.classList.toggle('on');render()}};
  mk($('#kchips'),ks,S.kat,katNamn);mk($('#gchips'),gs,S.gen,g=>g);
}
const cmp={betyg:(a,b)=>(b.imdb_betyg??-1)-(a.imdb_betyg??-1)||(b.imdb_roster??0)-(a.imdb_roster??0),ar:(a,b)=>(b.ar??-1)-(a.ar??-1),langd:(a,b)=>(a.langd_min??1e9)-(b.langd_min??1e9),titel:(a,b)=>a.titel.replace(/^[^\p{L}\p{N}]+/u,'').localeCompare(b.titel.replace(/^[^\p{L}\p{N}]+/u,''),'sv')};
function filt(){
  const q=S.q.trim().toLowerCase();
  return F.filter(f=>(!S.nya||f.ny)&&(S.forsv||f.finns)&&(!S.barn||f.barn)&&(!S.min||(f.imdb_betyg??0)>=S.min)&&(!S.kat.size||S.kat.has(f.sas_kategori))&&(!S.gen.size||f.genre.some(g=>S.gen.has(g)))&&(S.tab!=='vill'||vill.has(key(f)))&&
   (!q||[f.titel,f.originaltitel,f.regissor,...f.roller].some(x=>x&&String(x).toLowerCase().includes(q))));
}
function poster(f){return `<div class="ps">${f.affisch_url?`<img loading="lazy" alt="" src="${esc(f.affisch_url)}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:'🎬'}))">`:'<div class="ph">🎬</div>'}</div>`}
function card(f){const k=key(f),on=vill.has(k);
  const m=[f.ar??'–',f.langd_min?f.langd_min+' min':'–'].join(' · ');
  return `<article class="card" data-i="${f._i}">${poster(f)}<div class="ct"><h3>${nyB(f)}${f.ny?' ':''}${esc(f.titel)}</h3>
  <div class="m">${esc(m)} · <span class="rt">★ ${f.imdb_betyg!=null?f.imdb_betyg.toFixed(1):'–'}</span></div>
  <div class="m">${esc(f.genre.join(', ')||'–')}</div><div class="m">${f.regissor?'Regi: '+esc(f.regissor):'Regi: –'}</div>
  ${f.finns?'':'<span class="tag">Försvinner 31 okt</span>'}</div>
  <button class="star${on?' on':''}" data-k="${esc(k)}" aria-label="Vi vill se" aria-pressed="${on}">${on?'★':'☆'}</button></article>`}
function render(){
  document.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.tab===S.tab));
  $('#vc').textContent=vill.size?'('+vill.size+')':'';
  const L=filt();$('#cnt').textContent=L.length+' filmer'+(S.forsv?'':' som finns vid vår avresa');
  if(!L.length){$('#list').innerHTML=`<p class="empty">${S.tab==='vill'&&!vill.size?'Vi har inte markerat några filmer än. Tryck på ☆ på en film.':'Inga filmer matchar.'}</p>`;return}
  if(S.tab==='kat'){const g=new Map();L.forEach(f=>{const k=f.sas_kategori;g.has(k)||g.set(k,[]);g.get(k).push(f)});
    $('#list').innerHTML=[...g].sort((a,b)=>katNamn(a[0]).localeCompare(katNamn(b[0]),'sv')).map(([k,v])=>`<h2>${esc(katNamn(k))} <span class="muted" style="font-size:15px">${v.length}</span></h2><div class="grid">${v.sort(cmp.betyg).map(card).join('')}</div>`).join('');
  }else $('#list').innerHTML=`<div class="grid">${L.sort(cmp[S.sort]).map(card).join('')}</div>`;
}
function toggle(k){vill.has(k)?vill.delete(k):vill.add(k);try{localStorage.setItem('viVillSe',JSON.stringify([...vill]))}catch(e){}}
function detalj(f){const k=key(f),on=vill.has(k),dash=v=>v==null||v===''||(Array.isArray(v)&&!v.length)?'–':esc(Array.isArray(v)?v.join(', '):v);
  $('#det').innerHTML=`<div class="dh"><button id="stang">Stäng</button><button class="star${on?' on':''}" id="dstar" aria-pressed="${on}">${on?'★ Vi vill se':'☆ Vi vill se'}</button></div>
  <div class="db"><div class="dtop">${poster(f)}<div>${f.ny?nyB(f)+(f.forst_sedd?' <span class="m">Ny sedan '+esc(kort(f.forst_sedd))+'</span>':''):''}<h2>${esc(f.titel)}</h2><div class="m">${dash(f.ar)} · ${f.langd_min?f.langd_min+' min':'–'} · ${esc(katNamn(f.sas_kategori))}</div>
  <div class="m"><span class="rt">★ ${f.imdb_betyg!=null?f.imdb_betyg.toFixed(1):'–'}</span> ${f.imdb_roster?'('+f.imdb_roster.toLocaleString('sv-SE')+' röster)':''}</div>
  ${f.finns?'':'<span class="tag">Försvinner 31 okt – före vår avresa</span>'}</div></div>
  <p>${f.beskrivning?esc(f.beskrivning):'<span class="muted">Ingen beskrivning.</span>'}</p>
  <dl>${f.originaltitel?`<dt>Originaltitel</dt><dd>${esc(f.originaltitel)}</dd>`:''}<dt>Regi</dt><dd>${dash(f.regissor)}</dd><dt>Roller</dt><dd>${dash(f.roller)}</dd><dt>Genre</dt><dd>${dash(f.genre)}</dd>
  <dt>Åldersgräns</dt><dd>${dash(f.aldersgrans)}${f.barn?' · barnfilm':''}</dd><dt>Ljud</dt><dd>${dash(f.ljud)}</dd><dt>Textning</dt><dd>${dash(f.textning)}</dd></dl>
  ${f.imdb_id?`<p><a class="btn" style="display:inline-block;text-decoration:none" href="https://www.imdb.com/title/${encodeURIComponent(f.imdb_id)}/" target="_blank" rel="noopener">Öppna på IMDb</a></p>`:''}</div>`;
  $('#stang').onclick=()=>$('#dlg').close();
  $('#dstar').onclick=e=>{toggle(k);const o=vill.has(k);e.target.classList.toggle('on',o);e.target.textContent=(o?'★':'☆')+' Vi vill se';render()};
  $('#dlg').showModal();$('#dlg').scrollTop=0;
}
$('#list').onclick=e=>{const s=e.target.closest('.star');if(s){e.stopPropagation();toggle(s.dataset.k);render();return}
  const c=e.target.closest('.card');if(c)detalj(F[+c.dataset.i])};
$('.seg').onclick=e=>{const b=e.target.closest('button');if(b){S.tab=b.dataset.tab;render();scrollTo(0,0)}};
$('#q').oninput=e=>{S.q=e.target.value;render()};$('#sort').onchange=e=>{S.sort=e.target.value;if(S.tab==='kat')S.tab='alla';render()};
$('#min').onchange=e=>{S.min=+e.target.value;render()};$('#barn').onchange=e=>{S.barn=e.target.checked;render()};$('#forsv').onchange=e=>{S.forsv=e.target.checked;render()};
$('#nya').onclick=e=>{S.nya=!S.nya;e.currentTarget.classList.toggle('on',S.nya);e.currentTarget.setAttribute('aria-pressed',S.nya);render()};
$('#dlg').addEventListener('click',e=>{if(e.target.id==='dlg')e.target.close()});
$('#pre').onclick=()=>{const urls=[...new Set(F.map(f=>f.affisch_url).filter(Boolean))];if(!navigator.serviceWorker?.controller){$('#prest').textContent='Offlineläget är inte aktivt än – ladda om sidan en gång.';return}
  $('#prest').textContent='Sparar '+urls.length+' affischer…';navigator.serviceWorker.controller.postMessage({typ:'forhamta',urls})};
navigator.serviceWorker?.addEventListener('message',e=>{if(e.data?.typ==='forhamtat')$('#prest').textContent=`Klart: ${e.data.ok} av ${e.data.alla} affischer sparade för offline.`});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
load();
