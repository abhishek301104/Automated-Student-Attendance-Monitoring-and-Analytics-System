let token=localStorage.getItem('attendx_token');
let currentUser=null, studentsCache=[], subjectsCache=[];

const $=id=>document.getElementById(id);
function toast(msg){const x=document.createElement('div');x.className='toast';x.textContent=msg;$('toast').appendChild(x);setTimeout(()=>x.remove(),2500)}
async function api(url,opts={}){opts.headers={...(opts.headers||{}),...(token?{Authorization:'Bearer '+token}:{})};const r=await fetch(url,opts);if(!r.ok){let e={};try{e=await r.json()}catch{};throw new Error(e.error||'Request failed')}return r.headers.get('content-type')?.includes('application/json')?r.json():r;}
function show(view){document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));$(view).classList.remove('hidden');document.querySelectorAll('.sidebar button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const f={dashboard:loadDashboard,students:loadStudents,mark:loadMark,records:loadRecords,defaulters:loadDefaulters,myattendance:loadMyAttendance,notifications:loadNotifications}[view];if(f)f()}
function setupNav(){document.querySelectorAll('.sidebar button').forEach(b=>b.onclick=()=>show(b.dataset.view));$('logoutBtn').onclick=()=>{localStorage.removeItem('attendx_token');location.reload()}}
async function init(){
 if(!token){$('loginPage').classList.remove('hidden');$('appPage').classList.add('hidden');return}
 try{currentUser=await api('/api/me');$('loginPage').classList.add('hidden');$('appPage').classList.remove('hidden');$('userName').textContent=currentUser.name+' · '+currentUser.role;
 document.querySelectorAll('.admin-only').forEach(x=>x.classList.toggle('hidden',currentUser.role!=='admin'));document.querySelectorAll('.student-only').forEach(x=>x.classList.toggle('hidden',currentUser.role!=='student'));setupNav();show('dashboard')}
 catch(e){localStorage.removeItem('attendx_token');location.reload()}
}
$('loginForm').onsubmit=async e=>{e.preventDefault();try{const r=await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('email').value,password:$('password').value})});token=r.token;localStorage.setItem('attendx_token',token);init()}catch(e){toast(e.message)}};

