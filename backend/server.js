require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const transportator = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PAROLA }
});

async function creeazaTabele() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS utilizatori (
      id SERIAL PRIMARY KEY,
      nume TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      parola_hash TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'client',
      reset_token TEXT,
      reset_expira BIGINT
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS programari (
      id SERIAL PRIMARY KEY,
      utilizator_id INTEGER NOT NULL REFERENCES utilizatori(id),
      telefon TEXT NOT NULL,
      serviciu TEXT NOT NULL,
      data TEXT NOT NULL,
      ora TEXT NOT NULL,
      status TEXT DEFAULT 'in asteptare'
    )
  `);
  console.log('Tabele verificate/create cu succes');
}
creeazaTabele();

function valideazaProgramare(date) {
  const erori = [];
  const telefonRegex = /^(07[0-9]{8}|0[2-3][0-9]{8})$/;

  if (!date.telefon || !telefonRegex.test(date.telefon.replace(/\s/g, ''))) {
    erori.push('Numărul de telefon nu este valid (ex: 0712345678)');
  }
  if (!date.serviciu || date.serviciu.trim().length < 2) {
    erori.push('Te rugăm specifică tipul de serviciu');
  }
  if (!date.data) {
    erori.push('Data este obligatorie');
  } else {
    const astazi = new Date().toISOString().split('T')[0];
    if (date.data < astazi) erori.push('Data nu poate fi în trecut');
  }
  if (!date.ora) erori.push('Ora este obligatorie');

  return erori;
}


async function existaSuprapunere(data, ora, excludeId = null) {
  let query = "SELECT ora FROM programari WHERE data = $1 AND status != 'anulat'";
  const params = [data];
  if (excludeId) {
    query += ' AND id != $2';
    params.push(excludeId);
  }
  const rezultat = await pool.query(query, params);

  const [oreCerute, minCerute] = ora.split(':').map(Number);
  const totalCerut = oreCerute * 60 + minCerute;

  return rezultat.rows.some(r => {
    const [oreExistente, minExistente] = r.ora.split(':').map(Number);
    const totalExistent = oreExistente * 60 + minExistente;
    return Math.abs(totalExistent - totalCerut) < 60;
  });
}



function autentifica(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ eroare: 'Trebuie să fii autentificat' });
  const token = header.split(' ')[1];
  try {
    req.utilizator = jwt.verify(token, SECRET);
    next();
  } catch (eroare) {
    res.status(401).json({ eroare: 'Token invalid sau expirat' });
  }
}

app.post('/api/inregistrare', async (req, res) => {
  const { nume, email, parola } = req.body;
  const parolaCriptata = await bcrypt.hash(parola, 10);
  try {
    await pool.query(
      'INSERT INTO utilizatori (nume, email, parola_hash, rol) VALUES ($1, $2, $3, $4)',
      [nume, email, parolaCriptata, 'client']
    );
    res.status(201).json({ mesaj: 'Cont creat cu succes' });
  } catch (eroare) {
    res.status(400).json({ eroare: 'Acest email este deja folosit' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, parola } = req.body;
  const rezultat = await pool.query('SELECT * FROM utilizatori WHERE email = $1', [email]);
  const utilizator = rezultat.rows[0];

  if (!utilizator) return res.status(401).json({ eroare: 'Email sau parolă greșite' });

  const parolaCorecta = await bcrypt.compare(parola, utilizator.parola_hash);
  if (!parolaCorecta) return res.status(401).json({ eroare: 'Email sau parolă greșite' });

  const token = jwt.sign(
    { id: utilizator.id, nume: utilizator.nume, rol: utilizator.rol },
    SECRET, { expiresIn: '7d' }
  );
  res.json({ token, utilizator: { id: utilizator.id, nume: utilizator.nume, rol: utilizator.rol } });
});

app.post('/api/uita-parola', async (req, res) => {
  const { email } = req.body;
  const rezultat = await pool.query('SELECT * FROM utilizatori WHERE email = $1', [email]);
  const utilizator = rezultat.rows[0];

  if (!utilizator) return res.json({ mesaj: 'Dacă adresa există, vei primi un email cu instrucțiuni.' });

  const token = crypto.randomBytes(32).toString('hex');
  const expira = Date.now() + 1000 * 60 * 60;
  await pool.query('UPDATE utilizatori SET reset_token = $1, reset_expira = $2 WHERE id = $3',
    [token, expira, utilizator.id]);

  const linkResetare = `${req.headers.origin || process.env.URL_FRONTEND}/?resetare=${token}`;
  try {
    await transportator.sendMail({
      from: process.env.EMAIL_USER,
      to: utilizator.email,
      subject: 'Resetare parolă - AutoService',
      text: `Bună, ${utilizator.nume}! Apasă pe acest link (valabil 1 oră): ${linkResetare}`
    });
  } catch (e) { console.error('Email netrimis:', e.message); }

  res.json({ mesaj: 'Dacă adresa există, vei primi un email cu instrucțiuni.' });
});


app.post('/api/reseteaza-parola', async (req, res) => {
  const { token, parolaNoua } = req.body;

  const rezultat = await pool.query('SELECT * FROM utilizatori WHERE reset_token = $1', [token]);
  const utilizator = rezultat.rows[0];

  if (!utilizator || !utilizator.reset_expira || Number(utilizator.reset_expira) < Date.now()) {
    return res.status(400).json({ eroare: 'Link invalid sau expirat. Cere un link nou.' });
  }
  if (!parolaNoua || parolaNoua.length < 6) {
    return res.status(400).json({ eroare: 'Parola trebuie să aibă minim 6 caractere' });
  }

  const esteAceeasiParola = await bcrypt.compare(parolaNoua, utilizator.parola_hash);
  if (esteAceeasiParola) {
    return res.status(400).json({ eroare: 'Parola nouă trebuie să fie diferită de cea veche' });
  }

  const parolaCriptata = await bcrypt.hash(parolaNoua, 10);
  await pool.query('UPDATE utilizatori SET parola_hash = $1, reset_token = NULL, reset_expira = NULL WHERE id = $2',
    [parolaCriptata, utilizator.id]);

  res.json({ mesaj: 'Parola a fost schimbată cu succes' });
});


app.post('/api/programari', autentifica, async (req, res) => {
  const erori = valideazaProgramare(req.body);
  if (erori.length > 0) return res.status(400).json({ eroare: erori.join('. ') });

  const { telefon, serviciu, data, ora } = req.body;


  const suprapunere = await existaSuprapunere(data, ora);
if (suprapunere) {
  return res.status(409).json({ eroare: 'Mecanicul are programul plin. Alege te rog altă oră.' });
}

  const utilizator_id = req.utilizator.id;
  const inserare = await pool.query(
    'INSERT INTO programari (utilizator_id, telefon, serviciu, data, ora) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [utilizator_id, telefon, serviciu, data, ora]
  );

  const infoRezultat = await pool.query('SELECT nume, email FROM utilizatori WHERE id = $1', [utilizator_id]);
  const utilizatorInfo = infoRezultat.rows[0];

  try {
    await transportator.sendMail({
      from: process.env.EMAIL_USER,
      to: utilizatorInfo.email,
      subject: 'Programarea ta a fost înregistrată',
      text: `Bună, ${utilizatorInfo.nume}! Programarea ta pentru "${serviciu}" pe ${data} la ${ora} a fost înregistrată.`
    });
  } catch (e) { console.error('Email netrimis:', e.message); }

  res.status(201).json({ mesaj: 'Programare înregistrată cu succes', id: inserare.rows[0].id });
});

app.get('/api/programari', autentifica, async (req, res) => {
  if (req.utilizator.rol === 'admin') {
    const rezultat = await pool.query(`
      SELECT programari.*, utilizatori.nume AS nume
      FROM programari JOIN utilizatori ON programari.utilizator_id = utilizatori.id
      ORDER BY data, ora
    `);
    res.json(rezultat.rows);
  } else {
    const rezultat = await pool.query(
      'SELECT * FROM programari WHERE utilizator_id = $1 ORDER BY data, ora',
      [req.utilizator.id]
    );
    res.json(rezultat.rows);
  }
});

app.patch('/api/programari/:id/finalizeaza', autentifica, async (req, res) => {
  const { id } = req.params;
  await pool.query("UPDATE programari SET status = 'finalizat' WHERE id = $1", [id]);

  const rezultat = await pool.query(`
    SELECT programari.*, utilizatori.email, utilizatori.nume
    FROM programari JOIN utilizatori ON programari.utilizator_id = utilizatori.id
    WHERE programari.id = $1
  `, [id]);
  const programare = rezultat.rows[0];

  try {
    await transportator.sendMail({
      from: process.env.EMAIL_USER,
      to: programare.email,
      subject: 'Programarea ta a fost finalizată',
      text: `Bună, ${programare.nume}! Programarea ta pentru "${programare.serviciu}" din ${programare.data} a fost finalizată.`
    });
  } catch (e) { console.error('Email netrimis:', e.message); }

  res.json({ mesaj: 'Programare marcată ca finalizată' });
});



app.patch('/api/programari/:id/anuleaza', autentifica, async (req, res) => {
  const { id } = req.params;

  const rezultat = await pool.query(`
    SELECT programari.*, utilizatori.email, utilizatori.nume
    FROM programari JOIN utilizatori ON programari.utilizator_id = utilizatori.id
    WHERE programari.id = $1
  `, [id]);
  const programare = rezultat.rows[0];

  if (!programare) return res.status(404).json({ eroare: 'Programare inexistentă' });
  if (req.utilizator.rol !== 'admin' && programare.utilizator_id !== req.utilizator.id) {
    return res.status(403).json({ eroare: 'Nu poți anula o programare care nu îți aparține' });
  }

  await pool.query("UPDATE programari SET status = 'anulat' WHERE id = $1", [id]);

  // trimitem email doar dacă ADMINUL anulează — dacă anulează clientul singur, deja știe
  if (req.utilizator.rol === 'admin') {
    try {
      await transportator.sendMail({
        from: process.env.EMAIL_USER,
        to: programare.email,
        subject: 'Programarea ta a fost anulată',
        text: `Bună, ${programare.nume}! Programarea ta pentru "${programare.serviciu}" din ${programare.data} a fost anulată de service. Te rugăm să ne contactezi pentru o nouă programare.`
      });
    } catch (e) { console.error('Email netrimis:', e.message); }
  }

  res.json({ mesaj: 'Programare anulată' });
});



app.put('/api/programari/:id', autentifica, async (req, res) => {
  const { id } = req.params;
  const rezultat = await pool.query('SELECT * FROM programari WHERE id = $1', [id]);
  const programare = rezultat.rows[0];

  if (!programare) return res.status(404).json({ eroare: 'Programare inexistentă' });
  if (programare.utilizator_id !== req.utilizator.id) {
    return res.status(403).json({ eroare: 'Nu poți modifica o programare care nu îți aparține' });
  }
  if (programare.status !== 'in asteptare') {
    return res.status(400).json({ eroare: 'Nu mai poți modifica o programare finalizată sau anulată' });
  }

  const erori = valideazaProgramare(req.body);
  if (erori.length > 0) return res.status(400).json({ eroare: erori.join('. ') });

  const { telefon, serviciu, data, ora } = req.body;

  const suprapunere = await existaSuprapunere(data, ora, id);
  if (suprapunere) {
    return res.status(409).json({ eroare: 'Mecanicul are programul plin. Alege te rog altă oră.' });
  }

  await pool.query(
    'UPDATE programari SET telefon = $1, serviciu = $2, data = $3, ora = $4 WHERE id = $5',
    [telefon, serviciu, data, ora, id]
  );
  res.json({ mesaj: 'Programare actualizată' });
});

app.listen(PORT, () => {
  console.log(`Serverul rulează la http://localhost:${PORT}`);
});