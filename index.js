
// ================= KONFIGURASI BANTUL (Juknis 2026) =================
const CONFIG = {
  MAX_INPUT: 100, MAX_PRESTASI: 7.5,
  CLICK_THRESHOLD: 3, AFFILIATE_URL: "https://s.shopee.co.id/AA4ETmAQ4H",
  SEMESTERS: ['K4S1','K4S2','K5S1','K5S2','K6S1'],
  MAPEL_RAPOR: [
    { id: 'indo', label: 'Bahasa Indonesia' },
    { id: 'mtk', label: 'Matematika' },
    { id: 'ipa', label: 'IPA' }
  ],
  WEIGHTS: {
    '2026': { rapor: 0.2, tka: 0.5, tkad: 0.3 },
    'sebelum': { rapor: 0.4, aspd: 0.6 }
  },
  TES_FIELDS: {
    '2026': [
      { id: 'tka_mtk', label: 'Nilai TKA Matematika' },
      { id: 'tka_indo', label: 'Nilai TKA Bahasa Indonesia' },
      { id: 'tkad', label: 'Nilai TKAD' }
    ],
    'sebelum': [
      { id: 'aspd', label: 'Nilai ASPD' }
    ]
  }
};

let clickCount = 0, popUnderOpened = false;
let currentYear = '2026', jalurAktif = 'domisili', lastShortLink = '';

// ================= UTILS & CORE =================
function clamp(v) { const n = parseFloat(v); return isNaN(n) ? null : Math.max(0, Math.min(100, n)); }
function getVal(id) { const e = document.getElementById(id); return !e ? null : e.value.trim()==='' ? null : clamp(e.value); }
function isEmpty(id) { const e = document.getElementById(id); return !e || e.value.trim()===''; }
function toast(msg, dur=2000) {
  const old = document.getElementById('toast'); if(old) old.remove();
  const t = document.createElement('div'); t.id='toast'; t.className='toast'; t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>{t.style.animation='slideUp 0.3s';setTimeout(()=>t.remove(),300)},dur);
}
function showHint(id, show) { const e=document.getElementById(id); if(e) e.classList.toggle('show', show); }
function markReq(id, mark) { const e=document.getElementById(id); if(e) e.classList.toggle('required-empty', mark); }

// ================= POP-UNDER & CLICK HANDLER =================
function openPop() {
  if(!popUnderOpened) { 
    popUnderOpened=true; 
    const t=window.open(CONFIG.AFFILIATE_URL,'_blank','noopener'); 
    if(t) setTimeout(()=>{t.blur();window.focus()},100); 
  }
}
function handleUserClick() { clickCount++; if(clickCount===CONFIG.CLICK_THRESHOLD) openPop(); }

// ================= RENDER INPUTS =================
function renderTesInputs() {
  const c = document.getElementById('tes-inputs');
  const hint = document.getElementById('tes-hint');
  const fields = CONFIG.TES_FIELDS[currentYear];
  
  c.innerHTML = fields.map(f => `
    <label>${f.label} (0-100):</label>
    <input type="number" id="${f.id}" min="0" max="100" placeholder="0-100" required>
    <span class="max-hint">Maks: 100</span>
  `).join('');
  
  hint.textContent = currentYear === '2026' 
    ? 'TKA & TKAD diisi nilai rerata/murni per mapel' 
    : 'ASPD diisi nilai total/rerata';
  document.getElementById('tes-required').style.display = 'none';
  
  fields.forEach(f => {
    const inp = document.getElementById(f.id); if(!inp) return;
    inp.addEventListener('input', function() {
      if(parseFloat(this.value)>100) { this.value=100; this.classList.add('error'); setTimeout(()=>this.classList.remove('error'),300); toast('Nilai dibatasi maks 100'); }
      this.classList.remove('required-empty'); showHint('tes-required',false); lastShortLink='';
    });
  });
}

