import { API_URL } from './config';
import { useState } from 'react';

function Login({ onAutentificare, mergiLaInregistrare, mergiLaUitaParola }) {
  const [date, setDate] = useState({ email: '', parola: '' });
  const [eroare, setEroare] = useState('');

  function actualizeazaCamp(event) {
    const { name, value } = event.target;
    setDate(prev => ({ ...prev, [name]: value }));
  }

  async function trimite(event) {
    event.preventDefault();
    setEroare('');

    try {
      const raspuns = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(date)
      });

      const rezultat = await raspuns.json();

      if (!raspuns.ok) {
        setEroare(rezultat.eroare || 'Autentificare eșuată');
        return;
      }

      onAutentificare(rezultat.utilizator, rezultat.token);

    } catch (e) {
      setEroare('A apărut o problemă. Te rugăm încearcă din nou.');
    }
  }

  return (
    <div className="auth-page">
      <div className="card-formular auth-card">
        <h2>Autentificare</h2>
        <form onSubmit={trimite}>
          <label>Email</label>
          <input type="email" name="email" value={date.email} onChange={actualizeazaCamp} required />

          <label>Parolă</label>
          <input type="password" name="parola" value={date.parola} onChange={actualizeazaCamp} required />

          {eroare && <p className="eroare">{eroare}</p>}

          <button type="submit">Intră în cont</button>
        </form>


        <p className="auth-switch">
          <button type="button" className="link-buton" onClick={mergiLaUitaParola}>Am uitat parola</button>
        </p>

        <p className="auth-switch">
          Nu ai cont? <button className="link-buton" onClick={mergiLaInregistrare}>Creează unul</button>
        </p>
      </div>
    </div>
  );
}

export default Login;