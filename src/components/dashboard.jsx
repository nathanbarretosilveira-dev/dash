import React, { useMemo, useRef, useState, useEffect } from 'react';
import './dashboard.css';
import KPIs from './kpis';
import Charts from './charts';
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
  const [, mes = '', dia = ''] = String(valorISO).split('-');
  if (!mes || !dia) return '';
  return `${dia}/${mes}`;
};

const extrairMes = (dataDiaMes) => {
  const [, mes = ''] = normalizarData(dataDiaMes).split('/');
  return mes;
};

const obterTimestampData = (dataDiaMesAno) => {
  const [dia = '', mes = '', ano = ''] = String(dataDiaMesAno || '').trim().split('/');
  const diaNum = Number(dia);
  const mesNum = Number(mes);
  const anoNum = Number(ano);

  if (!Number.isFinite(diaNum) || !Number.isFinite(mesNum) || !Number.isFinite(anoNum)) {
    return Number.NEGATIVE_INFINITY;
  }

  const anoCompleto = anoNum < 100 ? 2000 + anoNum : anoNum;
  return new Date(anoCompleto, mesNum - 1, diaNum).getTime();
};

const ordenarPorData = (a, b) => obterTimestampData(a?.data) - obterTimestampData(b?.data);

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

const montarJanelaTendencia = (dadosCompletos, diasFiltrados) => {
  if (!Array.isArray(dadosCompletos) || dadosCompletos.length === 0) return [];

  const dadosOrdenados = [...dadosCompletos].sort(ordenarPorData);

  if (Array.isArray(diasFiltrados) && diasFiltrados.length >= 14) {
    return [...diasFiltrados].sort(ordenarPorData);
  }
  if (!Array.isArray(diasFiltrados) || diasFiltrados.length === 0) return dadosOrdenados;

  const diasFiltradosOrdenados = [...diasFiltrados].sort(ordenarPorData);
  const dataReferencia = normalizarData(diasFiltradosOrdenados[diasFiltradosOrdenados.length - 1]?.data);
  const indiceReferencia = dadosOrdenados.findIndex((dia) => normalizarData(dia.data) === dataReferencia);

  if (indiceReferencia < 0) return dadosOrdenados;

  const inicio = Math.max(0, indiceReferencia - 13);
  return dadosOrdenados.slice(inicio, indiceReferencia + 1);
};

