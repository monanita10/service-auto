import { API_URL } from './config';
import { cerere } from './api';
import { useState } from 'react';

const gol = { telefon: '', serviciu: '', data: '', ora: '' };

function FormularProgramare({ token }) {
  const [date, setDate] = useState(gol);
  const [trimis, setTrimis] = useState(null);
  const [eroare, setEroare] = useState('');

  function actualizeazaCamp(event) {
    const { name, value } = event.target;
    setDate(prev => ({ ...prev, [name]: value }));
  }



async function trimiteFormular(event) {
  event.preventDefault();
  setEroare('');

  try {
    const raspuns = await cerere(`${API_URL}/api/programari`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(date)
    }, token);

    const rezultat = await raspuns.json();

    if (!raspuns.ok) {
      setEroare(rezultat.eroare || 'A apărut o eroare');
      return;
    }

    setTrimis(date);
    setDate(gol);

  } catch (e) {
    setEroare('A apărut o problemă. Te rugăm încearcă din nou.');
  }
}



  return (
    <div className="client-page">
      <div className="client-intro">
        <h1>Programează-ți mașina la service</h1>
        <p>Alege serviciul, data și ora care ți se potrivesc. Confirmăm programarea imediat.</p>
      </div>

      <div className="card-formular">
        {trimis ? (
          <div className="ticket">
            <span className="ticket-eticheta">Programare confirmată</span>
            <h3>{trimis.serviciu}</h3>
            <p>{trimis.data} la {trimis.ora}</p>
            <button className="buton-secundar" onClick={() => setTrimis(null)}>
              Fă o nouă programare
            </button>
          </div>
        ) : (
          <form onSubmit={trimiteFormular}>
            <label>Telefon</label>
            <input type="tel" name="telefon" value={date.telefon} onChange={actualizeazaCamp} required />

            <label>Tip serviciu</label>
            <input type="text" name="serviciu" placeholder="ex: schimb ulei" value={date.serviciu} onChange={actualizeazaCamp} required />

            <div className="camp-dublu">
              <div>
                <label>Data</label>
                <input type="date" name="data" value={date.data} onChange={actualizeazaCamp} required />
              </div>
              <div>
                <label>Ora</label>
                <input type="time" name="ora" value={date.ora} onChange={actualizeazaCamp} required />
              </div>
            </div>

            {eroare && <p className="eroare">{eroare}</p>}

            <button type="submit">Trimite programarea</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default FormularProgramare;