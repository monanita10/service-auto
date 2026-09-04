import { API_URL } from './config';
import { useState } from 'react';

function ResetareParola({ token, onSucces }) {
  const [parola, setParola] = useState('');
  const [eroare, setEroare] = useState('');
  const [succes, setSucces] = useState(false);

  async function trimite(event) {
    event.preventDefault();
    setEroare('');

    const raspuns = await fetch(`${API_URL}/api/reseteaza-parola`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, parolaNoua: parola })
    });
    const rezultat = await raspuns.json();

    if (!raspuns.ok) {
      setEroare(rezultat.eroare);
      return;
    }
    setSucces(true);
  }

  if (succes) {
    return (
      <div className="auth-page">
        <div className="card-formular auth-card">
          <h2>Parolă schimbată</h2>
          <p>Poți acum să te autentifici cu noua parolă.</p>
          <button className="buton-principal" onClick={onSucces}>Mergi la autentificare</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="card-formular auth-card">
        <h2>Setează o parolă nouă</h2>
        <form onSubmit={trimite}>
          <label>Parolă nouă (minim 6 caractere)</label>
          <input type="password" value={parola} onChange={e => setParola(e.target.value)} required minLength={6} />
          {eroare && <p className="eroare">{eroare}</p>}
          <button type="submit">Schimbă parola</button>
        </form>
      </div>
    </div>
  );
}

export default ResetareParola;