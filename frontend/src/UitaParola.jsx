import { API_URL } from './config';
import { useState } from 'react';

function UitaParola({ inapoiLaLogin }) {
  const [email, setEmail] = useState('');
  const [mesaj, setMesaj] = useState('');

  async function trimite(event) {
    event.preventDefault();
    const raspuns = await fetch(`${API_URL}/api/uita-parola`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const rezultat = await raspuns.json();
    setMesaj(rezultat.mesaj);
  }

  return (
    <div className="auth-page">
      <div className="card-formular auth-card">
        <h2>Resetare parolă</h2>
        {mesaj ? (
          <p>{mesaj}</p>
        ) : (
          <form onSubmit={trimite}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit">Trimite link de resetare</button>
          </form>
        )}
        <p className="auth-switch">
          <button className="link-buton" onClick={inapoiLaLogin}>Înapoi la autentificare</button>
        </p>
      </div>
    </div>
  );
}

export default UitaParola;