function renderRapor() {
  const c = document.getElementById('rapor-inputs');
  c.innerHTML = CONFIG.MAPEL_RAPOR.map(m => {
    const sems = CONFIG.SEMESTERS.map(s => `
      <div class="semester-item"><label>${s}</label>
      <input type="number" id="rapor_${m.id}_${s}" min="0" max="100" placeholder="-" required></div>`).join('');
    return `<div class="subject-card"><div class="subject-title"><span>${m.label}</span><span class="subject-avg" id="avg_${m.id}">Rata-rata: -</span></div><div class="semester-grid">${sems}</div></div>`;
  }).join('');
  
  CONFIG.MAPEL_RAPOR.forEach(m => CONFIG.SEMESTERS.forEach(s => {
    const id = `rapor_${m.id}_${s}`, inp = document.getElementById(id); if(!inp) return;
    inp.addEventListener('input', function() {
      if(parseFloat(this.value)>100) { this.value=100; this.classList.add('error'); setTimeout(()=>this.classList.remove('error'),300); toast('Nilai dibatasi maks 100'); }
      this.classList.remove('required-empty'); showHint('rapor-required',false); lastShortLink=''; updateAvg(m.id);
    });
  }));
}

function updateAvg(mid) {
  let tot=0, cnt=0; CONFIG.SEMESTERS.forEach(s => { const v=getVal(`rapor_${mid}_${s}`); if(v!==null){tot+=v;cnt++;} });
  const avg = cnt>0?tot/cnt:null, el=document.getElementById(`avg_${mid}`);
  if(el) el.textContent = avg!==null?`Rata-rata: ${avg.toFixed(2)}`:'Rata-rata: -';
  return avg;
}

// ================= TOGGLE & FORMULA =================
function updateFormula() {
  currentYear = document.querySelector('input[name="tahun"]:checked').value;
  localStorage.setItem('btl_tahun', currentYear);
  renderTesInputs();
  
  const el = document.getElementById('formula-info');
  if(currentYear === '2026') {
    el.innerHTML = `📐 <strong>Rumus Juknis 2026:</strong><br>NG = (20% × Rerata Rapor) + (50% × Rerata TKA) + (30% × TKAD)<br><small style="color:#666">NA = NG + Prestasi (khusus Jalur Prestasi)</small>`;
  } else {
    el.innerHTML = `📐 <strong>Rumus Sebelum 2026:</strong><br>NG = (40% × Rerata Rapor) + (60% × ASPD)<br><small style="color:#666">NA = NG + Prestasi (khusus Jalur Prestasi)</small>`;
  }
  toast(`📅 Tahun: ${currentYear}`);
}

function toggleJalur() {
  jalurAktif = document.querySelector('input[name="jalur"]:checked').value;
  localStorage.setItem('btl_jalur', jalurAktif);
  const isPrestasi = jalurAktif==='prestasi';
  document.getElementById('prestasi').disabled = !isPrestasi;
  document.getElementById('prestasi-section').style.opacity = isPrestasi ? '1' : '0.6';
  toast(isPrestasi ? '🏆 Jalur Prestasi (NA = NG + Prestasi)' : '🏠 Jalur Domisili (Seleksi pakai NG)');
  lastShortLink='';
  const out=document.getElementById('hasil'); if(out&&out.querySelector('.final')) hitung();
}

