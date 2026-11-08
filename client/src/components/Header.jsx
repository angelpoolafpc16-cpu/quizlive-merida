import { Link } from 'react-router-dom';

export default function Header({ backTo, backLabel = '← Inicio' }) {
  return (
    <header className="app-header">
      <div className="app-header-brand">
        <img src="/logo-merida.svg" alt="Mérida" className="app-header-logo" />
        <div className="app-header-divider" />
        <div>
          <div className="app-header-title">QUIZ-MID</div>
          <div className="app-header-sub">Ayuntamiento de Mérida 2024-2027</div>
        </div>
      </div>
      {backTo && (
        <Link to={backTo} className="app-header-link">
          {backLabel}
        </Link>
      )}
    </header>
  );
}
