export const getHoje = (dadosPorDia) => {
  if (!dadosPorDia?.length) return [];
  return [dadosPorDia[dadosPorDia.length - 1]];
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
