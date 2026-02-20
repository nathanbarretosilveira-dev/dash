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
      <div className="chart-card timeline-fullwidth">
        <h3>Timeline de Operação</h3>

        <div className="timeline-container">
          {timeline.map((item) => {
            const valor = item.emissoes ?? item.volume ?? 0;
            const isPico = valor === maxTimeline;

            return (
              <div key={item.hora} className="timeline-item">
                <span className="timeline-value">{valor}</span>

                <div
                  className={`timeline-bar ${isPico ? 'pico' : ''}`}
                  style={{
                    height: `${(valor / maxTimeline) * 100}%`
                  }}
                />

                <span className="timeline-label">{item.hora}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Charts;
