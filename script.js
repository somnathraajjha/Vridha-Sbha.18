const $ = (id) => document.getElementById(id);
const STORAGE = {users:"vs_users", requests:"vs_requests", current:"vs_current_user"};
const getData = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const saveData = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let pendingService = "";

$("year").textContent = new Date().getFullYear();

function openModal(id){ $(id).classList.add("show"); $(id).setAttribute("aria-hidden","false"); }
function closeModals(){ document.querySelectorAll(".modal-backdrop").forEach(m=>{m.classList.remove("show");m.setAttribute("aria-hidden","true");}); }
document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",closeModals));
document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModals();}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModals();});

function setRole(role){
  $("role").value=role;
  $("workerFields").classList.toggle("hidden",role!=="worker");
  $("authTitle").textContent=role==="worker"?"Join as a helper":"Create your account";
}
document.querySelectorAll("[data-open-auth]").forEach(b=>b.addEventListener("click",()=>{setRole(b.dataset.openAuth);openModal("authModal");}));
$("role").addEventListener("change",e=>setRole(e.target.value));
$("menuToggle").addEventListener("click",()=>$("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("mainNav").classList.remove("open")));

$("authForm").addEventListener("submit",e=>{
  e.preventDefault();
  const role=$("role").value, phone=$("phone").value.trim();
  if(!/^[6-9]\d{9}$/.test(phone)){alert("Please enter a valid 10-digit Indian mobile number.");return;}
  const users=getData(STORAGE.users);
  let user=users.find(u=>u.phone===phone && u.role===role);
  const fresh={id:"U"+Date.now(),name:$("fullName").value.trim(),phone,city:$("city").value.trim(),role,skills:$("skills").value.trim()};
  if(user){Object.assign(user,fresh,{id:user.id});}else{user=fresh;users.push(user);}
  saveData(STORAGE.users,users);
  localStorage.setItem(STORAGE.current,JSON.stringify(user));
  closeModals();renderDashboard(user);openModal("dashboardModal");
});

function renderDashboard(user){
  $("dashboardTitle").textContent=user.role==="senior"?"Senior Citizen Dashboard":user.role==="worker"?"Helper Dashboard":"Admin Dashboard";
  $("welcomeText").textContent=`Welcome, ${user.name} · ${user.city}`;
  $("dashboardAvatar").textContent=user.role==="senior"?"👵":user.role==="worker"?"🧑‍🔧":"🛡️";
  if(user.role==="admin"){renderAdmin();return;}
  const requests=getData(STORAGE.requests);
  const mine=user.role==="senior"?requests.filter(r=>r.userId===user.id):requests.filter(r=>r.status==="Open" || r.workerId===user.id);
  const total= user.role==="senior"?requests.filter(r=>r.userId===user.id).length:requests.filter(r=>r.workerId===user.id).length;
  const open= user.role==="senior"?requests.filter(r=>r.userId===user.id && r.status==="Open").length:requests.filter(r=>r.status==="Open").length;
  let html=`<div class="dash-grid"><div class="dash-stat"><strong>${total}</strong><span>${user.role==="senior"?"My requests":"My accepted jobs"}</span></div><div class="dash-stat"><strong>${open}</strong><span>Open requests</span></div><div class="dash-stat"><strong>✓</strong><span>Demo account</span></div></div>`;
  if(user.role==="senior"){
    html+=`<div class="dash-panel"><h3>Request a service</h3><form class="request-form" id="requestForm">
      <div><label for="serviceType">Service</label><select id="serviceType" required><option>Grocery & Essentials</option><option>Home Assistance</option><option>Companionship</option><option>Errands & Visits</option></select></div>
      <div><label for="budget">Your budget (₹)</label><input id="budget" type="number" min="1" placeholder="e.g. 300" required></div>
      <div class="wide"><label for="requestNote">What do you need?</label><input id="requestNote" type="text" placeholder="Add a short description" required></div>
      <button class="btn btn-primary" type="submit">Post service request →</button></form></div>`;
  } else {
    html+=`<div class="dash-panel"><h3>Your helper profile</h3><p><b>Skills:</b> ${escapeHtml(user.skills||"Not added")}<br><b>Area:</b> ${escapeHtml(user.city)}</p></div>`;
  }
  html+=`<div class="dash-panel"><h3>${user.role==="senior"?"My service requests":"Available service requests"}</h3><div class="request-list" id="requestList">${renderRequestItems(mine,user)}</div></div>`;
  $("dashboardContent").innerHTML=html;
  if(user.role==="senior")$("requestForm").addEventListener("submit",e=>{
    e.preventDefault();
    const list=getData(STORAGE.requests);
    list.unshift({id:"R"+Date.now(),userId:user.id,userName:user.name,city:user.city,service:$("serviceType").value,budget:Number($("budget").value),note:$("requestNote").value.trim(),status:"Open",workerId:null,workerName:null,created:new Date().toLocaleDateString("en-IN")});
    saveData(STORAGE.requests,list);renderDashboard(user);
  });
  attachRequestActions(user);
}
function renderRequestItems(items,user){
  if(!items.length)return `<p>No requests yet. ${user.role==="worker"?"New requests will appear here.":"Post your first service request above."}</p>`;
  return items.map(r=>`<div class="request-item"><div><strong>${escapeHtml(r.service)} · ₹${r.budget}</strong><small>${escapeHtml(r.city)} · ${escapeHtml(r.note)} · ${r.created}</small>${user.role==="worker"&&r.status==="Open"?`<div class="request-actions"><button class="mini-btn" data-accept="${r.id}">Accept request</button></div>`:""}${user.role==="senior"&&r.status==="Open"?`<div class="request-actions"><button class="mini-btn" data-negotiate="${r.id}">Suggest budget</button><button class="mini-btn danger" data-cancel="${r.id}">Cancel</button></div>`:""}${r.workerName?`<small>Helper: ${escapeHtml(r.workerName)}</small>`:""}</div><span class="status">${r.status}</span></div>`).join("");
}
function attachRequestActions(user){
  document.querySelectorAll("[data-accept]").forEach(b=>b.addEventListener("click",()=>{
    const list=getData(STORAGE.requests),r=list.find(x=>x.id===b.dataset.accept);
    if(r){r.status="Accepted";r.workerId=user.id;r.workerName=user.name;saveData(STORAGE.requests,list);renderDashboard(user);}
  }));
  document.querySelectorAll("[data-cancel]").forEach(b=>b.addEventListener("click",()=>{
    const list=getData(STORAGE.requests),r=list.find(x=>x.id===b.dataset.cancel);
    if(r){r.status="Cancelled";saveData(STORAGE.requests,list);renderDashboard(user);}
  }));
  document.querySelectorAll("[data-negotiate]").forEach(b=>b.addEventListener("click",()=>{
    const list=getData(STORAGE.requests),r=list.find(x=>x.id===b.dataset.negotiate);
    if(!r)return;const amount=prompt(`Current budget: ₹${r.budget}. Enter your suggested budget:`);
    if(amount!==null && Number(amount)>0){r.budget=Number(amount);saveData(STORAGE.requests,list);renderDashboard(user);alert("Budget suggestion updated in this demo.");}
  }));
}
function renderAdmin(){
  const users=getData(STORAGE.users),requests=getData(STORAGE.requests);
  $("dashboardContent").innerHTML=`<div class="dash-grid"><div class="dash-stat"><strong>${users.length}</strong><span>Registered users</span></div><div class="dash-stat"><strong>${users.filter(u=>u.role==="worker").length}</strong><span>Helpers</span></div><div class="dash-stat"><strong>${requests.length}</strong><span>Service requests</span></div></div>
  <div class="dash-panel"><h3>Registered users</h3>${users.length?`<table class="admin-table"><thead><tr><th>Name</th><th>Role</th><th>Area</th></tr></thead><tbody>${users.map(u=>`<tr><td>${escapeHtml(u.name)}</td><td>${u.role}</td><td>${escapeHtml(u.city)}</td></tr>`).join("")}</tbody></table>`:"<p>No users registered yet.</p>"}</div>
  <div class="dash-panel"><h3>All service requests</h3><div class="request-list">${renderRequestItems(requests,{role:"admin"})}</div></div>`;
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

$("logoutButton").addEventListener("click",()=>{localStorage.removeItem(STORAGE.current);closeModals();});
$("adminLogin").addEventListener("click",()=>{
  const admin={id:"ADMIN",name:"Administrator",city:"Vridha Sabha",role:"admin"};
  localStorage.setItem(STORAGE.current,JSON.stringify(admin));renderDashboard(admin);openModal("dashboardModal");
});
document.querySelectorAll("[data-service]").forEach(b=>b.addEventListener("click",()=>{
  pendingService=b.dataset.service;setRole("senior");openModal("authModal");
  $("authForm").dataset.service=pendingService;
}));
$("sosButton").addEventListener("click",()=>{
  alert("SOS DEMO\\nThis is a college project simulation. No emergency message or call has been sent. In a real system, this feature must connect to verified emergency contacts and local emergency services.");
});
const saved=localStorage.getItem(STORAGE.current);
if(saved){try{const user=JSON.parse(saved);renderDashboard(user);}catch(e){localStorage.removeItem(STORAGE.current);}}
