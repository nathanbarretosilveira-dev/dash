import React from 'react';
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
     CÁLCULOS
     ========================= */
  const maxEmissoes = Math.max(...emissoes_por_usuario.map(i => i.emissoes), 1);
  const maxCancelamentos = Math.max(...cancelamentos_por_usuario.map(i => i.total), 1);

  const totalTurno =
    (volume_por_turno.antes_14h || 0) +
    (volume_por_turno.depois_14h || 0) || 1;

  const percentAntes = ((volume_por_turno.antes_14h / totalTurno) * 100).toFixed(0);
  const percentDepois = ((volume_por_turno.depois_14h / totalTurno) * 100).toFixed(0);

  const maxTimeline = Math.max(
     ...timeline.map(i => i.volume ?? i.emissoes ?? 0),
  1
);
  
  return (
    <div className="charts-container">
      <div className="charts-row">

        {/* ================= PRODUTIVIDADE ================= */}
        <div className="chart-card">
          <h3>Produtividade por Emissor</h3>
          <div className="horizontal-bars">
            {emissoes_por_usuario.map((item, index) => (
              <div key={index} className="bar-item">
                <span className="bar-label">{item.nome}</span>
                <div className="bar-wrapper">
                  <div
                    className="bar-fill produtividade"
                    style={{ width: `${(item.emissoes / maxEmissoes) * 100}%` }}
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
            {cancelamentos_por_usuario.map((item, index) => (
              <div key={index} className="bar-item">
                <span className="bar-label">{item.nome}</span>
                <div className="bar-wrapper">
                  <div
                    className="bar-fill cancelamento"
                    style={{ width: `${(item.total / maxCancelamentos) * 100}%` }}
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
          {timeline.map((item, index) => {
            const valor = item.volume ?? item.emissoes ?? 0;
            const isPico = valor === maxTimeline;
            return (
              <div key={index} className="timeline-item">
                <span className="timeline-value">{item.volume}</span>
                <div
                  className={`timeline-bar ${isPico ? 'pico' : ''}`}
                  style={{ height: `${(item.volume / maxTimeline) * 100}%` }}
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


