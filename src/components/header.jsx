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
      <img
        src="https://i.imgur.com/ywpSp8k.jpeg"
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="header-background-image"
      />
      <div className="header-background-overlay" aria-hidden="true" />

      <div className="header-content">
        <img
          src="https://i.imgur.com/ECjnZeK.png"
          alt=""
          aria-label="BWT Transporte"
          referrerPolicy="no-referrer"
          className="header-logo"
        />

        <div className="header-title">
          <h1>Dashboard CT-es Logística</h1>
          <p>Acompanhamento de Emissões de Conhecimento de Transporte</p>
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
