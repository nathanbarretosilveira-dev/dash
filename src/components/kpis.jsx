import React from 'react';
import './kpis.css';

const KPIs = ({ data }) => {
  if (!data || !data.resumo) return null;

  const {
    resumo,
    emissoes_por_usuario = []
  } = data;

  const tendenciaEmissoes = resumo.tendencia_emissoes_7d || { variacao: 0, subiu: false };
  const tendenciaCancelamento = resumo.tendencia_taxa_cancelamento_7d || { variacao: 0, subiu: false };

  const formatarTendencia = (valor) => {
    const sinal = valor > 0 ? '+' : '';
    return `${sinal}${valor.toFixed(1)}%`;
  };

  const totalEmissoes = resumo.total_emissoes || 0;
  const totalCancelamentos = resumo.total_cancelamentos || 0;
  const totalEmissoesValidas = Math.max(0, totalEmissoes - totalCancelamentos);
  const totalUsuarios = emissoes_por_usuario.length || 1;
  const produtividadeMedia = resumo.produtividade_media ?? Math.round(totalEmissoesValidas / totalUsuarios);

  const kpis = [
    {
      title: 'Total de Emissões',
      value: resumo.total_emissoes,
      trend: formatarTendencia(tendenciaEmissoes.variacao),
      trendUp: tendenciaEmissoes.subiu,
      detail: `(${totalEmissoesValidas} válidos)`,
      icon: '📄',
      color: 'purple' // Isso vai virar kpi-purple
    },
    {
      title: 'Cancelamentos',
      value: resumo.total_cancelamentos,
      trend: formatarTendencia(tendenciaCancelamento.variacao),
      trendUp: tendenciaCancelamento.subiu,
      detail: 'Homologados SEFAZ',
      icon: '⚠️',
      color: 'red', // Isso vai virar kpi-red
      invertTrendColor: true
    },
    {
      title: 'Taxa de Eficiência',
      value: `${resumo.taxa_eficiencia.toFixed(2)}%`,
      trend: resumo.taxa_eficiencia >= 90 ? 'Dentro da meta' : 'Abaixo da meta',
      trendUp: resumo.taxa_eficiencia >= 90,
      detail: 'meta: 90%',
      icon: '📊',
      color: 'green', // Isso vai virar kpi-green
      progress: resumo.taxa_eficiencia
    },
    {
      title: 'Produtividade Média',
      value: produtividadeMedia,
      trend: 'CT-es / pessoa',
      trendUp: true,
      detail: `Equipe: ${totalUsuarios} usuários`,
      icon: '👥',
      color: 'orange' // Isso vai virar kpi-orange
    }
  ];

  return (
    <div className="kpis-container">
      {kpis.map((kpi, index) => (
        /* AJUSTE AQUI: Adicionamos as classes kpi-card e kpi-COR */
        <div key={index} className={`kpi-card kpi-${kpi.color}`}>
          <div className="kpi-header">
            <div className="kpi-icon">{kpi.icon}</div>
            <div className={`kpi-trend ${kpi.trendUp ? 'up' : 'down'} ${kpi.invertTrendColor ? 'is-risk' : ''}`}>
              {kpi.trendUp ? '↑' : '↓'} {kpi.trend}
            </div>
          </div>

          <div className="kpi-content">
            <div className="kpi-title">{kpi.title}</div>
            <div className="kpi-value">{kpi.value}</div>

            {kpi.progress !== undefined && (
              <div className="kpi-progress">
                <div 
                  className="kpi-progress-bar" 
                  style={{ width: `${kpi.progress}%` }}
                />
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
