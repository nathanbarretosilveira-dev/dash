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
  const totalOriginal = rawData.resumo?.total_emissoes || 1;
  const fatorPeriodo = periodo.emissoes / totalOriginal;

  // 1. Primeiro, filtramos e escalamos os usuários (como você já fazia)
  const usuariosFiltrados = (rawData.emissoes_por_usuario || [])
    .filter(u => u.nome.toLowerCase().includes(userFilter.toLowerCase()))
    .map(u => ({
      ...u,
      emissoes: Math.round(u.emissoes * fatorPeriodo)
    }));

  const cancelamentosUsuarios = (rawData.cancelamentos_por_usuario || [])
    .filter(u => u.nome.toLowerCase().includes(userFilter.toLowerCase()))
    .map(u => ({
      ...u,
      total: Math.round(u.total * fatorPeriodo)
    }));

  // 2. AGORA A CHAVE: Recalculamos os totais baseados apenas nos usuários que restaram no filtro
  const totalEmissoesFiltradas = usuariosFiltrados.reduce((acc, curr) => acc + curr.emissoes, 0);
  const totalCancelamentosFiltrados = cancelamentosUsuarios.reduce((acc, curr) => acc + curr.total, 0);

  // 3. Para o Turno, se houver filtro de usuário, precisamos de uma lógica proporcional 
  // ou manter o fator. Para ser preciso, o ideal é que o turno também venha dos usuários, 
  // mas como o JSON costuma ser separado, aplicamos a proporção do filtro sobre o turno:
  const proporcaoFiltroUsuario = userFilter 
    ? totalEmissoesFiltradas / (periodo.emissoes || 1) 
    : 1;

  const turno = {
    antes_14h: Math.round(
      (rawData.emissoes_por_turno?.antes_14h || 0) * fatorPeriodo * proporcaoFiltroUsuario
    ),
    depois_14h: Math.round(
      (rawData.emissoes_por_turno?.depois_14h || 0) * fatorPeriodo * proporcaoFiltroUsuario
    )
  };

  return {
    resumo: {
      total_emissoes: totalEmissoesFiltradas,
      total_cancelamentos: totalCancelamentosFiltrados,
      taxa_eficiencia:
        totalEmissoesFiltradas > 0
          ? ((totalEmissoesFiltradas - totalCancelamentosFiltrados) / totalEmissoesFiltradas) * 100
          : 0,
      produtividade_media:
        usuariosFiltrados.length > 0
          ? Math.round(totalEmissoesFiltradas / usuariosFiltrados.length)
          : 0
    },
    emissoes_por_usuario: usuariosFiltrados,
    cancelamentos_por_usuario: cancelamentosUsuarios,
    volume_por_turno: turno,
    timeline: rawData.timeline_operacao // A timeline geralmente é global da frota, mas se quiser filtrar, precisaria de dados por usuário nela também.
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


