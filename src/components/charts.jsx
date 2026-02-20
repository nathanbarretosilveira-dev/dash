import React, { useMemo } from 'react';
import './charts.css';

const Charts = ({ data }) => {
  if (!data) return null;

  const {
    emissoes_por_usuario = [],
    cancelamentos_por_usuario = [],
    volume_por_turno = { antes_14h: 0, depois_14h: 0 },
    timeline = []
  } = data;

  /* =========================
     RECÁLCULO SEMPRE QUE DATA MUDA
     ========================= */

  const {
    maxEmissoes,
    maxCancelamentos,
    totalTurno,
    percentAntes,
    percentDepois,
    maxTimeline
  } = useMemo(() => {
    const maxEmissoes = Math.max(
      1,
      ...emissoes_por_usuario.map(i => i.emissoes || 0)
    );

    const maxCancelamentos = Math.max(
      1,
      ...cancelamentos_por_usuario.map(i => i.total || 0)
    );

    const totalTurno =
      (volume_por_turno.antes_14h || 0) +
      (volume_por_turno.depois_14h || 0) ||
      1;

    const percentAntes = Math.round(
      (volume_por_turno.antes_14h / totalTurno) * 100
    );

    const percentDepois = Math.round(
      (volume_por_turno.depois_14h / totalTurno) * 100
    );

    const maxTimeline = Math.max(
      1,
      ...timeline.map(i => i.emissoes ?? i.volume ?? 0)
    );

    return {
      maxEmissoes,
      maxCancelamentos,
      totalTurno,
      percentAntes,
      percentDepois,
      maxTimeline
    };
  }, [emissoes_por_usuario, cancelamentos_por_usuario, volume_por_turno, timeline]);

  return (
    <div className="charts-container">
      <div className="charts-row">

        {/* ================= PRODUTIVIDADE ================= */}
        <div className="chart-card">
          <h3>Produtividade por Emissor</h3>

          <div className="horizontal-bars">
            {emissoes_por_usuario.map((item) => (
              <div key={item.nome} className="bar-item">
                <span className="bar-label">{item.nome}</span>

                <div className="bar-wrapper">
                  <div
                    className="bar-fill produtividade"
                    style={{
                      width: `${(item.emissoes / maxEmissoes) * 100}%`
                    }}
                  >
                    {item.emissoes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= CANCELAMENTOS ================= */}
        <div className="chart-card">
          <h3>Análise de Cancelamentos</h3>

          <div className="horizontal-bars">
            {cancelamentos_por_usuario.map((item) => (
              <div key={item.nome} className="bar-item">
                <span className="bar-label">{item.nome}</span>

                <div className="bar-wrapper">
                  <div
                    className="bar-fill cancelamento"
                    style={{
                      width: `${(item.total / maxCancelamentos) * 100}%`
                    }}
                  >
                    {item.total}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= TURNO ================= */}
        <div className="chart-card">
          <h3>Indicador de Turno (Corte 14h)</h3>

          <div className="turno-container">
            <div>
              <div className="turno-label">Antes 14h</div>

              <div className="turno-bar-wrapper">
                <div
                  className="turno-bar antes"
                  style={{ width: `${percentAntes}%` }}
                >
                  {percentAntes}% ({volume_por_turno.antes_14h})
                </div>
              </div>
            </div>

            <div>
              <div className="turno-label">Depois 14h</div>

              <div className="turno-bar-wrapper">
                <div
                  className="turno-bar depois"
                  style={{ width: `${percentDepois}%` }}
                >
                  {percentDepois}% ({volume_por_turno.depois_14h})
                </div>
              </div>
            </div>

            <div className="turno-total">
              Total: {totalTurno} CT-es
            </div>
          </div>
        </div>
      </div>

      {/* ================= TIMELINE ================= */}
<div className="timeline-container">
  <h3>Timeline de Operação (07:00 - 23:00)</h3>

  <div className="timeline-chart">
    {timeline
      .filter(item => {
        const hora = parseInt(item.hora.split(':')[0]);
        return hora >= 7 && hora <= 23;
      })
      .map((item, index) => {
        const valor = item.emissoes ?? item.volume ?? 0;
        const isPico = valor === maxTimeline && valor > 0;
        
        // Cálculo da altura proporcional (0 a 100%)
        const alturaBarra = `${(valor / maxTimeline) * 100}%`;

        return (
          <div key={index} className={`timeline-item ${isPico ? 'pico' : ''}`}>
            <span className="valor-tooltip">{valor}</span>
            
            <div 
              className="barra-volumetrica" 
              style={{ height: alturaBarra }}
            >
              {isPico && <span className="pico-label">PICO</span>}
            </div>

            <span className="hora-label">{item.hora}</span>
          </div>
        );
      })}
  </div>
</div>
  );
};

export default Charts;

