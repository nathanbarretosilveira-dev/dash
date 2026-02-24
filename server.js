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
  const dd = String(data.getDate()).padStart(2, '0');
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const aaaa = data.getFullYear();
  const hh = String(data.getHours()).padStart(2, '0');
  const mi = String(data.getMinutes()).padStart(2, '0');
  const ss = String(data.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${aaaa} ${hh}:${mi}:${ss}`;
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
  const sharedStrings = lerSharedStrings(xlsxPath);
  const sheetXml = lerEntradaXlsx(xlsxPath, 'xl/worksheets/sheet1.xml');

  const rows = [];
  const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
  const cellRegex = /<c([^>]*)r="([A-Z]+)(\d+)"[^>]*(?:\/>|>([\s\S]*?)<\/c>)/g;

  for (const rowMatch of sheetXml.matchAll(rowRegex)) {
    const rowXml = rowMatch[1] || '';
    const row = {};

    for (const cellMatch of rowXml.matchAll(cellRegex)) {
      const cellXml = cellMatch[0] || '';
      const col = cellMatch[2];
      const cellBody = cellMatch[4] || '';
      const typeMatch = cellXml.match(/t="([^"]+)"/);
      const type = typeMatch ? typeMatch[1] : '';
      const vMatch = cellBody.match(/<v[^>]*>([\s\S]*?)<\/v>/);
      const tMatch = cellBody.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      let value = '';

      if (type === 's' && vMatch) {
        const idx = Number(vMatch[1]);
        value = Number.isFinite(idx) ? (sharedStrings[idx] || '') : '';
      } else if (tMatch) {
        value = decodeXml(tMatch[1]);
      } else if (vMatch) {
        value = decodeXml(vMatch[1]);
      }

      row[col] = String(value).trim();
    }

    rows.push(row);
  }

  return rows;
};

const montarDadosPlanilha = (xlsxPath) => {
  const rows = parseLinhasPlanilha(xlsxPath);
  if (rows.length === 0) {
    throw new Error('A planilha não possui linhas.');
  }

  const headersRaw = rows[0];
  const headerCols = Object.keys(headersRaw).sort();
  const headerByColumn = new Map(headerCols.map((col) => [col, normalizarTitulo(headersRaw[col])]));

  const registros = [];
  for (const row of rows.slice(1)) {
    const registro = {};

    for (const [col, key] of headerByColumn.entries()) {
      registro[key] = row[col] || '';
    }

    if (!registro.n_documento && !registro.numero_de_nota_fiscal_eletronica && !registro.criado_por) {
      continue;
    }

    const dataRaw = registro.data_de_criacao;
    const horaRaw = registro.hora_processamento;
    const criadoPor = registro.criado_por || 'Não informado';
    const estornado = String(registro.estornado || '').toUpperCase() === 'X';

    const dataObj = dataRaw ? new Date(String(dataRaw).replace(' ', 'T')) : null;
    const dataKey = dataObj && !Number.isNaN(dataObj.getTime()) ? formatarDataBr(dataObj) : 'Sem data';

    let hora = String(horaRaw || '').slice(0, 8);
    if (!/^\d{2}:\d{2}:\d{2}$/.test(hora)) {
      hora = '00:00:00';
    }

    registros.push({
      data: dataKey,
      hora,
      criadoPor,
      estornado
    });
  }

  const porUsuario = new Map();
  const porDia = new Map();
  const porDiaUsuario = new Map();
  const porDiaTurno = new Map();
  const timelineHora = new Map();

  for (const r of registros) {
    if (!porUsuario.has(r.criadoPor)) porUsuario.set(r.criadoPor, { nome: r.criadoPor, emissoes: 0, cancelamentos: 0 });
    const pu = porUsuario.get(r.criadoPor);
    if (r.estornado) pu.cancelamentos += 1;
    else pu.emissoes += 1;

    if (!porDia.has(r.data)) porDia.set(r.data, { data: r.data, emissoes: 0, cancelamentos: 0 });
    const pd = porDia.get(r.data);
    if (r.estornado) pd.cancelamentos += 1;
    else pd.emissoes += 1;

    if (!porDiaUsuario.has(r.data)) porDiaUsuario.set(r.data, new Map());
    const mapaUsuarios = porDiaUsuario.get(r.data);
    if (!mapaUsuarios.has(r.criadoPor)) mapaUsuarios.set(r.criadoPor, { nome: r.criadoPor, emissoes: 0, cancelamentos: 0 });
    const pdu = mapaUsuarios.get(r.criadoPor);
    if (r.estornado) pdu.cancelamentos += 1;
    else pdu.emissoes += 1;

    if (!porDiaTurno.has(r.data)) porDiaTurno.set(r.data, { data: r.data, antes_14h: 0, depois_14h: 0 });
    if (!r.estornado && r.hora !== '00:00:00') {
      const horaNum = Number(r.hora.split(':')[0]);
      const t = porDiaTurno.get(r.data);
      if (horaNum < 14) t.antes_14h += 1;
      else t.depois_14h += 1;

      const faixaHora = `${String(horaNum).padStart(2, '0')}:00`;
      timelineHora.set(faixaHora, (timelineHora.get(faixaHora) || 0) + 1);
    }
  }

  const ordenarPorDataBr = (a, b) => {
    const [da, ma, aa] = a.data.split('/').map(Number);
    const [db, mb, ab] = b.data.split('/').map(Number);
    return new Date(2000 + aa, ma - 1, da) - new Date(2000 + ab, mb - 1, db);
  };

  const dados_por_dia = Array.from(porDia.values()).sort(ordenarPorDataBr);
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
  if (fonte.tipo === 'planilha') {
    try {
      return montarDadosPlanilha(fonte.caminho);
    } catch (error) {
      if (fs.existsSync(cteJsonPath)) {
        console.warn(`Falha ao processar planilha (${error.message}). Usando fallback cte_data.json.`);
        return carregarDadosJson();
      }
      throw error;
    }
  }
  return carregarDadosJson();
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
        atualizadoEm: stats.mtime?.toISOString?.() || null
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
 
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
