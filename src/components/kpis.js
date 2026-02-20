import React from 'react';
import './KPIs.css';
 
const KPIs = ({ data }) => {
  const { resumo } = data;
 
  const kpis = [
    {
      title: 'Total de Emissões',
      value: resumo.total_emissoes,
      trend: '+12.5%',
      trendUp: true,
      detail: `${resumo.total_emissoes - resumo.total_cancelamentos} válidos`,
      icon: '📄',
      color: 'purple'
    },
    {
      title: 'Cancelamentos',
      value: resumo.total_cancelamentos,
      trend: '7.3%',
      trendUp: false,
      detail: 'requer atenção',
      icon: '⚠️',
      color: 'red'
    },
    {
      title: 'Taxa de Eficiência',
      value: `${resumo.taxa_eficiencia.toFixed(2)}%`,
      trend: 'Abaixo da meta',
      trendUp: false,
      detail: 'meta: 95%',
      icon: '📊',
      color: 'green',
      progress: resumo.taxa_eficiencia
    },
    {
      title: 'Produtividade Média',
      value: resumo.produtividade_media,
      trend: 'CT-es/pessoa',
      trendUp: true,
      detail: 'NATHAN.B: líder',
      icon: '👥',
      color: 'orange'
    }
  ];
 
  return (
    <div className="kpis-container">
      {kpis.map((kpi, index) => (
        <div key={index} className={`kpi-card ${kpi.color}`}>
          <div className="kpi-icon">{kpi.icon}</div>
          <div className="kpi-content">
            <div className="kpi-header">
              <span className="kpi-title">{kpi.title}</span>
              <span className={`kpi-trend ${kpi.trendUp ? 'up' : 'down'}`}>
                {kpi.trendUp ? '↑' : '↓'} {kpi.trend}
              </span>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            {kpi.progress && (
              <div className="kpi-progress">
                <div 
                  className="kpi-progress-bar" 
                  style={{ width: `${kpi.progress}%` }}
                ></div>
              </div>
            )}
            <div className="kpi-detail">{kpi.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
 
export default KPIs;
 