async function loadDashboard(){
 if(currentUser?.role==='student'){show('myattendance');return}
 try{const d=await api('/api/dashboard');$('kStudents').textContent=d.students;$('kRecords').textContent=d.records;$('kOverall').textContent=d.overall+'%';$('kDefaulters').textContent=d.defaulters;$('kToday').textContent=d.today;
 drawTrend(d.trend);$('distribution').innerHTML=`<div>🟢 Good: <b>${d.distribution.good||0}</b></div><div>🟡 Warning: <b>${d.distribution.warning||0}</b></div><div>🔴 Critical: <b>${d.distribution.critical||0}</b></div>`}
 catch(e){toast(e.message)}
}
function drawTrend(data){const c=$('trendChart'),ctx=c.getContext('2d'),w=c.width=c.clientWidth*2,h=c.height=280*2;ctx.scale(2,2);const W=c.clientWidth,H=280;ctx.clearRect(0,0,W,H);if(!data.length){ctx.fillText('No data yet',20,40);return}const max=100;ctx.beginPath();data.forEach((p,i)=>{const x=30+i*(W-50)/(data.length-1||1),y=H-30-(p.percentage/max)*(H-60);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();data.forEach((p,i)=>{const x=30+i*(W-50)/(data.length-1||1),y=H-30-(p.percentage/max)*(H-60);ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill()})}

async function loadStudents(){try{studentsCache=await api('/api/students?q='+encodeURIComponent($('studentSearch')?.value||''));$('studentsTable').innerHTML=studentsCache.map(s=>`<tr><td>${s.roll_no}</td><td>${s.name}</td><td>${s.email}</td><td>${s.department}</td><td>${s.semester}</td><td>${s.attendance_percentage||0}%</td><td><button class="ghost" onclick="deleteStudent(${s.id})">Delete</button></td></tr>`).join('')}catch(e){toast(e.message)}}
function showStudentForm(){$('studentForm').classList.remove('hidden')}
async function addStudent(){const body={roll_no:$('sRoll').value,name:$('sName').value,email:$('sEmail').value,department:$('sDept').value,semester:$('sSem').value,phone:$('sPhone').value};try{await api('/api/students',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});toast('Student added');$('studentForm').classList.add('hidden');document.querySelectorAll('#studentForm input').forEach(x=>{if(x.id!=='sDept'&&x.id!=='sSem')x.value=''});loadStudents()}catch(e){toast(e.message)}}
async function deleteStudent(id){if(!confirm('Delete this student and attendance records?'))return;try{await api('/api/students/'+id,{method:'DELETE'});toast('Student deleted');loadStudents()}catch(e){toast(e.message)}}

async function loadSubjects(){subjectsCache=await api('/api/subjects');const opts='<option value="">Select subject</option>'+subjectsCache.map(s=>`<option value="${s.id}">${s.code} - ${s.name}</option>`).join('');$('markSubject').innerHTML=opts;$('recordSubject').innerHTML=opts}
async function loadMark(){try{await loadSubjects();studentsCache=await api('/api/students');if(!$('markDate').value)$('markDate').value=new Date().toISOString().slice(0,10);$('markTable').innerHTML=studentsCache.map(s=>`<tr data-student="${s.id}"><td>${s.roll_no}</td><td>${s.name}</td><td><select class="status"><option value="present">Present</option><option value="absent">Absent</option></select></td></tr>`).join('')}catch(e){toast(e.message)}}
function selectAllStatus(v){document.querySelectorAll('#markTable .status').forEach(x=>x.value=v)}
async function saveAttendance(){const subject_id=$('markSubject').value,date=$('markDate').value;if(!subject_id||!date)return toast('Select subject and date');const records=[...document.querySelectorAll('#markTable tr')].map(r=>({student_id:r.dataset.student,status:r.querySelector('.status').value}));try{const r=await api('/api/attendance/bulk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subject_id,date,records})});toast(r.message);loadDashboard()}catch(e){toast(e.message)}}

async function loadRecords(){try{if(!$('recordSubject').options.length)await loadSubjects();const q=new URLSearchParams();if($('recordDate').value)q.set('date',$('recordDate').value);if($('recordSubject').value)q.set('subject_id',$('recordSubject').value);const rows=await api('/api/attendance?'+q.toString());$('recordsTable').innerHTML=rows.map(r=>`<tr><td>${new Date(r.attendance_date).toLocaleDateString()}</td><td>${r.roll_no}</td><td>${r.name}</td><td>${r.code} - ${r.subject_name}</td><td class="status-${r.status}">${r.status}</td></tr>`).join('')}catch(e){toast(e.message)}}
async function loadDefaulters(){try{const rows=await api('/api/defaulters');$('defaultersTable').innerHTML=rows.map(r=>`<tr><td>${r.roll_no}</td><td>${r.name}</td><td>${r.total_classes}</td><td>${r.present}</td><td class="status-absent">${r.percentage}%</td></tr>`).join('')}catch(e){toast(e.message)}}
async function generateAlerts(){try{const r=await api('/api/notifications/generate',{method:'POST'});toast(r.message)}catch(e){toast(e.message)}}

async function loadMyAttendance(){try{const d=await api('/api/my-attendance');$('mySummary').innerHTML=d.summary.map(s=>`<div class="mini-card"><b>${s.code}</b><div>${s.name}</div><strong>${s.percentage||0}%</strong><div class="muted">${s.present||0}/${s.total||0} present</div></div>`).join('');$('myHistory').innerHTML=d.history.map(h=>`<tr><td>${new Date(h.attendance_date).toLocaleDateString()}</td><td>${h.code} - ${h.name}</td><td class="status-${h.status}">${h.status}</td></tr>`).join('')}catch(e){toast(e.message)}}
async function loadNotifications(){try{const n=await api('/api/notifications');$('notificationList').innerHTML=n.length?n.map(x=>`<div class="notification"><b>${x.title}</b><p>${x.message}</p><small>${new Date(x.created_at).toLocaleString()}</small></div>`).join(''):'<div class="panel">No alerts.</div>'}catch(e){toast(e.message)}}
async function downloadFile(url){try{const r=await fetch(url,{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw new Error('Export failed');const blob=await r.blob();const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=url.includes('excel')?'attendance-report.xlsx':'attendance-report.pdf';a.click();URL.revokeObjectURL(a.href)}catch(e){toast(e.message)}}

init();
