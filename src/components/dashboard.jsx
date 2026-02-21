import React, { useState, useMemo } from 'react';
import './dashboard.css';
import KPIs from './kpis';
import Charts from './charts';
import cteData from '../data/cte_data.json';
import { getHoje, getSemana, somarPeriodo } from '../utils/dataRange.js';

const normalizarData = (valor) => {
  const [dia = '', mes = ''] = String(valor || '').trim().split('/');
  if (!dia || !mes) return '';
  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}`;
};

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState('todos');
  const [userFilter, setUserFilter] = useState('');

  const rawData = cteData ?? {};

  const filteredData = useMemo(() => {
    const termoUsuario = userFilter.trim().toLowerCase();
    let diasFiltrados = rawData.dados_por_dia || [];

    if (activeFilter === 'hoje') diasFiltrados = getHoje(diasFiltrados);
    if (activeFilter === 'semana') diasFiltrados = getSemana(diasFiltrados);

    const periodo = somarPeriodo(diasFiltrados);
    const datasPeriodo = new Set(diasFiltrados.map((dia) => normalizarData(dia.data)));

    const dadosUsuariosPorDia = rawData.emissoes_por_usuario_por_dia || [];
    const agregadosPorUsuario = new Map();

    dadosUsuariosPorDia.forEach((dia) => {
      const dataNormalizada = normalizarData(dia.data);
      const considerarData = activeFilter === 'todos' || datasPeriodo.has(dataNormalizada);
      if (!considerarData) return;

      (dia.usuarios || []).forEach((usuario) => {
        const nome = usuario.nome || '';
        if (termoUsuario && !nome.toLowerCase().includes(termoUsuario)) return;

        if (!agregadosPorUsuario.has(nome)) {
          agregadosPorUsuario.set(nome, { nome, emissoes: 0, total: 0 });
        }

        const atual = agregadosPorUsuario.get(nome);
        atual.emissoes += Number(usuario.emissoes) || 0;
        atual.total += Number(usuario.cancelamentos) || 0;
      });
    });

    let usuariosFiltrados = Array.from(agregadosPorUsuario.values())
      .map((usuario) => ({ nome: usuario.nome, emissoes: usuario.emissoes }))
      .sort((a, b) => b.emissoes - a.emissoes);

    let cancelamentosUsuarios = Array.from(agregadosPorUsuario.values())
      .map((usuario) => ({ nome: usuario.nome, total: usuario.total }))
      .sort((a, b) => b.total - a.total);

    const temAgregadoPorDia = dadosUsuariosPorDia.length > 0;

    if (!temAgregadoPorDia || activeFilter === 'todos') {
      usuariosFiltrados = (rawData.emissoes_por_usuario || [])
        .filter((u) => u.nome.toLowerCase().includes(termoUsuario))
        .map((u) => ({ ...u }))
        .sort((a, b) => b.emissoes - a.emissoes);

      cancelamentosUsuarios = (rawData.cancelamentos_por_usuario || [])
        .filter((u) => u.nome.toLowerCase().includes(termoUsuario))
        .map((u) => ({ ...u }))
        .sort((a, b) => b.total - a.total);
    }

    const totalEmissoesFiltradas = usuariosFiltrados.reduce((acc, curr) => acc + curr.emissoes, 0);
    const totalCancelamentosFiltrados = cancelamentosUsuarios.reduce((acc, curr) => acc + curr.total, 0);

    const totalBasePeriodo = activeFilter === 'todos'
      ? rawData.resumo?.total_emissoes || totalEmissoesFiltradas
      : periodo.emissoes;

    const totalBaseCancelamentos = activeFilter === 'todos'
      ? rawData.resumo?.total_cancelamentos || totalCancelamentosFiltrados
      : periodo.cancelamentos;

    const totalEmissoes = termoUsuario ? totalEmissoesFiltradas : totalBasePeriodo;
    const totalCancelamentos = termoUsuario ? totalCancelamentosFiltrados : totalBaseCancelamentos;

    const fatorPeriodo = (rawData.resumo?.total_emissoes || 0) > 0
      ? totalEmissoes / (rawData.resumo?.total_emissoes || 1)
      : 0;

    const turno = {
      antes_14h: Math.round((rawData.emissoes_por_turno?.antes_14h || 0) * fatorPeriodo),
      depois_14h: Math.round((rawData.emissoes_por_turno?.depois_14h || 0) * fatorPeriodo)
    };

    let timelineFiltrada = (rawData.timeline_operacao || []).map((item) => ({
      ...item,
      valorEfetivo: Math.round((item.emissoes ?? item.volume ?? 0) * fatorPeriodo)
    }));

    const somaTimeline = timelineFiltrada.reduce((acc, curr) => acc + curr.valorEfetivo, 0);
    if (somaTimeline !== totalEmissoes && totalEmissoes > 0) {
      const ajuste = totalEmissoes / (somaTimeline || 1);
      timelineFiltrada = timelineFiltrada.map((t) => ({
        ...t,
        valorEfetivo: Math.round(t.valorEfetivo * ajuste)
      }));

      const novaSoma = timelineFiltrada.reduce((acc, curr) => acc + curr.valorEfetivo, 0);
      const diferenca = totalEmissoes - novaSoma;
      if (diferenca !== 0 && timelineFiltrada.length > 0) {
        const maxIdx = timelineFiltrada.reduce(
          (iMax, x, i, arr) => (x.valorEfetivo > arr[iMax].valorEfetivo ? i : iMax),
          0
        );
        timelineFiltrada[maxIdx].valorEfetivo += diferenca;
      }
    }

    return {
      resumo: {
        total_emissoes: totalEmissoes,
        total_cancelamentos: totalCancelamentos,
        taxa_eficiencia:
          totalEmissoes > 0 ? ((totalEmissoes - totalCancelamentos) / totalEmissoes) * 100 : 0,
        produtividade_media:
          usuariosFiltrados.length > 0 ? Math.round(totalEmissoes / usuariosFiltrados.length) : 0
      },
      emissoes_por_usuario: usuariosFiltrados,
      cancelamentos_por_usuario: cancelamentosUsuarios,
      volume_por_turno: turno,
      timeline: timelineFiltrada
    };
  }, [activeFilter, userFilter, rawData]);

  return (
    <div className="dashboard">
      {/* Container de filtros com a classe que aplica o espaçamento e estilo neon */}
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

      {/* Componentes de exibição de dados */}
      <KPIs data={filteredData} />
      <Charts data={filteredData} />
    </div>
  );
};

export default Dashboard;
