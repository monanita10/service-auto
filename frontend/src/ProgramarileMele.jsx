import { API_URL } from './config';
import { useState, useEffect } from 'react';
import { cerere } from './api';

function ProgramarileMele({ token }) {
  const [programari, setProgramari] = useState([]);
  const [editareId, setEditareId] = useState(null);
  const [dateEditare, setDateEditare] = useState({});
  const [eroare, setEroare] = useState('');

  useEffect(() => { incarcaProgramari(); }, []);

  async function incarcaProgramari() {
    const raspuns = await cerere(`${API_URL}/api/programari`, {}, token);
    setProgramari(await raspuns.json());
  }

  async function anuleaza(id) {
    if (!confirm('Sigur vrei să anulezi această programare?')) return;
    await cerere(`${API_URL}/api/programari/${id}/anuleaza`, { method: 'PATCH' }, token);
    incarcaProgramari();
  }

  function incepeEditare(p) {
    setEditareId(p.id);
    setDateEditare({ telefon: p.telefon, serviciu: p.serviciu, data: p.data, ora: p.ora });
    setEroare('');
  }

  function actualizeazaCampEditare(event) {
    const { name, value } = event.target;
    setDateEditare(prev => ({ ...prev, [name]: value }));
  }

  async function salveazaEditare(id) {
    setEroare('');
    const raspuns = await cerere(`${API_URL}/api/programari/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dateEditare)
    }, token);

    const rezultat = await raspuns.json();
    if (!raspuns.ok) {
      setEroare(rezultat.eroare);
      return;
    }
    setEditareId(null);
    incarcaProgramari();
  }

  return (
    <div className="admin-page">
      <h2 style={{ marginBottom: 24 }}>Programările mele</h2>

      {programari.length === 0 && <p className="stare-goala">Nu ai nicio programare încă.</p>}

      <div className="lista-tichete">
        {programari.map(p => (
          <div key={p.id} className={`tichet ${p.status !== 'in asteptare' ? 'tichet-finalizat' : ''}`}>
            <div className="tichet-bara" />
            <div className="tichet-continut">

              {editareId === p.id ? (
                <div className="editare-inline">
                  <input type="text" name="telefon" value={dateEditare.telefon} onChange={actualizeazaCampEditare} />
                  <input type="text" name="serviciu" value={dateEditare.serviciu} onChange={actualizeazaCampEditare} />
                  <input type="date" name="data" value={dateEditare.data} onChange={actualizeazaCampEditare} />
                  <input type="time" name="ora" value={dateEditare.ora} onChange={actualizeazaCampEditare} />
                  {eroare && <p className="eroare">{eroare}</p>}
                  <div className="editare-butoane">
                    <button onClick={() => salveazaEditare(p.id)}>Salvează</button>
                    <button className="buton-secundar" onClick={() => setEditareId(null)}>Renunță</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="tichet-info">
                    <strong>{p.serviciu}</strong>
                    <span>{p.data} · {p.ora} · {p.telefon}</span>
                    <span className={p.status === 'in asteptare' ? 'tichet-status-asteptare' : ''}>
                      {p.status === 'in asteptare' ? 'În așteptare' : p.status === 'finalizat' ? 'Finalizat' : 'Anulat'}
                    </span>
                  </div>
                  {p.status === 'in asteptare' && (
                    <div className="editare-butoane">
                      <button className="buton-secundar" onClick={() => incepeEditare(p)}>Modifică</button>
                      <button className="buton-anulare" onClick={() => anuleaza(p.id)}>Anulează</button>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgramarileMele;