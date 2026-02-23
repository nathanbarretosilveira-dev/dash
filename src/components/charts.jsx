import React, { useMemo } from 'react';
import './charts.css';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getHour = (hora) => {
  if (typeof hora !== 'string') return null;
  const [hourChunk] = hora.split(':');
  const parsed = Number.parseInt(hourChunk, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const Charts = ({ data }) => {
  if (!data) return null;

  const {
    emissoes_por_usuario = [],
    cancelamentos_por_usuario = [],
    volume_por_turno = { antes_14h: 0, depois_14h: 0 },
    timeline = []
  } = data;

  const {
    maxEmissoes,
    maxCancelamentos,
    totalTurno,
    percentAntes,
    percentDepois,
    maxTimeline,
    filteredTimeline
  } = useMemo(() => {
    const mEmissoes = Math.max(1, ...emissoes_por_usuario.map((i) => toNumber(i.emissoes)));
    const mCancelamentos = Math.max(1, ...cancelamentos_por_usuario.map((i) => toNumber(i.total)));
    const antesTurno = toNumber(volume_por_turno.antes_14h);
    const depoisTurno = toNumber(volume_por_turno.depois_14h);
    const tTurno = antesTurno + depoisTurno || 1;

    const pAntes = Math.round((antesTurno / tTurno) * 100);
    const pDepois = Math.round((depoisTurno / tTurno) * 100);

    const timelineFiltrada = timeline.filter((item) => {
      const hora = getHour(item?.hora);
      return hora !== null && hora >= 7 && hora <= 23;
    });

    const mTimeline = Math.max(1, ...timelineFiltrada.map((i) => toNumber(i?.valorEfetivo)));

    return {
      maxEmissoes: mEmissoes,
      maxCancelamentos: mCancelamentos,
      totalTurno: tTurno,
      percentAntes: pAntes,
      percentDepois: pDepois,
      maxTimeline: mTimeline,
      filteredTimeline: timelineFiltrada
    };
  }, [emissoes_por_usuario, cancelamentos_por_usuario, volume_por_turno, timeline]);


  const antesEhDestaque = percentAntes >= percentDepois;
  const depoisEhDestaque = percentDepois >= percentAntes;

  return (
    <div className="charts-container">
      <div className="charts-row">
        <div className="chart-card">
          <h3>Produtividade</h3>
          <div className="chart-content horizontal-bars">
            {emissoes_por_usuario.map((item, idx) => (
              <div key={idx} className="bar-item">
                <div className="bar-header">
                  <span className="bar-label">{item.nome}</span>
                  <span className="bar-metric">{item.emissoes}</span>
                </div>
                <div className="bar-wrapper">
                  <div
                    className="bar-fill produtividade"
                    style={{ width: `${(item.emissoes / maxEmissoes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3>Cancelamentos</h3>
          <div className="chart-content horizontal-bars">
            {cancelamentos_por_usuario.map((item, idx) => (
              <div key={idx} className="bar-item">
                <div className="bar-header">
                  <span className="bar-label">{item.nome}</span>
                  <span className="bar-metric">{item.total}</span>
                </div>
                <div className="bar-wrapper">
                  <div
                    className="bar-fill cancelamento"
                    style={{ width: `${(item.total / maxCancelamentos) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3>Indicador de Turno</h3>
          <div className="chart-content turno-container">
            <div className="turno-grid">
              <div className="turno-section">
                <div className="turno-info">
                  <span>Antes 14h</span>
                  <span>{percentAntes}%</span>
                </div>
                <div className="turno-bar-wrapper">
                  <div className={`turno-bar antes ${antesEhDestaque ? 'destaque' : ''}`} style={{ height: `${percentAntes}%` }}>
                    {volume_por_turno.antes_14h}
                  </div>
                </div>
              </div>

              <div className="turno-section">
                <div className="turno-info">
                  <span>Depois 14h</span>
                  <span>{percentDepois}%</span>
                </div>
                <div className="turno-bar-wrapper">
                  <div className={`turno-bar depois ${depoisEhDestaque ? 'destaque' : ''}`} style={{ height: `${percentDepois}%` }}>
                    {volume_por_turno.depois_14h}
                  </div>
                </div>
              </div>
            </div>
            <div className="turno-total">Total: {totalTurno} CT-es</div>
          </div>
        </div>

        <div className="chart-card timeline-fullwidth">
          <h3>Timeline de Operação</h3>
          <div className="chart-content">
            <div className="timeline-container">
              {filteredTimeline.map((item, index) => {
                const valor = item.valorEfetivo ?? 0;
                const isPico = valor === maxTimeline && valor > 0;
                const alturaBarra = `${(valor / maxTimeline) * 100}%`;

                return (
                  <div key={index} className={`timeline-item ${isPico ? 'pico' : ''}`}>
                    <div className="timeline-bar-track">
                      <span className="timeline-value" style={{ bottom: `calc(${alturaBarra} + 6px)` }}>{valor}</span>
                      <div className="timeline-bar" style={{ height: alturaBarra }} />
                    </div>
                    <span className={`timeline-label ${index % 2 ? 'is-muted' : ''}`}>{item.hora}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
