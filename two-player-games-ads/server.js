const express = require('express');
const sqlite = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const bodyParser = require('body-parser');

const DB = new sqlite(path.join(__dirname,'data','app.db'));
DB.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, game TEXT, score TEXT, numeric_score INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id));
`);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change';

app.post('/api/register', async (req,res)=>{ const {email,password} = req.body; if(!email||!password) return res.status(400).json({error:'email and password required'}); const hash = await bcrypt.hash(password,10); try{ const info = DB.prepare('INSERT INTO users(email,password) VALUES(?,?)').run(email,hash); const user = {id: info.lastInsertRowid, email}; const token = jwt.sign(user, JWT_SECRET); res.json({message:'registered', token}); }catch(e){ res.status(400).json({error:'email taken'}); } });

app.post('/api/login', async(req,res)=>{ const {email,password} = req.body; const row = DB.prepare('SELECT * FROM users WHERE email=?').get(email); if(!row) return res.status(400).json({error:'invalid'}); const ok = await bcrypt.compare(password,row.password); if(!ok) return res.status(400).json({error:'invalid'}); const user = {id:row.id,email:row.email}; const token = jwt.sign(user, JWT_SECRET); res.json({message:'ok', token}); });

function auth(req,res,next){ const h = req.headers.authorization; if(!h) return res.status(401).json({error:'no auth'}); const tok = h.split(' ')[1]; try{ const u = jwt.verify(tok, JWT_SECRET); req.user = u; next(); } catch(e){ res.status(401).json({error:'invalid token'}) } }

app.post('/api/score', auth, (req,res)=>{ const {game,score,numeric_score} = req.body; const stmt = DB.prepare('INSERT INTO scores(user_id,game,score,numeric_score) VALUES(?,?,?,?)'); stmt.run(req.user.id, game, String(score), numeric_score||0); res.json({message:'score saved'}); });

app.get('/api/leaderboard/:game', (req,res)=>{ const g = req.params.game; const rows = DB.prepare('SELECT s.id,s.game,s.score,s.numeric_score,s.created_at,u.email FROM scores s JOIN users u ON u.id=s.user_id WHERE s.game=? ORDER BY numeric_score DESC, s.created_at ASC LIMIT 50').all(g); res.json(rows); });

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log('Server running on',port));