import React, { useState, useMemo } from 'react';
import './dashboard.css';
import KPIs from './kpis';
import Charts from './charts';
import cteData from '../data/cte_data.json';

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState('todos');

  // Dados brutos (fallback seguro)
  const rawData = cteData ?? {};

  const filteredData = useMemo(() => {
    let multiplicador = 1;

    switch (activeFilter) {
      case 'hoje':
        multiplicador = 0.2;
        break;
      case 'turno-manha':
        multiplicador = 0.46;
        break;
      case 'turno-tarde':
        multiplicador = 0.54;
        break;
      default:
        multiplicador = 1;
    }

    return {
      resumo: {
        total_emissoes: Math.round((rawData?.resumo?.total_emissoes ?? 0) * multiplicador),
        total_cancelamentos: Math.round((rawData?.resumo?.total_cancelamentos ?? 0) * multiplicador),
        taxa_eficiencia: rawData?.resumo?.taxa_eficiencia ?? 0,
        produtividade_media: Math.round((rawData?.resumo?.produtividade_media ?? 0) * multiplicador),
      },

      emissoes_por_usuario: (rawData?.emissoes_por_usuario ?? []).map(item => ({
        ...item,
        emissoes: Math.round((item?.emissoes ?? 0) * multiplicador),
      })),

      cancelamentos_por_usuario: (rawData?.cancelamentos_por_usuario ?? []).map(item => ({
        ...item,
        total: Math.round((item?.total ?? 0) * multiplicador),
      })),

      volume_por_turno: {
        antes_14h:
          activeFilter === 'turno-tarde'
            ? 0
            : Math.round((rawData?.volume_por_turno?.antes_14h ?? 0) * multiplicador),

        depois_14h:
          activeFilter === 'turno-manha'
            ? 0
            : Math.round((rawData?.volume_por_turno?.depois_14h ?? 0) * multiplicador),
      },

      timeline: (rawData?.timeline ?? []).map(item => ({
        ...item,
        volume: Math.round((item?.volume ?? 0) * multiplicador),
      })),
    };
  }, [activeFilter, rawData]);

  return (
    <div className="dashboard">
      <div className="filters">
        {[
          ['todos', 'Todos'],
          ['hoje', 'Hoje'],
          ['semana', 'Semana'],
          ['turno-manha', 'Turno Manhã'],
          ['turno-tarde', 'Turno Tarde'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={activeFilter === key ? 'active' : ''}
            onClick={() => setActiveFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <KPIs data={filteredData} />
      <Charts data={filteredData} />
    </div>
  );
};

export default Dashboard;
