require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendx',
  waitForConnections: true,
  connectionLimit: 10
});

function tokenFor(user){ return jwt.sign({id:user.id,role:user.role,name:user.name},JWT_SECRET,{expiresIn:'8h'}); }

async function auth(req,res,next){
  try{
    const h=req.headers.authorization||'';
    if(!h.startsWith('Bearer ')) return res.status(401).json({error:'Login required'});
    req.user=jwt.verify(h.slice(7),JWT_SECRET); next();
  }catch(e){ return res.status(401).json({error:'Invalid or expired session'}); }
}
function adminOnly(req,res,next){ if(req.user.role!=='admin') return res.status(403).json({error:'Admin access required'}); next(); }

app.get('/api/health', async (req,res)=>{
  try{ await pool.query('SELECT 1'); res.json({ok:true,message:'ATTENDX server and database are running'}); }
  catch(e){ res.status(500).json({ok:false,error:e.message}); }
});

app.post('/api/login', async (req,res)=>{
  try{
    const {email,password}=req.body;
    const [rows]=await pool.query('SELECT * FROM users WHERE email=? LIMIT 1',[email]);
    if(!rows.length || !await bcrypt.compare(password,rows[0].password_hash)) return res.status(401).json({error:'Invalid email or password'});
    res.json({token:tokenFor(rows[0]),user:{id:rows[0].id,name:rows[0].name,email:rows[0].email,role:rows[0].role}});
  }catch(e){res.status(500).json({error:e.message});}
});

app.get('/api/me',auth,async(req,res)=>{
  const [u]=await pool.query('SELECT id,name,email,role FROM users WHERE id=?',[req.user.id]);
  res.json(u[0]||null);
});

app.get('/api/subjects',auth,async(req,res)=>{
  const [rows]=await pool.query('SELECT * FROM subjects ORDER BY semester,name'); res.json(rows);
});

app.get('/api/students',auth,async(req,res)=>{
  try{
    const q=(req.query.q||'').trim();
    const dep=req.query.department||'';
    let sql=`SELECT s.*, ROUND(COALESCE(100*SUM(a.status='present')/NULLIF(COUNT(a.id),0),0),2) attendance_percentage
             FROM students s LEFT JOIN attendance a ON a.student_id=s.id WHERE 1=1`;
    const p=[];
    if(q){sql+=` AND (s.name LIKE ? OR s.roll_no LIKE ? OR s.email LIKE ?)`; p.push(`%${q}%`,`%${q}%`,`%${q}%`);}
    if(dep){sql+=' AND s.department=?';p.push(dep);}
    sql+=' GROUP BY s.id ORDER BY s.name';
    const [rows]=await pool.query(sql,p);res.json(rows);
  }catch(e){res.status(500).json({error:e.message});}
});

app.post('/api/students',auth,adminOnly,async(req,res)=>{
  try{
    const {roll_no,name,email,department='CSE',semester=8,phone}=req.body;
    if(!roll_no||!name||!email) return res.status(400).json({error:'Roll number, name and email are required'});
    const [r]=await pool.query('INSERT INTO students(roll_no,name,email,department,semester,phone) VALUES(?,?,?,?,?,?)',[roll_no,name,email,department,semester,phone||null]);
    res.json({id:r.insertId,message:'Student added'});
  }catch(e){res.status(400).json({error:e.code==='ER_DUP_ENTRY'?'Roll number or email already exists':e.message});}
});

app.put('/api/students/:id',auth,adminOnly,async(req,res)=>{
  try{
    const {roll_no,name,email,department,semester,phone,status}=req.body;
    await pool.query('UPDATE students SET roll_no=?,name=?,email=?,department=?,semester=?,phone=?,status=? WHERE id=?',[roll_no,name,email,department,semester,phone||null,status||'active',req.params.id]);
    res.json({message:'Student updated'});
  }catch(e){res.status(400).json({error:e.message});}
});

app.delete('/api/students/:id',auth,adminOnly,async(req,res)=>{
  try{await pool.query('DELETE FROM students WHERE id=?',[req.params.id]);res.json({message:'Student deleted'});}
  catch(e){res.status(400).json({error:e.message});}
});

