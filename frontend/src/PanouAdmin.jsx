import { API_URL } from './config';
import { useState, useEffect } from 'react';
import { cerere } from './api';

function PanouAdmin({ token }) {
  const [programari, setProgramari] = useState([]);
  const [cautare, setCautare] = useState('');
  const [filtruStatus, setFiltruStatus] = useState('toate');

  useEffect(() => { incarcaProgramari(); }, []);

  async function incarcaProgramari() {
    const raspuns = await cerere(`${API_URL}/api/programari`, {}, token);
    setProgramari(await raspuns.json());
  }

  async function marcheazaFinalizat(id) {
    await cerere(`${API_URL}/api/programari/${id}/finalizeaza`, { method: 'PATCH' }, token);
    incarcaProgramari();
  }

  async function anuleazaProgramare(id) {
    if (!confirm('Sigur vrei să anulezi această programare?')) return;
    await cerere(`${API_URL}/api/programari/${id}/anuleaza`, { method: 'PATCH' }, token);
    incarcaProgramari();
  }

  const inAsteptare = programari.filter(p => p.status === 'in asteptare').length;
  const finalizate = programari.filter(p => p.status === 'finalizat').length;

  const programariFiltrate = programari.filter(p => {
    const sePotrivesteCautarii =
      p.nume.toLowerCase().includes(cautare.toLowerCase()) ||
      p.serviciu.toLowerCase().includes(cautare.toLowerCase());
    const sePotrivesteStatusului = filtruStatus === 'toate' || p.status === filtruStatus;
    return sePotrivesteCautarii && sePotrivesteStatusului;
  });

  return (
    <div className="admin-page">
      <div className="stats">
        <div className="stat">
          <span className="stat-numar">{programari.length}</span>
          <span className="stat-eticheta">Total azi</span>
        </div>
        <div className="stat">
          <span className="stat-numar">{inAsteptare}</span>
          <span className="stat-eticheta">În așteptare</span>
        </div>
        <div className="stat">
          <span className="stat-numar">{finalizate}</span>
          <span className="stat-eticheta">Finalizate</span>
        </div>
      </div>

      <div className="filtre">
        <input
          type="text"
          placeholder="Caută după nume sau serviciu..."
          value={cautare}
          onChange={e => setCautare(e.target.value)}
        />
        <select value={filtruStatus} onChange={e => setFiltruStatus(e.target.value)}>
          <option value="toate">Toate</option>
          <option value="in asteptare">În așteptare</option>
          <option value="finalizat">Finalizate</option>
          <option value="anulat">Anulate</option>
        </select>
      </div>

      {programariFiltrate.length === 0 && <p className="stare-goala">Nicio programare găsită.</p>}

      <div className="lista-tichete">
        {programariFiltrate.map(p => (
          <div key={p.id} className={p.status !== 'in asteptare' ? 'tichet tichet-finalizat' : 'tichet'}>
            <div className="tichet-bara" />
            <div className="tichet-continut">
              <div className="tichet-info">
                <strong>{p.nume}</strong>
                <span>{p.serviciu}</span>
                <span>{p.data} · {p.ora} · {p.telefon}</span>
              </div>
              {p.status === 'in asteptare' ? (
              <div className="editare-butoane">
                <button onClick={() => marcheazaFinalizat(p.id)}>Finalizează</button>
                <button className="buton-anulare" onClick={() => anuleazaProgramare(p.id)}>Anulează</button>
              </div>
            ) : (
              <span className="tichet-status">{p.status === 'finalizat' ? 'Finalizat' : 'Anulat'}</span>
            )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PanouAdmin;