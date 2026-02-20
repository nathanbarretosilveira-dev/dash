import React from 'react';
import './Charts.css';
 
const Charts = ({ data }) => {
  const { emissoes_por_usuario, cancelamentos_por_usuario, volume_por_turno, timeline } = data;
 
  // Calcular total para o gráfico de turno
  const totalTurno = volume_por_turno.antes_14h + volume_por_turno.depois_14h || 1;
  const percentAntes = ((volume_por_turno.antes_14h / totalTurno) * 100).toFixed(0);
  const percentDepois = ((volume_por_turno.depois_14h / totalTurno) * 100).toFixed(0);
 
  return (
    <div className="charts-wrapper">
      {/* Primeira linha: 3 gráficos lado a lado */}
      <div className="charts-row">
        {/* Produtividade por Emissor */}
        <div className="chart-card">
          <h3 className="chart-title">Produtividade por Emissor</h3>
          <div className="chart-content">
            {emissoes_por_usuario.map((item, index) => (
              <div key={index} className="bar-item">
                <span className="bar-label">{item.usuario}</span>
                <div className="bar-wrapper">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${(item.emissoes / 100) * 100}%`,
                      background: `linear-gradient(90deg, #6366f1, #8b5cf6)`
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
                <span className="bar-label">{item.usuario}</span>
                <div className="bar-wrapper">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${(item.total / 12) * 100}%`,
                      background: `linear-gradient(90deg, #ef4444, #f472b6)`
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
        <div className="chart-card">
          <h3 className="chart-title">Indicador de Turno (Corte 14h)</h3>
          <div className="turno-content">
            <div className="turno-item">
              <div className="turno-label">
                <span className="turno-dot" style={{ background: '#06b6d4' }}></span>
                Antes 14h
              </div>
              <div className="turno-value">{volume_por_turno.antes_14h}</div>
              <div className="turno-percent">{percentAntes}%</div>
              <div className="turno-bar">
                <div 
                  className="turno-bar-fill" 
                  style={{ 
                    width: `${percentAntes}%`,
                    background: 'linear-gradient(90deg, #06b6d4, #22d3ee)'
                  }}
                ></div>
              </div>
            </div>
            <div className="turno-item">
              <div className="turno-label">
                <span className="turno-dot" style={{ background: '#f59e0b' }}></span>
                Depois 14h
              </div>
              <div className="turno-value">{volume_por_turno.depois_14h}</div>
              <div className="turno-percent">{percentDepois}%</div>
              <div className="turno-bar">
                <div 
                  className="turno-bar-fill" 
                  style={{ 
                    width: `${percentDepois}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  }}
                ></div>
              </div>
            </div>
            <div className="turno-total">
              Total: {totalTurno} CT-es
            </div>
          </div>
        </div>
      </div>
 
      {/* Timeline de Operação - Largura total */}
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
                    height: `${(item.volume / 35) * 100}%`,
                    background: `linear-gradient(180deg, #6366f1, #8b5cf6)`
                  }}
                ></div>
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
 
