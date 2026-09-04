import { API_URL } from './config';
import { useState } from 'react';

function Inregistrare({ onInregistrare }) {
  const [date, setDate] = useState({ nume: '', email: '', parola: '' });
  const [eroare, setEroare] = useState('');
  const [succes, setSucces] = useState(false);

  function actualizeazaCamp(event) {
    const { name, value } = event.target;
    setDate(prev => ({ ...prev, [name]: value }));
  }

  async function trimite(event) {
    event.preventDefault();
    setEroare('');

    try {
      const raspuns = await fetch(`${API_URL}/api/inregistrare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(date)
      });

      const rezultat = await raspuns.json();

      if (!raspuns.ok) {
        setEroare(rezultat.eroare || 'Înregistrare eșuată');
        return;
      }

      setSucces(true);

    } catch (e) {
      setEroare('A apărut o problemă. Te rugăm încearcă din nou.');
    }
  }

  if (succes) {
    return (
      <div className="auth-page">
        <div className="card-formular auth-card">
          <h2>Cont creat!</h2>
          <p>Contul tău a fost creat cu succes.</p>
          <button className="buton-principal" onClick={onInregistrare}>Mergi la autentificare</button>        
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="card-formular auth-card">
        <h2>Cont nou</h2>
        <form onSubmit={trimite}>
          <label>Nume complet</label>
          <input type="text" name="nume" value={date.nume} onChange={actualizeazaCamp} required />

          <label>Email</label>
          <input type="email" name="email" value={date.email} onChange={actualizeazaCamp} required />

          <label>Parolă (minim 6 caractere)</label>
          <input type="password" name="parola" value={date.parola} onChange={actualizeazaCamp} required minLength={6} />

          {eroare && <p className="eroare">{eroare}</p>}

          <button type="submit">Creează cont</button>
        </form>

        <p className="auth-switch">
          Ai deja cont? <button className="link-buton" onClick={onInregistrare}>Autentifică-te</button>
        </p>
      </div>
    </div>
  );
}

export default Inregistrare;