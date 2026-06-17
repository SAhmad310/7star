// ── DATA ──
const GALLERY_DATA = [
  {id:1,tag:'sticker-cutting',label:'Holographic Vinyl Stickers',emoji:'🌈',bg:'#1a1a2e',color:'#e0aaff'},
  {id:2,tag:'tshirt-printing',label:'Event T-shirt Collection',emoji:'👕',bg:'#1e3a2f',color:'#4ade80'},
  {id:3,tag:'laser-cutting',label:'Wooden Logo Cutouts',emoji:'🌲',bg:'#2d1b00',color:'#f59e0b'},
  {id:4,tag:'acrylic-nameplate',label:'Office Door Nameplates',emoji:'🏢',bg:'#0f172a',color:'#60a5fa'},
  {id:5,tag:'sticker-cutting',label:'Die-cut Brand Stickers',emoji:'⭐',bg:'#1a0a00',color:'#d4a017'},
  {id:6,tag:'tshirt-printing',label:'Corporate Uniform Set',emoji:'🎽',bg:'#180028',color:'#c084fc'},
  {id:7,tag:'laser-cutting',label:'Acrylic Display Stand',emoji:'💎',bg:'#001a1a',color:'#2dd4bf'},
  {id:8,tag:'acrylic-nameplate',label:'Desk Nameplate — Gold',emoji:'🥇',bg:'#1a1500',color:'#fbbf24'},
  {id:9,tag:'sticker-cutting',label:'Product Label Sheets',emoji:'📦',bg:'#1a0010',color:'#f472b6'},
];

const ORDERS_DATA = [
  {id:'SSP-00047',customer:'Ahmed Khan',email:'ahmed@example.com',phone:'0300-1111111',service:'tshirt-printing',qty:50,status:'pending',date:'2025-06-14'},
  {id:'SSP-00046',customer:'Sara Malik',email:'sara@example.com',phone:'0301-2222222',service:'acrylic-nameplate',qty:5,status:'confirmed',date:'2025-06-13'},
  {id:'SSP-00045',customer:'Usman Tariq',email:'usman@example.com',phone:'0302-3333333',service:'sticker-cutting',qty:200,status:'in_production',date:'2025-06-12'},
  {id:'SSP-00044',customer:'Fatima Riaz',email:'fatima@example.com',phone:'0303-4444444',service:'laser-cutting',qty:10,status:'ready',date:'2025-06-11'},
  {id:'SSP-00043',customer:'Ali Hassan',email:'ali@example.com',phone:'0304-5555555',service:'tshirt-printing',qty:25,status:'delivered',date:'2025-06-10'},
  {id:'SSP-00042',customer:'Nadia Siddiqui',email:'nadia@example.com',phone:'0305-6666666',service:'acrylic-nameplate',qty:3,status:'delivered',date:'2025-06-09'},
];

const CUSTOMERS_DATA = [
  {name:'Ahmed Khan',email:'ahmed@example.com',phone:'0300-1111111',orders:3,joined:'Jan 2025'},
  {name:'Sara Malik',email:'sara@example.com',phone:'0301-2222222',orders:1,joined:'Mar 2025'},
  {name:'Usman Tariq',email:'usman@example.com',phone:'0302-3333333',orders:5,joined:'Nov 2024'},
  {name:'Fatima Riaz',email:'fatima@example.com',phone:'0303-4444444',orders:2,joined:'Apr 2025'},
  {name:'Ali Hassan',email:'ali@example.com',phone:'0304-5555555',orders:4,joined:'Sep 2024'},
];

const STATUS_CLASS = {pending:'status-pending',confirmed:'status-confirmed',in_production:'status-production',ready:'status-ready',delivered:'status-delivered'};
const STATUS_NEXT = {pending:'confirmed',confirmed:'in_production',in_production:'ready',ready:'delivered',delivered:null};

