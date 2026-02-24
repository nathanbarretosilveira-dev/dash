import React, { useEffect, useMemo, useState } from 'react';
import './header.css';

const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

const parseDataHora = (valor) => {
  if (!valor) return null;

  const dataIso = new Date(valor);
  if (!Number.isNaN(dataIso.getTime())) return dataIso;

  const matchBr = String(valor)
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{2,4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);

  if (!matchBr) return null;

  const [, dd, mm, yyyyRaw, hh = '00', mi = '00', ss = '00'] = matchBr;
  const yyyy = yyyyRaw.length === 2 ? `20${yyyyRaw}` : yyyyRaw;

  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`);
};

function Header({ isTvMode = false, onToggleTvMode, cteData = {} }) {
  const [now, setNow] = useState(() => new Date());
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('Carregando...');

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const valorAtualizacao = cteData?.atualizado_em || cteData?.criado_em;

    if (!valorAtualizacao) {
      setUltimaAtualizacao('Não disponível');
      return;
    }

    const dataAtualizacao = parseDataHora(valorAtualizacao);

    if (!dataAtualizacao || Number.isNaN(dataAtualizacao.getTime())) {
      setUltimaAtualizacao(String(valorAtualizacao));
      return;
    }

    const formato = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    setUltimaAtualizacao(formato.format(dataAtualizacao));
  }, [cteData]);

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
          <span className="header-last-update">Última atualização: {ultimaAtualizacao}</span>

          <button
            type="button"
            className={`tv-mode-btn ${isTvMode ? 'active' : ''}`}
            onClick={onToggleTvMode}
            aria-pressed={isTvMode}
          >
            {isTvMode ? 'Modo TV: ON' : 'Modo TV: OFF'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
