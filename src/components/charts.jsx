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

  // Totais dinâmicos
  const maxEmissoes = Math.max(...emissoes_por_usuario.map(i => i.emissoes), 1);
  const maxCancelamentos = Math.max(...cancelamentos_por_usuario.map(i => i.total), 1);

  const totalTurno =
    (volume_por_turno.antes_14h || 0) +
    (volume_por_turno.depois_14h || 0) || 1;

  const percentAntes = ((volume_por_turno.antes_14h / totalTurno) * 100).toFixed(0);
  const percentDepois = ((volume_por_turno.depois_14h / totalTurno) * 100).toFixed(0);

  const maxTimeline = Math.max(...timeline.map(i => i.volume), 1);

  return (
    <div className="charts-wrapper">
      <div className="charts-row">

        {/* Produtividade por Emissor */}
        <div className="chart-card">
          <h3 className="chart-title">Produtividade por Emissor</h3>
          <div className="chart-content">
            {emissoes_por_usuario.map((item, index) => (
              <div key={index} className="bar-item">
                <span className="bar-label">{item.nome}</span>
                <div className="bar-wrapper">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(item.emissoes / maxEmissoes) * 100}%`,
                      background: 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                    }}
                  >
                    <span className="bar-value">{item.emissoes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Análise de Cancelamentos */}
        <div className="chart-card">
          <h3 className="chart-title">Análise de Cancelamentos</h3>
          <div className="chart-content">
            {cancelamentos_por_usuario.map((item, index) => (
              <div key={index} className="bar-item">
                <span className="bar-label">{item.nome}</span>
                <div className="bar-wrapper">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(item.total / maxCancelamentos) * 100}%`,
                      background: 'linear-gradient(90deg, #ef4444, #f472b6)'
                    }}
                  >
                    <span className="bar-value">{item.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicador de Turno */}
        const TurnoIndicator = ({ antes, depois }) => {
  const total = antes + depois;

  return (
    <div className="card">
      <h3>Indicador de Turno (Corte 14h)</h3>

      <div className="turno-bar">
        <div
          className="antes"
          style={{ width: `${(antes / total) * 100}%` }}
        >
          Antes 14h ({antes})
        </div>

        <div
          className="depois"
          style={{ width: `${(depois / total) * 100}%` }}
        >
          Depois 14h ({depois})
        </div>
      </div>

      <small>Total: {total} CT-es</small>
    </div>
  );
};
      
      {/* Timeline */}
      <div className="chart-card timeline-card">
        <h3 className="chart-title">Timeline de Operação</h3>
        <div className="timeline-content">
          {timeline.map((item, index) => (
            <div key={index} className="timeline-item">
              <span className="timeline-label">{item.hora}</span>
              <div className="timeline-bar-wrapper">
                <div
                  className="timeline-bar"
                  style={{
                    height: `${(item.volume / maxTimeline) * 100}%`,
                    background: 'linear-gradient(180deg, #6366f1, #8b5cf6)'
                  }}
                />
              </div>
              <span className="timeline-value">{item.volume}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Charts;

