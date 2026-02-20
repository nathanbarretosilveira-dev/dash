import React, { useState, useMemo } from 'react';
import './dashboard.css';
import KPIs from './kpis';
import Charts from './charts';
import cteData from '../data/cte_data.json';
import { getHoje, getSemana, somarPeriodo } from '../utils/dataRange.js';

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState('todos');
  const [userFilter, setUserFilter] = useState('');

  const rawData = cteData ?? {};

  const filteredData = useMemo(() => {
    let diasFiltrados = rawData.dados_por_dia || [];

    if (activeFilter === 'hoje') diasFiltrados = getHoje(diasFiltrados);
    if (activeFilter === 'semana') diasFiltrados = getSemana(diasFiltrados);

    const periodo = somarPeriodo(diasFiltrados);

    const usuariosFiltrados = (rawData.emissoes_por_usuario || []).filter(u =>
      u.nome.toLowerCase().includes(userFilter.toLowerCase())
    );

    return {
      resumo: {
        total_emissoes: periodo.emissoes,
        total_cancelamentos: periodo.cancelamentos,
        taxa_eficiencia:
          periodo.emissoes > 0
            ? ((periodo.emissoes - periodo.cancelamentos) / periodo.emissoes) * 100
            : 0,
        produtividade_media:
          usuariosFiltrados.length > 0
            ? Math.round(periodo.emissoes / usuariosFiltrados.length)
            : 0
      },

      emissoes_por_usuario: usuariosFiltrados,
      cancelamentos_por_usuario: (rawData.cancelamentos_por_usuario || []).filter(u =>
        u.nome.toLowerCase().includes(userFilter.toLowerCase())
      ),

      emissoes_por_turno: rawData.emissoes_por_turno,
      timeline: rawData.timeline_operacao
    };
  }, [activeFilter, userFilter, rawData]);

  return (
    <div className="dashboard">
      <div className="filters-container">
        {[
          ['todos', 'Todos'],
          ['hoje', 'Hoje'],
          ['semana', 'Semana'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`filter-btn ${activeFilter === key ? 'active' : ''}`}
            onClick={() => setActiveFilter(key)}
          >
            {label}
          </button>
        ))}

        <input
          className="user-filter"
          placeholder="Filtrar usuário"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        />
      </div>

      <KPIs data={filteredData} />
      <Charts data={filteredData} />
    </div>
  );
};

export default Dashboard;

