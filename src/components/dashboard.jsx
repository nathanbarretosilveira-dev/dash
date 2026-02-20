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

    // 1. Filtramos e escalamos os usuários
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

    // 2. Recalculamos os totais baseados no filtro
    const totalEmissoesFiltradas = usuariosFiltrados.reduce((acc, curr) => acc + curr.emissoes, 0);
    const totalCancelamentosFiltrados = cancelamentosUsuarios.reduce((acc, curr) => acc + curr.total, 0);

    // 3. Calculamos a proporção do filtro de usuário
    const proporcaoFiltroUsuario = userFilter 
      ? totalEmissoesFiltradas / (periodo.emissoes || 1) 
      : 1;

    // 4. Escalamos o Turno
    const turno = {
      antes_14h: Math.round(
        (rawData.emissoes_por_turno?.antes_14h || 0) * fatorPeriodo * proporcaoFiltroUsuario
      ),
      depois_14h: Math.round(
        (rawData.emissoes_por_turno?.depois_14h || 0) * fatorPeriodo * proporcaoFiltroUsuario
      )
    };

    // 5. LÓGICA DA TIMELINE COM AJUSTE DE INTEGRIDADE
    let timelineFiltrada = (rawData.timeline_operacao || []).map(item => ({
      ...item,
      valorEfetivo: Math.round((item.emissoes ?? item.volume ?? 0) * fatorPeriodo * proporcaoFiltroUsuario)
    }));

    // Validação Operacional: Garante que a soma da timeline bata com o KPI Total
    const somaTimeline = timelineFiltrada.reduce((acc, curr) => acc + curr.valorEfetivo, 0);
    
    if (somaTimeline !== totalEmissoesFiltradas && totalEmissoesFiltradas > 0) {
      // Se a soma for diferente de zero, ajustamos a escala para bater com o KPI
      const ajuste = totalEmissoesFiltradas / (somaTimeline || 1);
      timelineFiltrada = timelineFiltrada.map(t => ({
        ...t,
        valorEfetivo: Math.round(t.valorEfetivo * ajuste)
      }));

      // Ajuste fino final: se ainda houver diferença de 1 ou 2 unidades por arredondamento
      let novaSoma = timelineFiltrada.reduce((acc, curr) => acc + curr.valorEfetivo, 0);
      let diferenca = totalEmissoesFiltradas - novaSoma;
      
      if (diferenca !== 0) {
        // Adicionamos a diferença na maior barra para não distorcer o gráfico
        const maxIdx = timelineFiltrada.reduce((iMax, x, i, arr) => x.valorEfetivo > arr[iMax].valorEfetivo ? i : iMax, 0);
        timelineFiltrada[maxIdx].valorEfetivo += diferenca;
      }
    }

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
      timeline: timelineFiltrada
    };
  }, [activeFilter, userFilter, rawData]);

  return (
    <div className="dashboard-container">
      <div className="filter-bar">
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