app.post('/api/attendance/bulk',auth,adminOnly,async(req,res)=>{
  try{
    const {subject_id,date,records}=req.body;
    if(!subject_id||!date||!Array.isArray(records)) return res.status(400).json({error:'Subject, date and records are required'});
    const conn=await pool.getConnection();
    try{
      await conn.beginTransaction();
      for(const r of records){
        await conn.query(
          `INSERT INTO attendance(student_id,subject_id,attendance_date,status,marked_by)
           VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),marked_by=VALUES(marked_by)`,
          [r.student_id,subject_id,date,r.status,req.user.id]
        );
      }
      await conn.commit();
    }catch(e){await conn.rollback();throw e;}finally{conn.release();}
    res.json({message:`Attendance saved for ${records.length} students`});
  }catch(e){res.status(400).json({error:e.message});}
});

app.get('/api/attendance',auth,async(req,res)=>{
  try{
    const {date,subject_id,student_id}=req.query;
    let sql=`SELECT a.*,s.roll_no,s.name,sub.code,sub.name subject_name
             FROM attendance a JOIN students s ON s.id=a.student_id JOIN subjects sub ON sub.id=a.subject_id WHERE 1=1`;
    const p=[];
    if(date){sql+=' AND a.attendance_date=?';p.push(date);}
    if(subject_id){sql+=' AND a.subject_id=?';p.push(subject_id);}
    if(student_id){sql+=' AND a.student_id=?';p.push(student_id);}
    sql+=' ORDER BY a.attendance_date DESC,s.roll_no';
    const [rows]=await pool.query(sql,p);res.json(rows);
  }catch(e){res.status(500).json({error:e.message});}
});

app.get('/api/dashboard',auth,async(req,res)=>{
  try{
    const [[students]]=await pool.query(`SELECT COUNT(*) total FROM students WHERE status='active'`);
    const [[records]]=await pool.query(`SELECT COUNT(*) total FROM attendance`);
    const [[present]]=await pool.query(`SELECT COUNT(*) total FROM attendance WHERE status='present'`);
    const [[defaulters]]=await pool.query(`SELECT COUNT(*) total FROM (SELECT student_id FROM attendance GROUP BY student_id HAVING 100*SUM(status='present')/COUNT(*) < 75) x`);
    const [[today]]=await pool.query(`SELECT COUNT(*) total FROM attendance WHERE attendance_date=CURDATE()`);
    const [trend]=await pool.query(`
      SELECT DATE_FORMAT(attendance_date,'%Y-%m-%d') day,
             ROUND(100*SUM(status='present')/COUNT(*),2) percentage
      FROM attendance GROUP BY attendance_date ORDER BY attendance_date DESC LIMIT 14`);
    const [distribution]=await pool.query(`
      SELECT
      SUM(pct>=75) good, SUM(pct>=60 AND pct<75) warning, SUM(pct<60) critical
      FROM (
        SELECT student_id,100*SUM(status='present')/COUNT(*) pct FROM attendance GROUP BY student_id
      ) x`);
    res.json({
      students:students.total,records:records.total,present:present.total,
      defaulters:defaulters.total,today:today.total,
      overall:records.total?Number((present.total*100/records.total).toFixed(2)):0,
      trend:trend.reverse(),distribution:distribution[0]||{good:0,warning:0,critical:0}
    });
  }catch(e){res.status(500).json({error:e.message});}
});

app.get('/api/defaulters',auth,async(req,res)=>{
  const [rows]=await pool.query(`
    SELECT s.id,s.roll_no,s.name,s.email,
           COUNT(a.id) total_classes,SUM(a.status='present') present,
           ROUND(100*SUM(a.status='present')/NULLIF(COUNT(a.id),0),2) percentage
    FROM students s JOIN attendance a ON a.student_id=s.id
    GROUP BY s.id HAVING percentage < 75 ORDER BY percentage ASC`);
  res.json(rows);
});

