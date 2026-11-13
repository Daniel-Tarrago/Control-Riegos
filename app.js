const KEY="control-riegos-v1";
let db={fields:[],irrigations:[],settings:{hourlyRate:0}},editF=null,editR=null;
const $=x=>document.getElementById(x);
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const eur=n=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(+n||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=s=>s?s.split("-").reverse().join("/"):"";
function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY));
    if(Array.isArray(x?.fields)&&Array.isArray(x?.irrigations)){
      db={fields:x.fields,irrigations:x.irrigations,settings:{hourlyRate:Number(x.settings?.hourlyRate)||0}};
    }
  }catch(e){}
}
function save(){localStorage.setItem(KEY,JSON.stringify(db));render()}
function msg(s){const t=$("toast");t.textContent=s;t.classList.add("show");clearTimeout(msg.t);msg.t=setTimeout(()=>t.classList.remove("show"),2500)}
function render(){
  const p=db.irrigations.filter(x=>!x.paid),q=db.irrigations.filter(x=>x.paid);
  $("pendingTotal").textContent=eur(p.reduce((a,x)=>a+(+x.amount||0),0));
  $("paidTotal").textContent=eur(q.reduce((a,x)=>a+(+x.amount||0),0));
  $("pendingCount").textContent=p.length+" riegos";$("paidCount").textContent=q.length+" riegos";
  $("fieldCount").textContent=db.fields.length;
  $("defaultHourlyRate").value=db.settings.hourlyRate||"";
  fields();riegos();receipts();
}
function fields(){
  const l=$("fieldList");l.innerHTML="";$("emptyFields").classList.toggle("hidden",!!db.fields.length);
  db.fields.forEach(f=>{
    const el=document.createElement("article");el.className="item";
    const n=db.irrigations.filter(x=>x.fieldId===f.id).length;
    el.innerHTML=`<div><h3>${esc(f.name)}</h3><div class="meta">${f.farmer?esc(f.farmer)+" · ":""}${n} riegos</div></div><div class="item-actions"><button class="small" data-editf="${f.id}">Editar</button><button class="small" data-delf="${f.id}">Eliminar</button></div>`;
    l.append(el);
  });
  const s=$("irrigationField"),v=s.value;
  s.innerHTML='<option value="">Selecciona un campo</option>'+db.fields.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("");
  if(db.fields.some(f=>f.id===v))s.value=v;
}
function riegos(){
  const l=$("irrigationList");l.innerHTML="";
  const q=$("search").value.toLowerCase().trim(),filt=$("statusFilter").value;
  const rows=[...db.irrigations].sort((a,b)=>b.date.localeCompare(a.date)).filter(x=>{
    const f=db.fields.find(z=>z.id===x.fieldId),s=(f?.name+" "+f?.farmer+" "+x.notes).toLowerCase();
    return(!q||s.includes(q))&&(filt==="all"||(filt==="paid"?x.paid:!x.paid));
  });
  $("emptyIrrigations").classList.toggle("hidden",!!rows.length);
  $("emptyIrrigations").textContent=db.irrigations.length?"No hay resultados para ese filtro.":"Todavía no hay riegos.";
  rows.forEach(x=>{
    const f=db.fields.find(z=>z.id===x.fieldId),el=document.createElement("article");el.className="item";
    const detail=(x.hours&&x.hourlyRate!==undefined)?`${x.hours} h × ${eur(x.hourlyRate)}/h · `:"";
    el.innerHTML=`<div><h3>${esc(f?.name||"Campo eliminado")}</h3><div class="meta">${date(x.date)} · ${detail}${f?.farmer?esc(f.farmer):""}${x.notes?"<br>"+esc(x.notes):""}</div><span class="status ${x.paid?"paid":"pending"}">${x.paid?"PAGADO":"PENDIENTE"}</span></div><div><div class="amount">${eur(x.amount)}</div><div class="item-actions"><button class="small" data-toggle="${x.id}">${x.paid?"Deshacer pago":"Marcar pagado"}</button><button class="small" data-editr="${x.id}">Editar</button><button class="small" data-delr="${x.id}">Eliminar</button></div></div>`;
    l.append(el);
  });
}
function receipts(){
  const l=$("receiptList");l.innerHTML="";
  const q=$("receiptSearch").value.toLowerCase().trim();
  const rows=[...db.irrigations].sort((a,b)=>b.date.localeCompare(a.date)).filter(x=>{
    const f=db.fields.find(z=>z.id===x.fieldId);
    return(`${f?.name||""} ${f?.farmer||""} ${x.notes||""}`).toLowerCase().includes(q);
  });
  $("emptyReceipts").classList.toggle("hidden",!!rows.length);
  rows.forEach(x=>{
    const f=db.fields.find(z=>z.id===x.fieldId),el=document.createElement("article");el.className="item";
    const person=f?.farmer?` · ${esc(f.farmer)}`:"";
    el.innerHTML=`<div><h3>${esc(f?.name||"Campo eliminado")}</h3><div class="meta">${date(x.date)}${person} · ${x.hours?esc(x.hours)+" h":"Importe registrado"}</div><span class="status ${x.paid?"paid":"pending"}">${x.paid?"PAGADO":"PENDIENTE"}</span></div><div><div class="amount">${eur(x.amount)}</div><div class="item-actions"><button class="small" data-print="${x.id}">Imprimir</button><button class="small" data-share="${x.id}">Compartir</button></div></div>`;
    l.append(el);
  });
}
function openF(v){
  editF=v;const f=db.fields.find(x=>x.id===v);
  $("fieldTitle").textContent=f?"Editar campo":"Añadir campo";
  $("fieldName").value=f?.name||"";$("farmerName").value=f?.farmer||"";
  $("fieldDialog").showModal();
}
function updateTotal(){
  const hours=Number($("irrigationHours").value)||0,rate=Number($("irrigationRate").value)||0;
  $("irrigationAmount").value=(hours*rate).toFixed(2);
  $("calculationHint").textContent=`${hours||0} horas × ${eur(rate)}/hora = ${eur(hours*rate)}`;
}
function openR(v){
  if(!db.fields.length){msg("Añade primero un campo.");return}
  editR=v;const x=db.irrigations.find(z=>z.id===v);
  $("irrigationTitle").textContent=x?"Editar riego":"Nuevo riego";
  $("irrigationField").value=x?.fieldId||"";
  $("irrigationDate").value=x?.date||today();
  $("irrigationHours").value=x?.hours??1;
  $("irrigationRate").value=x?.hourlyRate??db.settings.hourlyRate??0;
  $("irrigationNotes").value=x?.notes||"";
  updateTotal();$("irrigationDialog").showModal();
}
function receiptText(x){
  const f=db.fields.find(z=>z.id===x.fieldId),name=f?.name||"Campo eliminado";
  const lines=["RECIBO DE RIEGO","------------------------------",`Campo: ${name}`,`Agricultor: ${f?.farmer||"No indicado"}`,`Fecha: ${date(x.date)}`];
  if(x.hours&&x.hourlyRate!==undefined){lines.push(`Horas: ${x.hours}`,`Precio por hora: ${eur(x.hourlyRate)}`)}
  lines.push(`TOTAL: ${eur(x.amount)}`,`Estado: ${x.paid?"PAGADO":"PENDIENTE"}`);
  if(x.notes)lines.push(`Notas: ${x.notes}`);
  lines.push("------------------------------","Recibo generado con Control de Riegos");
  return lines.join("\n");
}
function printReceipt(idValue){
  const x=db.irrigations.find(z=>z.id===idValue);if(!x)return;
  const f=db.fields.find(z=>z.id===x.fieldId),w=window.open("","_blank");
  if(!w){msg("Permite las ventanas emergentes para imprimir el recibo.");return}
  const rows=[["Campo",f?.name||"Campo eliminado"],["Agricultor",f?.farmer||"—"],["Fecha",date(x.date)]];
  if(x.hours&&x.hourlyRate!==undefined){rows.push(["Horas trabajadas",`${x.hours} h`],["Precio por hora",eur(x.hourlyRate)])}
  rows.push(["Estado",x.paid?"Pagado":"Pendiente"]);
  const content=rows.map(([a,b])=>`<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join("");
  w.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Recibo - ${esc(f?.name||"Riego")}</title><style>body{font:16px Arial,sans-serif;color:#18332a;max-width:700px;margin:40px auto;padding:20px}h1{color:#176b4d}table{width:100%;border-collapse:collapse;margin:25px 0}th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd}th{width:40%;color:#60766a}.total{font-size:26px;font-weight:bold;text-align:right;border-top:2px solid #176b4d;padding-top:18px}.notes{white-space:pre-wrap;color:#53665b}@media print{button{display:none}body{margin:15mm auto}}</style><h1>💧 Recibo de riego</h1><table>${content}</table><div class="total">TOTAL: ${eur(x.amount)}</div>${x.notes?`<p class="notes"><b>Notas:</b> ${esc(x.notes)}</p>`:""}<p style="color:#718178;font-size:12px;margin-top:35px">Recibo generado con Control de Riegos</p><button onclick="window.print()">Imprimir / Guardar como PDF</button><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></html>`);
  w.document.close();
}
async function shareReceipt(idValue){
  const x=db.irrigations.find(z=>z.id===idValue);if(!x)return;
  const text=receiptText(x);
  try{
    if(navigator.share){await navigator.share({title:"Recibo de riego",text});}
    else{window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener");}
  }catch(e){if(e.name!=="AbortError")msg("No se pudo abrir el menú para compartir.")}
}
$("fieldForm").onsubmit=e=>{
  e.preventDefault();const o={name:$("fieldName").value.trim(),farmer:$("farmerName").value.trim()};
  if(editF)Object.assign(db.fields.find(x=>x.id===editF),o);else db.fields.push({id:id(),...o});
  $("fieldDialog").close();save();msg("Campo guardado");
};
$("irrigationForm").onsubmit=e=>{
  e.preventDefault();
  const hours=Number($("irrigationHours").value),hourlyRate=Number($("irrigationRate").value);
  const o={fieldId:$("irrigationField").value,date:$("irrigationDate").value,hours,hourlyRate,amount:+(hours*hourlyRate).toFixed(2),notes:$("irrigationNotes").value.trim()};
  if(!o.fieldId||!o.date||!Number.isFinite(hours)||hours<=0||!Number.isFinite(hourlyRate)||hourlyRate<0){msg("Comprueba las horas y el precio por hora.");return}
  if(editR)Object.assign(db.irrigations.find(x=>x.id===editR),o);else db.irrigations.push({id:id(),...o,paid:false});
  $("irrigationDialog").close();save();msg("Riego guardado como pendiente");
};
$("saveSettings").onclick=()=>{
  const rate=Number($("defaultHourlyRate").value);
  if(!Number.isFinite(rate)||rate<0){msg("Introduce un precio por hora válido.");return}
  db.settings.hourlyRate=rate;save();msg("Precio por hora guardado");
};
$("irrigationHours").oninput=updateTotal;$("irrigationRate").oninput=updateTotal;
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.close){$(b.dataset.close).close();return}
  if(b.dataset.tab){
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
    ["riegos","campos","recibos","configuracion","copias"].forEach(t=>$("panel-"+t).classList.toggle("hidden",t!==b.dataset.tab));
  }
  if(b.id==="newField")openF();if(b.id==="newIrrigation")openR();
  if(b.dataset.editf)openF(b.dataset.editf);
  if(b.dataset.delf){const k=b.dataset.delf;if(db.irrigations.some(x=>x.fieldId===k)){msg("El campo tiene riegos asociados; elimínalos antes.");return}if(confirm("¿Eliminar campo?")){db.fields=db.fields.filter(x=>x.id!==k);save()}}
  if(b.dataset.toggle){const x=db.irrigations.find(z=>z.id===b.dataset.toggle);x.paid=!x.paid;save();msg(x.paid?"Marcado como pagado":"Pago deshecho")}
  if(b.dataset.editr)openR(b.dataset.editr);
  if(b.dataset.delr&&confirm("¿Eliminar este riego?")){db.irrigations=db.irrigations.filter(x=>x.id!==b.dataset.delr);save()}
  if(b.dataset.print)printReceipt(b.dataset.print);
  if(b.dataset.share)shareReceipt(b.dataset.share);
  if(b.id==="exportData")backup();if(b.id==="importButton")$("importFile").click();
});
$("search").oninput=riegos;$("statusFilter").onchange=riegos;$("receiptSearch").oninput=receipts;
function backup(){
  const o={app:"Control de Riegos",formatVersion:2,exportedAt:new Date().toISOString(),fields:db.fields,irrigations:db.irrigations,settings:db.settings};
  const u=URL.createObjectURL(new Blob([JSON.stringify(o,null,2)],{type:"application/json"})),a=document.createElement("a");
  a.href=u;a.download="copia-control-riegos-"+today()+".json";a.click();URL.revokeObjectURL(u);msg("Copia preparada; guárdala en Archivos/iCloud Drive");
}
$("importFile").onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  try{
    const o=JSON.parse(await f.text());
    if(o.app!=="Control de Riegos"||![1,2].includes(o.formatVersion)||!Array.isArray(o.fields)||!Array.isArray(o.irrigations))throw 0;
    if(confirm(`La copia contiene ${o.fields.length} campos y ${o.irrigations.length} riegos. Se sustituirán los datos actuales. ¿Continuar?`)){
      db={fields:o.fields,irrigations:o.irrigations,settings:{hourlyRate:Number(o.settings?.hourlyRate)||0}};save();msg("Copia recuperada");
    }
  }catch(_){alert("Archivo no válido. Selecciona una copia JSON de Control de Riegos.")}
  finally{e.target.value=""}
};
document.querySelectorAll("dialog").forEach(d=>d.addEventListener("click",e=>{if(e.target===d)d.close()}));
load();render();
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
