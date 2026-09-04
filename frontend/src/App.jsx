import './App.css';
import { useState, useEffect } from 'react';
import NavBar from './NavBar';
import Login from './Login';
import Inregistrare from './Inregistrare';
import UitaParola from './UitaParola';
import ResetareParola from './ResetareParola';
import FormularProgramare from './FormularProgramare';
import ProgramarileMele from './ProgramarileMele';
import PanouAdmin from './PanouAdmin';
import { setDelogareCallback } from './api';

const parametriUrl = new URLSearchParams(window.location.search);
const tokenResetare = parametriUrl.get('resetare');

function App() {
  const [utilizator, setUtilizator] = useState(() => {
    const salvat = localStorage.getItem('utilizator');
    return salvat ? JSON.parse(salvat) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [paginaAuth, setPaginaAuth] = useState(tokenResetare ? 'resetare' : 'login');
  const [paginaActiva, setPaginaActiva] = useState('client');
  const [mesajSesiune, setMesajSesiune] = useState('');

  function autentifica(utilizatorNou, tokenNou) {
    setUtilizator(utilizatorNou);
    setToken(tokenNou);
    setMesajSesiune('');
    localStorage.setItem('utilizator', JSON.stringify(utilizatorNou));
    localStorage.setItem('token', tokenNou);
  }

  function delogare(mesaj) {
    setUtilizator(null);
    setToken(null);
    localStorage.removeItem('utilizator');
    localStorage.removeItem('token');
    if (mesaj) setMesajSesiune(mesaj);
    setPaginaAuth('login');
  }

  useEffect(() => {
    setDelogareCallback(() => delogare('Sesiunea a expirat. Te rugăm autentifică-te din nou.'));
  }, []);

  if (!utilizator) {
    return (
      <div>
        <header className="header">
          <div className="header-inner">
            <span className="logo">Service Auto Zuzi McQueen</span>
          </div>
        </header>
        <main className="main">
          {mesajSesiune && <p className="banner-sesiune">{mesajSesiune}</p>}

          {paginaAuth === 'login' && (
            <Login
              onAutentificare={autentifica}
              mergiLaInregistrare={() => setPaginaAuth('inregistrare')}
              mergiLaUitaParola={() => setPaginaAuth('uita-parola')}
            />
          )}
          {paginaAuth === 'inregistrare' && (
            <Inregistrare onInregistrare={() => setPaginaAuth('login')} />
          )}
          {paginaAuth === 'uita-parola' && (
            <UitaParola inapoiLaLogin={() => setPaginaAuth('login')} />
          )}
          {paginaAuth === 'resetare' && (
            <ResetareParola token={tokenResetare} onSucces={() => {
              window.history.replaceState({}, '', '/');
              setPaginaAuth('login');
            }} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div>
      <NavBar utilizator={utilizator} paginaActiva={paginaActiva} schimbaPagina={setPaginaActiva} delogare={() => delogare()} />
      <main className="main">
        {utilizator.rol === 'admin' && <PanouAdmin token={token} />}
        {utilizator.rol === 'client' && paginaActiva === 'client' && <FormularProgramare token={token} />}
        {utilizator.rol === 'client' && paginaActiva === 'istoric' && <ProgramarileMele token={token} />}
      </main>
    </div>
  );
}

export default App;