app.get('/api/my-attendance',auth,async(req,res)=>{
  try{
    const [s]=await pool.query('SELECT id FROM students WHERE user_id=?',[req.user.id]);
    if(!s.length) return res.status(404).json({error:'Student profile not linked to this login'});
    const [summary]=await pool.query(`
      SELECT sub.id,sub.code,sub.name,
             COUNT(a.id) total,SUM(a.status='present') present,
             ROUND(100*SUM(a.status='present')/NULLIF(COUNT(a.id),0),2) percentage
      FROM subjects sub LEFT JOIN attendance a ON a.subject_id=sub.id AND a.student_id=?
      GROUP BY sub.id ORDER BY sub.name`,[s[0].id]);
    const [history]=await pool.query(`
      SELECT a.attendance_date,sub.code,sub.name,a.status
      FROM attendance a JOIN subjects sub ON sub.id=a.subject_id
      WHERE a.student_id=? ORDER BY a.attendance_date DESC LIMIT 100`,[s[0].id]);
    res.json({summary,history});
  }catch(e){res.status(500).json({error:e.message});}
});

app.get('/api/notifications',auth,async(req,res)=>{
  if(req.user.role!=='student') return res.json([]);
  const [s]=await pool.query('SELECT id FROM students WHERE user_id=?',[req.user.id]);
  if(!s.length) return res.json([]);
  const [n]=await pool.query('SELECT * FROM notifications WHERE student_id=? ORDER BY created_at DESC LIMIT 50',[s[0].id]);
  res.json(n);
});

app.post('/api/notifications/generate',auth,adminOnly,async(req,res)=>{
  try{
    const [rows]=await pool.query(`
      SELECT s.id,s.name,ROUND(100*SUM(a.status='present')/COUNT(a.id),2) pct
      FROM students s JOIN attendance a ON a.student_id=s.id
      GROUP BY s.id HAVING pct < 75`);
    for(const r of rows){
      await pool.query('INSERT INTO notifications(student_id,title,message) VALUES(?,?,?)',
        [r.id,'Low Attendance Alert',`Your current attendance is ${r.pct}%. Please improve your attendance to reach 75% or above.`]);
    }
    res.json({message:`Generated ${rows.length} low-attendance alerts`});
  }catch(e){res.status(500).json({error:e.message});}
});

async function reportRows(){
  const [rows]=await pool.query(`
    SELECT s.roll_no,s.name,s.department,s.semester,
      COUNT(a.id) total_classes,SUM(a.status='present') present,
      SUM(a.status='absent') absent,
      ROUND(100*SUM(a.status='present')/NULLIF(COUNT(a.id),0),2) percentage
    FROM students s LEFT JOIN attendance a ON a.student_id=s.id
    GROUP BY s.id ORDER BY s.roll_no`);
  return rows;
}
app.get('/api/export/excel',auth,adminOnly,async(req,res)=>{
  try{
    const wb=new ExcelJS.Workbook(); const ws=wb.addWorksheet('Attendance Report');
    ws.columns=[
      {header:'Roll No',key:'roll_no',width:14},{header:'Name',key:'name',width:24},
      {header:'Department',key:'department',width:15},{header:'Semester',key:'semester',width:12},
      {header:'Total Classes',key:'total_classes',width:15},{header:'Present',key:'present',width:12},
      {header:'Absent',key:'absent',width:12},{header:'Attendance %',key:'percentage',width:15}
    ];
    (await reportRows()).forEach(r=>ws.addRow(r));
    ws.getRow(1).font={bold:true}; ws.autoFilter='A1:H1';
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition','attachment; filename=attendance-report.xlsx');
    await wb.xlsx.write(res);res.end();
  }catch(e){res.status(500).json({error:e.message});}
});

app.get('/api/export/pdf',auth,adminOnly,async(req,res)=>{
  try{
    const rows=await reportRows();
    const doc=new PDFDocument({margin:40});
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename=attendance-report.pdf');
    doc.pipe(res);
    doc.fontSize(20).text('ATTENDX - Attendance Report',{align:'center'}).moveDown();
    doc.fontSize(9).text(`Generated: ${new Date().toLocaleString()}`).moveDown();
    rows.forEach(r=>{
      doc.fontSize(10).text(`${r.roll_no} | ${r.name} | Classes: ${r.total_classes||0} | Present: ${r.present||0} | Absent: ${r.absent||0} | ${r.percentage||0}%`);
      doc.moveDown(0.35);
    });
    doc.end();
  }catch(e){res.status(500).json({error:e.message});}
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT,()=>console.log(`ATTENDX running at http://localhost:${PORT}`));
