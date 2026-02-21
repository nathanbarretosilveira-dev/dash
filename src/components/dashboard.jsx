import React, { useState, useMemo } from 'react';
import './dashboard.css';
import KPIs from './kpis';
import Charts from './charts';
import cteData from '../data/cte_data.json';
import { getHoje, getSemana, somarPeriodo } from '../utils/dataRange.js';

const MESES = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
];

const normalizarData = (valor) => {
  const [dia = '', mes = ''] = String(valor || '').trim().split('/');
  if (!dia || !mes) return '';
  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}`;
};

const normalizarDataInput = (valorISO) => {
  if (!valorISO) return '';
  const [ano = '', mes = '', dia = ''] = String(valorISO).split('-');
  if (!ano || !mes || !dia) return '';
  return `${dia}/${mes}`;
};

const extrairMes = (dataDiaMes) => {
  const [, mes = ''] = normalizarData(dataDiaMes).split('/');
  return mes;
};

const calcularVariacaoMediaMovel7d = (dadosPorDia, selector) => {
  if (!Array.isArray(dadosPorDia) || dadosPorDia.length < 14) {
    return { variacao: 0, subiu: false };
  }

  const serie = dadosPorDia.map((dia) => Number(selector(dia)) || 0);
  const janelaAtual = serie.slice(-7);
  const janelaAnterior = serie.slice(-14, -7);

  const mediaAtual = janelaAtual.reduce((acc, val) => acc + val, 0) / 7;
  const mediaAnterior = janelaAnterior.reduce((acc, val) => acc + val, 0) / 7;

  if (mediaAnterior === 0) {
    return { variacao: 0, subiu: mediaAtual > 0 };
  }

  const variacao = ((mediaAtual - mediaAnterior) / mediaAnterior) * 100;
  return {
    variacao: Number(variacao.toFixed(1)),
    subiu: variacao >= 0
  };
};

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState('todos');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isMonthListOpen, setIsMonthListOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');

  const rawData = cteData ?? {};

  const filteredData = useMemo(() => {
    const termoUsuario = userFilter.trim().toLowerCase();
    let diasFiltrados = rawData.dados_por_dia || [];

    if (activeFilter === 'hoje') diasFiltrados = getHoje(diasFiltrados);
    if (activeFilter === 'mes' && selectedMonth) {
      diasFiltrados = diasFiltrados.filter((dia) => extrairMes(dia.data) === selectedMonth);
    }
    if (activeFilter === 'semana') diasFiltrados = getSemana(diasFiltrados);

    if (dateFilter) {
      const dataSelecionada = normalizarDataInput(dateFilter);
      diasFiltrados = diasFiltrados.filter((dia) => normalizarData(dia.data) === dataSelecionada);
    }

    const baseTendencia = diasFiltrados;
    const tendenciaEmissoes = calcularVariacaoMediaMovel7d(
      baseTendencia,
      (dia) => dia.emissoes
    );
    const tendenciaTaxaCancelamento = calcularVariacaoMediaMovel7d(
      baseTendencia,
      (dia) => dia.cancelamentos
    );

    const periodo = somarPeriodo(diasFiltrados);
    const datasPeriodo = new Set(diasFiltrados.map((dia) => normalizarData(dia.data)));

    const dadosUsuariosPorDia = rawData.emissoes_por_usuario_por_dia || [];
    const agregadosPorUsuario = new Map();

    dadosUsuariosPorDia.forEach((dia) => {
      const dataNormalizada = normalizarData(dia.data);
      const considerarData = activeFilter === 'todos'
        ? (!dateFilter || datasPeriodo.has(dataNormalizada))
        : datasPeriodo.has(dataNormalizada);

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

    if ((!temAgregadoPorDia || activeFilter === 'todos') && !dateFilter) {
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

    const totalBasePeriodo = activeFilter === 'todos' && !dateFilter
      ? rawData.resumo?.total_emissoes || totalEmissoesFiltradas
      : periodo.emissoes;

    const totalBaseCancelamentos = activeFilter === 'todos' && !dateFilter
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
        tendencia_emissoes_7d: tendenciaEmissoes,
        tendencia_taxa_cancelamento_7d: tendenciaTaxaCancelamento,
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
  }, [activeFilter, userFilter, dateFilter, rawData, selectedMonth]);

  const onMonthFilterClick = () => {
    setActiveFilter('mes');
    setIsMonthListOpen((prev) => !prev);
  };

  const onSelectMonth = (monthValue) => {
    setSelectedMonth(monthValue);
    setIsMonthListOpen(false);
  };

  const selectedMonthLabel = MESES.find((mes) => mes.value === selectedMonth)?.label || 'Selecionar mês';

  return (
    <div className="dashboard">
      <div className="filters-container">
        <div className="filters-left">
          <button
            className={`filter-btn ${activeFilter === 'todos' ? 'active' : ''}`}
            onClick={() => {
              setActiveFilter('todos');
              setIsMonthListOpen(false);
            }}
          >
            Todos
          </button>

          <div className="month-filter-wrapper">
            <button
              className={`filter-btn ${activeFilter === 'mes' ? 'active' : ''}`}
              onClick={onMonthFilterClick}
            >
              Mês
            </button>

            {activeFilter === 'mes' && (
              <button
                className="month-selected-btn"
                onClick={() => setIsMonthListOpen((prev) => !prev)}
              >
                {selectedMonthLabel}
              </button>
            )}

            {activeFilter === 'mes' && isMonthListOpen && (
              <div className="month-list" role="listbox" aria-label="Lista de meses">
                {MESES.map((mes) => (
                  <button
                    key={mes.value}
                    className={`month-item ${selectedMonth === mes.value ? 'active' : ''}`}
                    onClick={() => onSelectMonth(mes.value)}
                  >
                    {mes.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className={`filter-btn ${activeFilter === 'semana' ? 'active' : ''}`}
            onClick={() => {
              setActiveFilter('semana');
              setIsMonthListOpen(false);
            }}
          >
            Semana
          </button>

          <button
            className={`filter-btn ${activeFilter === 'hoje' ? 'active' : ''}`}
            onClick={() => {
              setActiveFilter('hoje');
              setIsMonthListOpen(false);
            }}
          >
            Hoje
          </button>
        </div>

        <div className="filters-right">
          <input
            className="user-filter"
            placeholder="Filtrar usuário"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
          <input
            className="date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filtrar data"
          />
        </div>
      </div>

      <KPIs data={filteredData} />
      <Charts data={filteredData} />
    </div>
  );
};

export default Dashboard;
