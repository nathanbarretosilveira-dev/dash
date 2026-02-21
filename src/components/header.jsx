import React, { useEffect, useMemo, useState } from 'react';
import './header.css';

const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

function Header() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { dataFormatada, horaFormatada } = useMemo(() => {
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(now);

    const horaFormatada = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);

    return { dataFormatada, horaFormatada };
  }, [now]);

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-main">
          <img
            src="https://potencial1-my.sharepoint.com/personal/nathan_g_grpotencial_com_br/Documents/BWT%20-%20Logotipo-01%20(1).png"
            alt="BWT Transporte"
            className="header-logo"
          />
          <div className="header-title">
            <h1>Dashboard CT-es Logística</h1>
            <p>Acompanhamento de Emissões de Conhecimento de Transporte</p>
          </div>
        </div>

        <div className="header-datetime" aria-live="polite">
          <span className="header-datetime-label">Horário de Brasília</span>
          <strong>{horaFormatada}</strong>
          <span className="header-datetime-date">{dataFormatada}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;


