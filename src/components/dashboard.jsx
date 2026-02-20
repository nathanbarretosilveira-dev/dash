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

    if (activeFilter === 'hoje') multiplicador = 0.2;
    if (activeFilter === 'turno-manha') multiplicador = 0.46;
    if (activeFilter === 'turno-tarde') multiplicador = 0.54;

    return {
      resumo: {
        total_emissoes: Math.round((rawData.resumo?.total_emissoes || 0) * multiplicador),
        total_cancelamentos: Math.round((rawData.resumo?.total_cancelamentos || 0) * multiplicador),
        taxa_eficiencia: rawData.resumo?.taxa_eficiencia || 0,
        produtividade_media:
          rawData.resumo?.total_emissoes && rawData.emissoes_por_usuario?.length
            ? Math.round(
                (rawData.resumo.total_emissoes /
                  rawData.emissoes_por_usuario.length) *
                  multiplicador
              )
            : 0
      },

      emissoes_por_usuario: (rawData.emissoes_por_usuario || []).map(item => ({
        ...item,
        emissoes: Math.round(item.emissoes * multiplicador)
      })),

      cancelamentos_por_usuario: (rawData.cancelamentos_por_usuario || []).map(item => ({
        ...item,
        total: Math.round(item.total * multiplicador)
      })),

      volume_por_turno: {
        antes_14h:
          activeFilter === 'turno-tarde'
            ? 0
            : Math.round((rawData.emissoes_por_turno?.antes_14h || 0) * multiplicador),

        depois_14h:
          activeFilter === 'turno-manha'
            ? 0
            : Math.round((rawData.emissoes_por_turno?.depois_14h || 0) * multiplicador)
      },

      timeline: (rawData.timeline_operacao || []).map(item => ({
        hora: item.hora,
        volume: Math.round(item.emissoes * multiplicador)
      }))
    };
  }, [activeFilter, rawData]);

  return (
    <div className="dashboard">

      {/* FILTROS */}
      <div className="filters-container">
        {[
          ['todos', 'Todos'],
          ['hoje', 'Hoje'],
          ['semana', 'Semana'],
          ['turno-manha', 'Turno Manhã'],
          ['turno-tarde', 'Turno Tarde'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`filter-btn ${activeFilter === key ? 'active' : ''}`}
            onClick={() => setActiveFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <KPIs data={filteredData} />

      {/* GRÁFICOS */}
      <Charts data={filteredData} />
    </div>
  );
};

export default Dashboard;
