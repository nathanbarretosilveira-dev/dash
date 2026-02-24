import express from 'express';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
const app = express();
const port = process.env.PORT || 7067;
 
app.use(express.json());

const cteSpreadsheetPath = path.join(__dirname, 'src', 'data', 'J1BNFE.xlsx');
const cteJsonPath = path.join(__dirname, 'src', 'data', 'cte_data.json');
const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

const decodeXml = (value = '') => value
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const normalizarTitulo = (valor = '') => String(valor)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const formatarDataBr = (data) => {
  const dd = String(data.getDate()).padStart(2, '0');
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const aa = String(data.getFullYear()).slice(-2);
  return `${dd}/${mm}/${aa}`;
};

const formatarDataHoraBr = (data) => {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(data).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
};

const lerEntradaXlsx = (xlsxPath, entryName) => execFileSync('unzip', ['-p', xlsxPath, entryName], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024
});

const lerSharedStrings = (xlsxPath) => {
  const xml = lerEntradaXlsx(xlsxPath, 'xl/sharedStrings.xml');
  const itens = [];
  const siRegex = /<si[\s\S]*?<\/si>/g;
  const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g;

  for (const si of xml.match(siRegex) || []) {
    const partes = [];
    for (const t of si.matchAll(tRegex)) {
      partes.push(decodeXml(t[1] || ''));
    }
    itens.push(partes.join(''));
  }

  return itens;
};

const parseLinhasPlanilha = (xlsxPath) => {
@@ -203,119 +214,132 @@ const montarDadosPlanilha = (xlsxPath) => {
  const emissoes_por_turno_por_dia = Array.from(porDiaTurno.values()).sort(ordenarPorDataBr);
  const emissoes_por_usuario_por_dia = Array.from(porDiaUsuario.entries())
    .map(([data, usuariosMap]) => ({
      data,
      usuarios: Array.from(usuariosMap.values()).sort((a, b) => b.emissoes - a.emissoes)
    }))
    .sort((a, b) => ordenarPorDataBr(a, b));

  const emissoes_por_usuario = Array.from(porUsuario.values()).sort((a, b) => b.emissoes - a.emissoes);
  const cancelamentos_por_usuario = emissoes_por_usuario
    .map((u) => ({ nome: u.nome, total: u.cancelamentos }))
    .sort((a, b) => b.total - a.total);

  const timeline_operacao = Array.from(timelineHora.entries())
    .map(([hora, emissoes]) => ({ hora, emissoes }))
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const totalCancelamentos = registros.filter((r) => r.estornado).length;
  const totalEmissoesLiquidas = registros.length - totalCancelamentos;
  const totalEmissoes = registros.length;

  const stats = fs.statSync(xlsxPath);

  return {
    criado_em: formatarDataHoraBr(stats.mtime),
    atualizado_em: stats.mtime.toISOString(),
    resumo: {
      total_emissoes: totalEmissoes,
      total_cancelamentos: totalCancelamentos,
      taxa_eficiencia: totalEmissoes > 0
        ? Number(((totalEmissoesLiquidas / totalEmissoes) * 100).toFixed(2))
        : 0
    },
    emissoes_por_usuario,
    cancelamentos_por_usuario,
    emissoes_por_turno: emissoes_por_turno_por_dia.reduce((acc, d) => {
      acc.antes_14h += d.antes_14h;
      acc.depois_14h += d.depois_14h;
      return acc;
    }, { antes_14h: 0, depois_14h: 0 }),
    emissoes_por_turno_por_dia,
    timeline_operacao,
    timeline_operacao_detalhada: timelineOperacaoDetalhada,
    dados_por_dia,
    emissoes_por_usuario_por_dia
  };
};

const carregarDadosJson = () => {
  if (!fs.existsSync(cteJsonPath)) {
    throw new Error('Arquivo cte_data.json não encontrado.');
  }
  const conteudo = fs.readFileSync(cteJsonPath, 'utf8');
  return JSON.parse(conteudo);
};

const obterFonteAtiva = () => {
  if (fs.existsSync(cteSpreadsheetPath)) {
    return { tipo: 'planilha', caminho: cteSpreadsheetPath, arquivo: 'J1BNFE.xlsx' };
  }
  if (fs.existsSync(cteJsonPath)) {
    return { tipo: 'json', caminho: cteJsonPath, arquivo: 'cte_data.json' };
  }
  throw new Error('Nenhuma fonte de dados disponível em src/data (J1BNFE.xlsx ou cte_data.json).');
};

const carregarDadosCte = () => {
  const fonte = obterFonteAtiva();

  const anexarAtualizacao = (dadosBase, caminhoFonte) => {
    const stats = fs.statSync(caminhoFonte);
    return {
      ...dadosBase,
      atualizado_em: stats.mtime?.toISOString?.() || null,
      criado_em: dadosBase?.criado_em || formatarDataHoraBr(stats.mtime)
    };
  };

  if (fonte.tipo === 'planilha') {
    try {
      return anexarAtualizacao(montarDadosPlanilha(fonte.caminho), fonte.caminho);
    } catch (error) {
      if (fs.existsSync(cteJsonPath)) {
        console.warn(`Falha ao processar planilha (${error.message}). Usando fallback cte_data.json.`);
        return anexarAtualizacao(carregarDadosJson(), cteJsonPath);
      }
      throw error;
    }
  }

  return anexarAtualizacao(carregarDadosJson(), fonte.caminho);
};

app.get('/api/cte-data-metadata', (_req, res) => {
  try {
    const fonte = obterFonteAtiva();
    fs.stat(fonte.caminho, (err, stats) => {
      if (err) {
        res.status(500).json({ error: `Não foi possível obter metadados do arquivo ${fonte.arquivo}.` });
        return;
      }

      res.json({
        arquivo: fonte.arquivo,
        criadoEm: stats.birthtime?.toISOString?.() || null,
        atualizadoEm: stats.mtime?.toISOString?.() || null,
        atualizadoEmBr: stats.mtime ? formatarDataHoraBr(stats.mtime) : null
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cte-data', (_req, res) => {
  try {
    const dados = carregarDadosCte();
    res.json(dados);
  } catch (error) {
    res.status(500).json({
      error: 'Não foi possível carregar os dados de CT-e.',
      detalhes: error.message
    });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
 
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
 
