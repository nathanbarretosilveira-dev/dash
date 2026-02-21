const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

const normalizarDataDiaMes = (valor) => {
  if (!valor) return '';

  const [dia = '', mes = ''] = String(valor)
    .trim()
    .split('/');

  if (!dia || !mes) return '';

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}`;
};

const obterHojeBrasilia = () => {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    day: '2-digit',
    month: '2-digit'
  });

  return formatter.format(new Date());
};

const obterMesBrasilia = () => {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    month: '2-digit'
  });

  return formatter.format(new Date());
};

export const getHoje = (dadosPorDia) => {
  if (!dadosPorDia?.length) return [];

  const hoje = obterHojeBrasilia();

  return dadosPorDia.filter((dia) => normalizarDataDiaMes(dia.data) === hoje);
};

export const getMesAtual = (dadosPorDia) => {
  if (!dadosPorDia?.length) return [];

  const mesAtual = obterMesBrasilia();

  return dadosPorDia.filter((dia) => {
    const [, mes = ''] = normalizarDataDiaMes(dia.data).split('/');
    return mes === mesAtual;
  });
};

export const getSemana = (dadosPorDia) => {
  if (!dadosPorDia?.length) return [];
  return dadosPorDia.slice(-7);
};

export const somarPeriodo = (dados) => {
  return dados.reduce(
    (acc, d) => {
      acc.emissoes += d.emissoes;
      acc.cancelamentos += d.cancelamentos;
      return acc;
    },
    { emissoes: 0, cancelamentos: 0 }
  );
};
