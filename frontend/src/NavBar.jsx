function NavBar({ utilizator, paginaActiva, schimbaPagina, delogare }) {
  return (
    <header className="header">
      <div className="header-inner">
        <span className="logo">Service Auto Zuzi McQueen</span>

        {utilizator.rol === 'client' && (
          <nav className="tabs">
            <button
              className={paginaActiva === 'client' ? 'tab activ' : 'tab'}
              onClick={() => schimbaPagina('client')}
            >
              Programează-te
            </button>
            <button
              className={paginaActiva === 'istoric' ? 'tab activ' : 'tab'}
              onClick={() => schimbaPagina('istoric')}
            >
              Programările mele
            </button>
            <span className={paginaActiva === 'istoric' ? 'indicator indicator-admin' : 'indicator'} />
          </nav>
        )}

        <div className="cont-info">
          <span>{utilizator.nume}</span>
          <button className="buton-delogare" onClick={delogare}>Deconectare</button>
        </div>
      </div>
    </header>
  );
}

export default NavBar;