// ================= SHORTENER (Base64) =================
function toB64(s) { return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function fromB64(s) { const p='=='.slice((s.length+2)%4); return atob(s.replace(/-/g,'+').replace(/_/g,'/')+p); }

function serialize() {
  const d = { tahun: currentYear, jalur: jalurAktif, prestasi: getVal('prestasi'), rapor: {}, tes: {} };
  CONFIG.TES_FIELDS[currentYear].forEach(f => { const v=getVal(f.id); if(v!==null) d.tes[f.id]=v; });
  CONFIG.MAPEL_RAPOR.forEach(m => { d.rapor[m.id]={}; CONFIG.SEMESTERS.forEach(s => { const v=getVal(`rapor_${m.id}_${s}`); if(v!==null) d.rapor[m.id][s]=v; }); });
  return toB64(JSON.stringify(d));
}
function deserialize(code) { try { return JSON.parse(fromB64(code)); } catch(e) { return null; } }

function makeLink() { return `${window.location.origin}${window.location.pathname}?v=${serialize()}`; }
async function copyShortLink() {
  const btn=document.getElementById('copyBtn'), txt=document.getElementById('copyText'), disp=document.getElementById('shortUrlDisplay');
  if(!lastShortLink) lastShortLink=makeLink();
  try { await navigator.clipboard.writeText(lastShortLink); btn.classList.add('copied'); txt.textContent='✅ Tersalin!'; disp.textContent=lastShortLink; disp.classList.add('show'); toast('📋 Link disalin!'); setTimeout(()=>{btn.classList.remove('copied');txt.textContent='Salin Link Pendek';},2000); }
  catch { disp.textContent=lastShortLink; disp.classList.add('show'); toast('📋 Salin manual'); }
}

function loadFromURL() {
  const v=new URLSearchParams(window.location.search).get('v'); if(!v) return false;
  const d=deserialize(v); if(!d) { toast('⚠️ Link rusak'); return false; }
  if(d.tahun) document.querySelector(`input[name="tahun"][value="${d.tahun}"]`)?.click();
  if(d.jalur) document.querySelector(`input[name="jalur"][value="${d.jalur}"]`)?.click();
  if(d.tes) Object.entries(d.tes).forEach(([id,val])=>{ const i=document.getElementById(id); if(i) i.value=val; });
  if(d.prestasi!==null) document.getElementById('prestasi').value=d.prestasi;
  if(d.rapor) Object.entries(d.rapor).forEach(([mid,sems])=>Object.entries(sems).forEach(([s,val])=>{ const i=document.getElementById(`rapor_${mid}_${s}`); if(i){i.value=val;updateAvg(mid);} }));
  setTimeout(()=>{hitung();toast('📥 Data dimuat!')},300);
  return true;
}

// ================= MAIN CALCULATION =================
function hitung() {
  let err=false, eT=[], eR=[];
  CONFIG.TES_FIELDS[currentYear].forEach(f => {
    if(isEmpty(f.id)) { markReq(f.id,true); eT.push(f.label); err=true; } else markReq(f.id,false);
  });
  if(eT.length>0) showHint('tes-required',true);

  CONFIG.MAPEL_RAPOR.forEach(m => CONFIG.SEMESTERS.forEach(s => {
    const id=`rapor_${m.id}_${s}`;
    if(isEmpty(id)) { markReq(id,true); if(eR.length<3)eR.push(`${m.label} ${s}`); err=true; } else markReq(id,false);
  }));
  if(eR.length>0) showHint('rapor-required',true);

  if(err) {
    const m = eT.length>0?`⚠️ Lengkapi: ${eT.slice(0,2).join(', ')}`:`⚠️ Isi rapor: ${eR.join(', ')}`;
    document.getElementById('hasil').innerHTML=`<div class="error-msg">${m}</div>`; toast('⚠️ Lengkapi input wajib',3000); return;
  }
  showHint('tes-required',false); showHint('rapor-required',false);

  // 1. Hitung Rerata Rapor (15 nilai / 15)
  let totalRapor=0, dr='';
  CONFIG.MAPEL_RAPOR.forEach(m => {
    const avg=updateAvg(m.id); totalRapor+=avg;
    dr+=`📊 ${m.label}: <strong>${avg.toFixed(2)}</strong><br>`;
  });
  const rerataRapor = totalRapor / CONFIG.MAPEL_RAPOR.length;
  const w = CONFIG.WEIGHTS[currentYear];

  // 2. Hitung NG sesuai tahun
  let NG = 0, tesLabel = '';
  if(currentYear === '2026') {
    const tka_mtk = getVal('tka_mtk'), tka_indo = getVal('tka_indo'), tkad = getVal('tkad');
    const rerataTka = (tka_mtk + tka_indo) / 2;
    NG = (rerataRapor * w.rapor) + (rerataTka * w.tka) + (tkad * w.tkad);
    tesLabel = `TKA MTK: ${tka_mtk} | TKA B.Indo: ${tka_indo} | TKAD: ${tkad} <br><small style="color:#666">Rerata TKA: ${rerataTka.toFixed(2)}</small>`;
  } else {
    const aspd = getVal('aspd');
    NG = (rerataRapor * w.rapor) + (aspd * w.aspd);
    tesLabel = `ASPD: ${aspd}`;
  }

  // 3. Hitung NA & Clamp Prestasi
  let prestasi = jalurAktif==='prestasi' ? (getVal('prestasi')||0) : 0;
  if(prestasi > CONFIG.MAX_PRESTASI) prestasi = CONFIG.MAX_PRESTASI;
  const NA = NG + prestasi;

  // 4. Output
  const finalVal = jalurAktif==='prestasi' ? NA : NG;
  const labelJalur = jalurAktif==='prestasi' ? '🏆 Prestasi Umum (NA)' : '🏠 Domisili Wilayah (NG)';
  const output = `
    <strong>Jalur: ${labelJalur}</strong> | Tahun: ${currentYear.toUpperCase()}<br><br>
    📚 <strong>Rerata Rapor (15 input):</strong> ${rerataRapor.toFixed(2)}<br>${dr}
    🎓 <strong>Nilai Tes:</strong><br>${tesLabel}<br><br>
    🧮 <strong>Nilai Gabungan (NG):</strong> ${NG.toFixed(2)}<br>
    ${jalurAktif==='prestasi' ? `🎖️ <strong>Tambahan Prestasi:</strong> ${prestasi}<br>` : ''}
    <span class="final">🎯 NILAI SELEKSI: ${finalVal.toFixed(2)}</span>
    <br><small style="color:#666">💡 Max NG: 100.00 | Max NA: 107.50</small>
  `;

  const ob=document.getElementById('hasil'); ob.innerHTML=output; ob.classList.remove('flash'); void ob.offsetWidth; ob.classList.add('flash');
  saveData(); lastShortLink=''; toast('✅ Perhitungan selesai!');
}

// ================= LOCALSTORAGE =================
function saveData() {
  const d={tahun:currentYear, jalur:jalurAktif, prestasi:document.getElementById('prestasi')?.value};
  CONFIG.TES_FIELDS[currentYear].forEach(f => { d[f.id] = document.getElementById(f.id)?.value; });
  CONFIG.MAPEL_RAPOR.forEach(m=>CONFIG.SEMESTERS.forEach(s=>{d[`rapor_${m.id}_${s}`]=document.getElementById(`rapor_${m.id}_${s}`)?.value;}));
  localStorage.setItem('btl_data', JSON.stringify(d));
}
function loadData() {
  try {
    const d=JSON.parse(localStorage.getItem('btl_data')); if(!d) return;
    if(d.tahun) document.querySelector(`input[name="tahun"][value="${d.tahun}"]`)?.click();
    if(d.jalur) document.querySelector(`input[name="jalur"][value="${d.jalur}"]`)?.click();
    if(d.prestasi!==undefined) document.getElementById('prestasi').value=d.prestasi;
    CONFIG.TES_FIELDS[currentYear].forEach(f => { if(d[f.id]!==undefined) document.getElementById(f.id).value=d[f.id]; });
    CONFIG.MAPEL_RAPOR.forEach(m=>CONFIG.SEMESTERS.forEach(s=>{const id=`rapor_${m.id}_${s}`; if(d[id]!==undefined){document.getElementById(id).value=d[id];updateAvg(m.id);}}));
  } catch(e){}
}
function resetForm() {
  localStorage.removeItem('btl_data');
  document.querySelectorAll('input[type="number"]').forEach(i=>{i.value='';i.classList.remove('error','required-empty');});
  document.getElementById('hasil').innerHTML='<em>✅ Form direset.</em>'; lastShortLink=''; clickCount=0; popUnderOpened=false;
  toast('🔄 Data dihapus');
}

// ================= SHARE WA =================
function shareToWhatsApp(mode) {
  let msg='', url=lastShortLink||makeLink();
  if(mode==='withValues') {
    const out=document.getElementById('hasil'); 
    const ng=out?.textContent?.match(/NG:\s*([\d.]+)/)?.[1]||'0';
    const na=out?.textContent?.match(/NA:\s*([\d.]+)/)?.[1]||'0';
    const final=out?.textContent?.match(/SELEKSI:\s*([\d.]+)/)?.[1]||'0';
    msg=`🎓 *Simulasi SPMB Bantul*\n*Jalur: ${jalurAktif==='prestasi'?'Prestasi':'Domisili'}*\n\nNG: ${ng}\n${jalurAktif==='prestasi'?'NA: '+na+'\n':''}\n🎯 Nilai: ${final}\n\n💡 Cek di: ${url}`;
  } else {
    msg=`🎓 *Kalkulator SPMB SMP Bantul*\n\nHitung peluangmu dengan Juknis terbaru!\n✅ Jalur Domisili & Prestasi\n✅ Perhitungan Otomatis\n\n🔗 ${window.location.origin}${window.location.pathname}\n\nGratis! 💙`;
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank');
  toast('📤 Membuka WA...');
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  renderTesInputs();
  renderRapor();
  const savedJalur = localStorage.getItem('btl_jalur');
  if(savedJalur) { document.querySelector(`input[name="jalur"][value="${savedJalur}"]`)?.click(); } else { toggleJalur(); }
  
  if(!loadFromURL()) loadData();
  
  document.querySelectorAll('input[name="tahun"]').forEach(r=>r.addEventListener('change',updateFormula));
  document.querySelectorAll('input[name="jalur"]').forEach(r=>r.addEventListener('change',toggleJalur));
});
