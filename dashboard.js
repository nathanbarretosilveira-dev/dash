import React, { useState, useMemo } from 'react';
import './Dashboard.css';
import KPIs from './KPIs';
import Charts from './Charts';
import { cteData } from '../data/cteData';
 
const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState('todos');
  const [loading, setLoading] = useState(false);
 
  // Dados brutos
  const rawData = cteData;
 
  // Aplicar filtro nos dados
  const filteredData = useMemo(() => {
    setLoading(true);
    
    let multiplicador = 1;
    
    switch(activeFilter) {
      case 'hoje':
        multiplicador = 0.2; // 20% dos dados
        break;
      case 'turno-manha':
        multiplicador = 0.46; // 46% = antes das 14h
        break;
      case 'turno-tarde':
        multiplicador = 0.54; // 54% = depois das 14h
        break;
      default:
        multiplicador = 1;
    }
 
    // Aplicar multiplicador nos dados
    const dadosFiltrados = {
      resumo: {
        total_emissoes: Math.round(rawData.resumo.total_emissoes * multiplicador),
        total_cancelamentos: Math.round(rawData.resumo.total_cancelamentos * multiplicador),
        taxa_eficiencia: rawData.resumo.taxa_eficiencia,
        produtividade_media: Math.round(rawData.resumo.produtividade_media * multiplicador)
      },
      emissoes_por_usuario: rawData.emissoes_por_usuario.map(item => ({
        ...item,
        emissoes: Math.round(item.emissoes * multiplicador)
      })),
      cancelamentos_por_usuario: rawData.cancelamentos_por_usuario.map(item => ({
        ...item,
        total: Math.round(item.total * multiplicador)
      })),
      volume_por_turno: {
        antes_14h: activeFilter === 'turno-tarde' ? 0 : Math.round(rawData.volume_por_turno.antes_14h * (multiplicador === 1 ? 1 : multiplicador === 0.2 ? 0.46 : 1)),
        depois_14h: activeFilter === 'turno-manha' ? 0 : Math.round(rawData.volume_por_turno.depois_14h * (multiplicador === 1 ? 1 : multiplicador === 0.2 ? 0.54 : 1))
      },
      timeline: rawData.timeline.map(item => ({
        ...item,
        volume: Math.round(item.volume * multiplicador)
      }))
    };
 
    setTimeout(() => setLoading(false), 100);
    return dadosFiltrados;
  }, [activeFilter]);
 
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };
 
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados...</p>
      </div>
    );
  }
 
  return (
    <div className="dashboard">
      {/* Filtros */}
      <div className="filters">
        <button 
          className={activeFilter === 'todos' ? 'active' : ''}
          onClick={() => handleFilterClick('todos')}
        >
          Todos
        </button>
        <button 
          className={activeFilter === 'hoje' ? 'active' : ''}
          onClick={() => handleFilterClick('hoje')}
        >
          Hoje
        </button>
        <button 
          className={activeFilter === 'semana' ? 'active' : ''}
          onClick={() => handleFilterClick('semana')}
        >
          Semana
        </button>
        <button 
          className={activeFilter === 'turno-manha' ? 'active' : ''}
          onClick={() => handleFilterClick('turno-manha')}
        >
          Turno Manhã
        </button>
        <button 
          className={activeFilter === 'turno-tarde' ? 'active' : ''}
          onClick={() => handleFilterClick('turno-tarde')}
        >
          Turno Tarde
        </button>
      </div>
 
      {/* KPIs */}
      <KPIs data={filteredData} />
 
      {/* Gráficos */}
      <Charts data={filteredData} />
    </div>
  );
};
 
export default Dashboard;
 