const Dashboard = ({ cteData = {} }) => {
  const [activeFilter, setActiveFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('');
  const [isMonthListOpen, setIsMonthListOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const monthRef = useRef(null);
  const userRef = useRef(null);

  const rawData = cteData ?? {};

  const usuariosDisponiveis = useMemo(
    () => (rawData.emissoes_por_usuario || []).map((u) => u.nome).sort((a, b) => a.localeCompare(b)),
    [rawData]
  );

  useEffect(() => {
    const onClickOutside = (event) => {
      if (monthRef.current && !monthRef.current.contains(event.target)) {
        setIsMonthListOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setIsUserListOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMonthListOpen(false);
        setIsUserListOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const filteredData = useMemo(() => {
    let diasFiltrados = [...(rawData.dados_por_dia || [])].sort(ordenarPorData);

    if (activeFilter === 'hoje') diasFiltrados = getHoje(diasFiltrados);
    if (activeFilter === 'mes' && selectedMonth) {
      diasFiltrados = diasFiltrados.filter((dia) => extrairMes(dia.data) === selectedMonth);
    }
    if (activeFilter === 'semana') diasFiltrados = getSemana(diasFiltrados);

    if (dateFilter) {
      const dataSelecionada = normalizarDataInput(dateFilter);
      diasFiltrados = diasFiltrados.filter((dia) => normalizarData(dia.data) === dataSelecionada);
    }

    const mesesDistintosNaBase = new Set(
      (rawData.dados_por_dia || []).map((dia) => extrairMes(dia.data)).filter(Boolean)
    ).size;

    const filtroCobreBaseCompleta =
      activeFilter === 'mes' &&
      !!selectedMonth &&
      !dateFilter &&
      (rawData.dados_por_dia || []).length > 0 &&
      diasFiltrados.length === (rawData.dados_por_dia || []).length &&
      mesesDistintosNaBase === 1;

    const baseTendencia = montarJanelaTendencia(rawData.dados_por_dia || [], diasFiltrados);
    const tendenciaEmissoes = calcularVariacaoMediaMovel7d(
      baseTendencia,
      (dia) => (Number(dia.emissoes) || 0) + (Number(dia.cancelamentos) || 0)
    );
    const tendenciaTaxaCancelamento = calcularVariacaoMediaMovel7d(baseTendencia, (dia) => dia.cancelamentos);

    const periodo = somarPeriodo(diasFiltrados);
    const datasPeriodo = new Set(diasFiltrados.map((dia) => normalizarData(dia.data)));
    const deveConsiderarData = (data) => {
      const dataNormalizada = normalizarData(data);
      return activeFilter === 'todos'
        ? (!dateFilter || datasPeriodo.has(dataNormalizada))
        : datasPeriodo.has(dataNormalizada);
    };

    const dadosUsuariosPorDia = rawData.emissoes_por_usuario_por_dia || [];
    const agregadosPorUsuario = new Map();

    dadosUsuariosPorDia.forEach((dia) => {
      if (!deveConsiderarData(dia.data)) return;

      (dia.usuarios || []).forEach((usuario) => {
        const nome = usuario.nome || '';
        if (selectedUser && nome !== selectedUser) return;

        if (!agregadosPorUsuario.has(nome)) {
          agregadosPorUsuario.set(nome, { nome, emissoes: 0, total: 0 });
        }

        const atual = agregadosPorUsuario.get(nome);
        const emissoesLiquidas = Number(usuario.emissoes) || 0;
        const cancelamentosUsuario = Number(usuario.cancelamentos) || 0;

        atual.emissoes += emissoesLiquidas + cancelamentosUsuario;
        atual.total += cancelamentosUsuario;
      });
    });

    let usuariosFiltrados = Array.from(agregadosPorUsuario.values())
      .map((usuario) => ({ nome: usuario.nome, emissoes: usuario.emissoes }))
      .sort((a, b) => b.emissoes - a.emissoes);

    let cancelamentosUsuarios = Array.from(agregadosPorUsuario.values())
      .map((usuario) => ({ nome: usuario.nome, total: usuario.total }))
      .sort((a, b) => b.total - a.total);

    const temAgregadoPorDia = dadosUsuariosPorDia.length > 0;

    if ((!temAgregadoPorDia || activeFilter === 'todos' || filtroCobreBaseCompleta) && !dateFilter) {
      usuariosFiltrados = (rawData.emissoes_por_usuario || [])
        .filter((u) => (selectedUser ? u.nome === selectedUser : true))
        .map((u) => ({ ...u }))
        .sort((a, b) => b.emissoes - a.emissoes);

      cancelamentosUsuarios = (rawData.cancelamentos_por_usuario || [])
        .filter((u) => (selectedUser ? u.nome === selectedUser : true))
        .map((u) => ({ ...u }))
        .sort((a, b) => b.total - a.total);
    }

    const totalEmissoesFiltradas = usuariosFiltrados.reduce((acc, curr) => acc + curr.emissoes, 0);
    const totalCancelamentosFiltrados = cancelamentosUsuarios.reduce((acc, curr) => acc + curr.total, 0);

    const usarResumoComoBase =
      (activeFilter === 'todos' && !dateFilter) || (activeFilter === 'mes' && filtroCobreBaseCompleta);

    const totalEmissoesPeriodo = periodo.emissoes;

    const totalBasePeriodo = usarResumoComoBase
      ? rawData.resumo?.total_emissoes || totalEmissoesFiltradas
      : totalEmissoesPeriodo;

    const totalBaseCancelamentos = usarResumoComoBase
      ? rawData.resumo?.total_cancelamentos || totalCancelamentosFiltrados
      : periodo.cancelamentos;

    const totalEmissoes = selectedUser ? totalEmissoesFiltradas : totalBasePeriodo;
    const totalCancelamentos = selectedUser ? totalCancelamentosFiltrados : totalBaseCancelamentos;

    const totalEfetivoTurnoEsperado = Math.max(0, totalEmissoes - totalCancelamentos);

    const fatorPeriodo = (rawData.resumo?.total_emissoes || 0) > 0
      ? totalEmissoes / (rawData.resumo?.total_emissoes || 1)
      : 0;

    const timelineDetalhada = rawData.timeline_operacao_detalhada || [];
    const temTimelineDetalhada = Array.isArray(timelineDetalhada) && timelineDetalhada.length > 0;

    const dadosTurnoPorDia = rawData.emissoes_por_turno_por_dia || [];
    const temTurnoPorDia = Array.isArray(dadosTurnoPorDia) && dadosTurnoPorDia.length > 0;

    const turnoFiltradoPorDia = dadosTurnoPorDia.reduce((acc, dia) => {
      if (!deveConsiderarData(dia.data)) return acc;

      const antes14h = Number(dia.antes_14h ?? dia.antes_14h_emissoes ?? dia.turno?.antes_14h) || 0;
      const depois14h = Number(dia.depois_14h ?? dia.depois_14h_emissoes ?? dia.turno?.depois_14h) || 0;

      acc.antes_14h += antes14h;
      acc.depois_14h += depois14h;
      return acc;
    }, { antes_14h: 0, depois_14h: 0 });

    const turnoFiltradoPorUsuarioTimeline = timelineDetalhada.reduce((acc, item) => {
      if (!deveConsiderarData(item.data)) return acc;
      if (selectedUser && item.usuario !== selectedUser) return acc;

      const horaBruta = String(item.hora || '');
      if (!/^\d{2}:\d{2}:\d{2}$/.test(horaBruta)) return acc;

      const horaNum = Number(horaBruta.slice(0, 2));
      if (!Number.isFinite(horaNum)) return acc;

      if (horaNum < 14) acc.antes_14h += 1;
      else acc.depois_14h += 1;

      return acc;
    }, { antes_14h: 0, depois_14h: 0 });

    const turnoBase = (selectedUser && temTimelineDetalhada)
      ? turnoFiltradoPorUsuarioTimeline
      : temTurnoPorDia
        ? turnoFiltradoPorDia
        : {
            antes_14h: Math.round((rawData.emissoes_por_turno?.antes_14h || 0) * fatorPeriodo),
            depois_14h: Math.round((rawData.emissoes_por_turno?.depois_14h || 0) * fatorPeriodo)
          };

    const totalTurnoCalculado = (turnoBase.antes_14h || 0) + (turnoBase.depois_14h || 0);
    const diferencaTurno = Math.max(0, totalEfetivoTurnoEsperado - totalTurnoCalculado);

    const turno = {
      antes_14h: (turnoBase.antes_14h || 0) + diferencaTurno,
      depois_14h: turnoBase.depois_14h || 0
    };

    let timelineFiltrada = [];

    if (temTimelineDetalhada) {
      const timelinePorHora = new Map();

      timelineDetalhada.forEach((item) => {
        if (!deveConsiderarData(item.data)) return;
        if (selectedUser && item.usuario !== selectedUser) return;

        const horaBruta = String(item.hora || '');
        if (!/^\d{2}:\d{2}:\d{2}$/.test(horaBruta)) return;

        const faixaHora = `${horaBruta.slice(0, 2)}:00`;
        timelinePorHora.set(faixaHora, (timelinePorHora.get(faixaHora) || 0) + 1);
      });

      timelineFiltrada = Array.from(timelinePorHora.entries())
        .map(([hora, valorEfetivo]) => ({ hora, valorEfetivo, emissoes: valorEfetivo }))
        .sort((a, b) => a.hora.localeCompare(b.hora));
    } else {
      timelineFiltrada = (rawData.timeline_operacao || []).map((item) => ({
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
  }, [activeFilter, dateFilter, rawData, selectedMonth, selectedUser]);

  const limparFiltros = () => {
    setActiveFilter('todos');
    setDateFilter('');
    setSelectedMonth('');
    setSelectedUser('');
    setIsMonthListOpen(false);
    setIsUserListOpen(false);
  };

  const selectedMonthLabel = MESES.find((mes) => mes.value === selectedMonth)?.label;
  const monthButtonLabel = selectedMonthLabel ? `Mês: ${selectedMonthLabel}` : 'Mês';
  const userButtonLabel = selectedUser ? `Usuário: ${selectedUser}` : 'Filtrar usuário';

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

                    <div className="dropdown-wrapper" ref={monthRef}>
            <button
              className={`filter-btn ${activeFilter === 'mes' ? 'active' : ''}`}
              onClick={() => {
                if (selectedMonth) {
                  setActiveFilter('mes');
                }
                setIsMonthListOpen((prev) => !prev);
              }}
            >
              {monthButtonLabel}
            </button>

            {isMonthListOpen && (
              <div className="dropdown-list" role="listbox" aria-label="Lista de meses">
                {MESES.map((mes) => (
                  <button
                    key={mes.value}
                    className={`dropdown-item ${selectedMonth === mes.value ? 'active' : ''}`}
                    onClick={() => {
                      setActiveFilter('mes');
                      setSelectedMonth(mes.value);
                      setIsMonthListOpen(false);
                    }}
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
          <button className="clear-filters-btn" onClick={limparFiltros}>
            Limpar filtros
          </button>

          <div className="dropdown-wrapper" ref={userRef}>
            <button
              className={`filter-select-btn ${selectedUser ? 'active' : ''}`}
              onClick={() => setIsUserListOpen((prev) => !prev)}
            >
              {userButtonLabel}
            </button>

            {isUserListOpen && (
              <div className="dropdown-list" role="listbox" aria-label="Lista de usuários">
                <button
                  className={`dropdown-item ${selectedUser === '' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedUser('');
                    setIsUserListOpen(false);
                  }}
                >
                  Todos os usuários
                </button>
                {usuariosDisponiveis.map((nome) => (
                  <button
                    key={nome}
                    className={`dropdown-item ${selectedUser === nome ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedUser(nome);
                      setIsUserListOpen(false);
                    }}
                  >
                    {nome}
                  </button>
                ))}
              </div>
            )}
          </div>

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

      <footer className="dashboard-footer">
        © 2026 — Desenvolvido por Nathan Gabriel.
      </footer>
    </div>
  );
};

export default Dashboard;