// ── NAV ──
function navClick(el,id){
  document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active'));
  if(el) el.classList.add('active');
  scrollTo(id);
}
function scrollTo(id){
  const el=document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth'});
}
function toggleMenu(){
  document.getElementById('mobile-menu').classList.toggle('open');
}
function closeMenu(){
  document.getElementById('mobile-menu').classList.remove('open');
}

// ── COUNTER ANIMATION ──
function animateCounter(el,target,suffix=''){
  let start=0,dur=1600,step=16;
  const timer=setInterval(()=>{
    start+=Math.ceil(target/(dur/step));
    if(start>=target){start=target;clearInterval(timer);}
    el.textContent=start.toLocaleString()+suffix;
  },step);
}
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      animateCounter(document.getElementById('count-orders'),1240,'+');
      animateCounter(document.getElementById('count-clients'),830,'+');
      animateCounter(document.getElementById('count-years'),9,'+');
      obs.disconnect();
    }
  });
},{threshold:.3});
obs.observe(document.getElementById('home'));

// ── GALLERY ──
let currentFilter='all';
function renderGallery(filter){
  const grid=document.getElementById('gallery-grid');
  const items=filter==='all'?GALLERY_DATA:GALLERY_DATA.filter(i=>i.tag===filter);
  grid.innerHTML=items.map(item=>`
    <div class="gallery-item" style="background:${item.bg}" data-tag="${item.tag}">
      <div class="gallery-thumb gv" style="color:${item.color};font-size:clamp(24px,4vw,52px)">${item.emoji}</div>
      <div class="gallery-overlay">
        <div>
          <div class="gallery-tag">${item.tag.replace('-',' ')}</div>
          <div class="gallery-label">${item.label}</div>
        </div>
      </div>
    </div>
  `).join('');
}
function filterGallery(filter,btn){
  currentFilter=filter;
  document.querySelectorAll('.gallery-filter .filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderGallery(filter);
}
renderGallery('all');

// ── ORDER FORM ──
let currentStep=0;
let uploadedFiles=[];
let selectedService='';

function setSvc(svc){
  selectedService=svc;
  setTimeout(()=>{
    document.querySelectorAll('.service-opt').forEach(el=>{
      el.classList.toggle('selected',el.dataset.svc===svc);
    });
  },400);
}
function selectSvc(el){
  document.querySelectorAll('.service-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  selectedService=el.dataset.svc;
}

function setStep(n){
  document.querySelectorAll('.form-step').forEach((s,i)=>{
    s.classList.toggle('active',i===n);
  });
  for(let i=0;i<4;i++){
    const p=document.getElementById('prog-'+i);
    const l=document.getElementById('plabel-'+i);
    if(p){p.classList.toggle('done',i<n);p.classList.toggle('active',i===n);}
    if(l){l.classList.toggle('active',i===n);}
  }
  currentStep=n;
}

function validateStep(n){
  let ok=true;
  if(n===0){
    const name=document.getElementById('f-name').value.trim();
    const email=document.getElementById('f-email').value.trim();
    const phone=document.getElementById('f-phone').value.trim();
    if(!name){document.getElementById('err-name').textContent='Name is required';ok=false;}else{document.getElementById('err-name').textContent='';}
    if(!email||!/\S+@\S+\.\S+/.test(email)){document.getElementById('err-email').textContent='Valid email required';ok=false;}else{document.getElementById('err-email').textContent='';}
    if(!phone){document.getElementById('err-phone').textContent='Phone is required';ok=false;}else{document.getElementById('err-phone').textContent='';}
  }
  if(n===1){
    if(!selectedService){document.getElementById('err-svc').textContent='Please select a service';ok=false;}else{document.getElementById('err-svc').textContent='';}
    const qty=parseInt(document.getElementById('f-qty').value);
    if(!qty||qty<1){document.getElementById('err-qty').textContent='Quantity must be at least 1';ok=false;}else{document.getElementById('err-qty').textContent='';}
  }
  if(n===2){
    if(uploadedFiles.length===0){document.getElementById('err-files').textContent='Please upload at least one design file';ok=false;}else{document.getElementById('err-files').textContent='';}
  }
  return ok;
}

function nextStep(n){
  if(!validateStep(n))return;
  if(n===2){buildSummary();}
  setStep(n+1);
}
function prevStep(n){setStep(n-1);}

function changeQty(d){
  const inp=document.getElementById('f-qty');
  inp.value=Math.max(1,(parseInt(inp.value)||1)+d);
}

function handleFiles(files){
  Array.from(files).forEach(f=>{
    if(f.size>20*1024*1024){alert('File '+f.name+' exceeds 20 MB limit.');return;}
    if(!uploadedFiles.find(x=>x.name===f.name)) uploadedFiles.push(f);
  });
  renderFileList();
}
function handleDrop(e){
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('dragging');
  handleFiles(e.dataTransfer.files);
}
function handleDragOver(e){e.preventDefault();document.getElementById('upload-zone').classList.add('dragging');}
function handleDragLeave(){document.getElementById('upload-zone').classList.remove('dragging');}
function removeFile(name){
  uploadedFiles=uploadedFiles.filter(f=>f.name!==name);
  renderFileList();
}
function renderFileList(){
  const el=document.getElementById('uploaded-files');
  el.innerHTML=uploadedFiles.map(f=>`
    <div class="file-chip">
      <span>📎 ${f.name} <span style="opacity:.4">(${(f.size/1024).toFixed(1)} KB)</span></span>
      <button onclick="removeFile('${f.name}')" title="Remove">×</button>
    </div>
  `).join('');
}

function buildSummary(){
  const svcLabels={'sticker-cutting':'Sticker Cutting','laser-cutting':'Laser Cutting','tshirt-printing':'T-shirt Printing','acrylic-nameplate':'Acrylic Nameplate'};
  const el=document.getElementById('order-summary');
  el.innerHTML=`
    <h3 style="font-family:var(--font-display);font-size:24px;color:var(--white);letter-spacing:1px;margin-bottom:20px">Order Summary</h3>
    <div class="summary-row"><span>Name</span><strong>${document.getElementById('f-name').value}</strong></div>
    <div class="summary-row"><span>Email</span><strong>${document.getElementById('f-email').value}</strong></div>
    <div class="summary-row"><span>Phone</span><strong>${document.getElementById('f-phone').value}</strong></div>
    ${document.getElementById('f-company').value?`<div class="summary-row"><span>Company</span><strong>${document.getElementById('f-company').value}</strong></div>`:''}
    <div class="summary-row"><span>Service</span><strong>${svcLabels[selectedService]||selectedService}</strong></div>
    <div class="summary-row"><span>Quantity</span><strong>${document.getElementById('f-qty').value}</strong></div>
    ${document.getElementById('f-size').value?`<div class="summary-row"><span>Size</span><strong>${document.getElementById('f-size').value}</strong></div>`:''}
    ${document.getElementById('f-deadline').value?`<div class="summary-row"><span>Deadline</span><strong>${document.getElementById('f-deadline').value}</strong></div>`:''}
    <div class="summary-row"><span>Files</span><strong>${uploadedFiles.map(f=>f.name).join(', ')}</strong></div>
    ${document.getElementById('f-notes').value?`<div class="summary-row" style="border:none"><span>Notes</span><strong style="max-width:60%;text-align:right">${document.getElementById('f-notes').value}</strong></div>`:''}
  `;
}

function submitOrder(){
  const btn=document.getElementById('submit-btn');
  btn.textContent='Processing…';
  btn.disabled=true;
  setTimeout(()=>{
    const orderId='SSP-'+(Math.floor(Math.random()*90000)+10000);
    document.getElementById('success-id').textContent='ORDER #'+orderId;
    document.querySelectorAll('.form-step').forEach(s=>s.classList.remove('active'));
    document.getElementById('step-success').classList.add('active');
    document.getElementById('form-progress').style.display='none';
    document.querySelector('.progress-labels').style.display='none';
    btn.textContent='Place Order ★';
    btn.disabled=false;
    // Add to orders data
    ORDERS_DATA.unshift({
      id:orderId,
      customer:document.getElementById('f-name').value,
      email:document.getElementById('f-email').value,
      phone:document.getElementById('f-phone').value,
      service:selectedService,
      qty:parseInt(document.getElementById('f-qty').value),
      status:'pending',
      date:new Date().toISOString().slice(0,10)
    });
  },1800);
}

function resetForm(){
  uploadedFiles=[];selectedService='';currentStep=0;
  ['f-name','f-email','f-phone','f-company','f-size','f-notes','f-deadline'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value='';
  });
  document.getElementById('f-qty').value=1;
  document.getElementById('uploaded-files').innerHTML='';
  document.querySelectorAll('.service-opt').forEach(e=>e.classList.remove('selected'));
  document.querySelectorAll('.form-step').forEach((s,i)=>{s.classList.toggle('active',i===0);});
  document.getElementById('form-progress').style.display='flex';
  document.querySelector('.progress-labels').style.display='flex';
  setStep(0);
}

// ── CONTACT FORM ──
function submitContact(){
  const name=document.getElementById('c-name').value.trim();
  const email=document.getElementById('c-email').value.trim();
  const msg=document.getElementById('c-msg').value.trim();
  if(!name||!email||!msg){alert('Please fill in Name, Email, and Message.');return;}
  setTimeout(()=>{
    document.getElementById('contact-success').classList.add('show');
    document.getElementById('c-name').value='';
    document.getElementById('c-email').value='';
    document.getElementById('c-phone').value='';
    document.getElementById('c-msg').value='';
    document.getElementById('c-subject').selectedIndex=0;
  },600);
}

// ── ADMIN ──
function openAdminLogin(){
  document.getElementById('admin-login').classList.add('show');
}
function doLogin(){
  const user=document.getElementById('admin-user').value;
  const pass=document.getElementById('admin-pass').value;
  if(user==='admin'&&pass==='admin123'){
    document.getElementById('admin-login').classList.remove('show');
    document.getElementById('admin-panel').classList.add('show');
    renderAdminDashboard();
  } else {
    document.getElementById('login-error').classList.add('show');
  }
}
function logoutAdmin(){
  document.getElementById('admin-panel').classList.remove('show');
}

function adminTab(name,el){
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  el.classList.add('active');
  if(name==='orders')renderOrdersTable(ORDERS_DATA);
  if(name==='gallery')renderGalleryAdmin();
  if(name==='customers')renderCustomers();
}

function renderAdminDashboard(){
  const tbody=document.getElementById('dash-recent-orders');
  tbody.innerHTML=ORDERS_DATA.slice(0,5).map(o=>orderRow(o,true)).join('');
  renderOrdersTable(ORDERS_DATA);
  renderGalleryAdmin();
  renderCustomers();
}

function orderRow(o,mini=false){
  const svcLabels={'sticker-cutting':'Sticker Cutting','laser-cutting':'Laser Cutting','tshirt-printing':'T-shirt Printing','acrylic-nameplate':'Acrylic Nameplate'};
  const sc=STATUS_CLASS[o.status]||'status-pending';
  const statusLabel=o.status.replace('_',' ');
  if(mini){
    return `<tr>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--star)">${o.id}</td>
      <td>${o.customer}</td>
      <td style="font-family:var(--font-mono);font-size:11px">${svcLabels[o.service]||o.service}</td>
      <td><span class="status-badge ${sc}">${statusLabel}</span></td>
      <td style="color:rgba(255,255,255,.35);font-size:12px">${o.date}</td>
      <td><button class="admin-action" onclick="advanceStatus('${o.id}')">Advance</button></td>
    </tr>`;
  }
  return `<tr id="orow-${o.id}">
    <td style="font-family:var(--font-mono);font-size:12px;color:var(--star)">${o.id}</td>
    <td>${o.customer}</td>
    <td style="font-family:var(--font-mono);font-size:11px">${svcLabels[o.service]||o.service}</td>
    <td>${o.qty}</td>
    <td><span class="status-badge ${sc}" id="badge-${o.id}">${statusLabel}</span></td>
    <td style="color:rgba(255,255,255,.35);font-size:12px">${o.date}</td>
    <td style="display:flex;gap:6px;flex-wrap:wrap">
      ${STATUS_NEXT[o.status]?`<button class="admin-action" onclick="advanceStatus('${o.id}')">Advance</button>`:''}
      <button class="admin-action danger" onclick="deleteOrder('${o.id}')">Delete</button>
    </td>
  </tr>`;
}

function renderOrdersTable(data){
  document.getElementById('orders-tbody').innerHTML=data.map(o=>orderRow(o)).join('');
}

function advanceStatus(id){
  const order=ORDERS_DATA.find(o=>o.id===id);
  if(!order||!STATUS_NEXT[order.status])return;
  order.status=STATUS_NEXT[order.status];
  renderOrdersTable(ORDERS_DATA);
  renderAdminDashboard();
}
function deleteOrder(id){
  if(!confirm('Delete order '+id+'?'))return;
  const idx=ORDERS_DATA.findIndex(o=>o.id===id);
  if(idx>-1)ORDERS_DATA.splice(idx,1);
  renderOrdersTable(ORDERS_DATA);
}
function filterOrders(status,btn){
  document.querySelectorAll('#tab-orders .filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const filtered=status==='all'?ORDERS_DATA:ORDERS_DATA.filter(o=>o.status===status);
  renderOrdersTable(filtered);
}

// Gallery admin
const GALLERY_APPROVED=[1,3,5,7];
function renderGalleryAdmin(){
  const grid=document.getElementById('gallery-admin-grid');
  grid.innerHTML=GALLERY_DATA.map(item=>`
    <div class="gallery-admin-item" id="gadm-${item.id}">
      <div class="gallery-admin-thumb" style="background:${item.bg};color:${item.color}">${item.emoji}</div>
      ${GALLERY_APPROVED.includes(item.id)?'<span class="approved-badge">Approved</span>':''}
      <div class="gallery-admin-info">
        <p title="${item.label}">${item.label}</p>
        <div class="gallery-admin-actions">
          <button class="admin-action" onclick="toggleApprove(${item.id})">${GALLERY_APPROVED.includes(item.id)?'Unapprove':'Approve'}</button>
          <button class="admin-action danger" onclick="deleteGallery(${item.id})">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}
function toggleApprove(id){
  const idx=GALLERY_APPROVED.indexOf(id);
  if(idx>-1)GALLERY_APPROVED.splice(idx,1);else GALLERY_APPROVED.push(id);
  renderGalleryAdmin();
}
function deleteGallery(id){
  if(!confirm('Remove this gallery item?'))return;
  const idx=GALLERY_DATA.findIndex(g=>g.id===id);
  if(idx>-1)GALLERY_DATA.splice(idx,1);
  renderGalleryAdmin();
  renderGallery(currentFilter);
}

function renderCustomers(){
  document.getElementById('customers-tbody').innerHTML=CUSTOMERS_DATA.map(c=>`
    <tr>
      <td>${c.name}</td>
      <td style="font-size:13px;color:rgba(255,255,255,.5)">${c.email}</td>
      <td style="font-family:var(--font-mono);font-size:12px">${c.phone}</td>
      <td style="color:var(--star);font-family:var(--font-mono)">${c.orders}</td>
      <td style="color:rgba(255,255,255,.35);font-size:12px">${c.joined}</td>
    </tr>
  `).join('');
}

// Active nav on scroll
window.addEventListener('scroll',()=>{
  const sections=['home','about','services','gallery','order','contact'];
  let current='home';
  sections.forEach(id=>{
    const el=document.getElementById(id);
    if(el&&window.scrollY>=el.offsetTop-120) current=id;
  });
  document.querySelectorAll('.nav-links a').forEach(a=>{
    a.classList.toggle('active',a.getAttribute('href')==='#'+current);
  });
});