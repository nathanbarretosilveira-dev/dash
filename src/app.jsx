import React, { useEffect, useState } from 'react';
import './app.css';
import Header from './components/header';
import Dashboard from './components/dashboard';
 
const TV_MODE_STORAGE_KEY = 'dashboard_tv_mode';

function App() {
  const [isTvMode, setIsTvMode] = useState(() => {
    try {
      return window.localStorage.getItem(TV_MODE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [cteData, setCteData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState('');

  useEffect(() => {
    let ativo = true;

    const carregarDadosDaApi = async (url) => {
      const resposta = await fetch(url);
      if (!resposta.ok) {
        throw new Error(`Falha ao carregar dados (${resposta.status})`);
      }

      const contentType = resposta.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('A API retornou um conteúdo inválido. Verifique se o backend está ativo.');
      }

      return resposta.json();
    };

       const carregarMetadados = async () => {
      try {
        return await carregarDadosDaApi('/api/cte-data-metadata');
      } catch {
        return null;
      }
    };

    const carregarDados = async () => {
      setLoadingData(true);
      setErrorData('');

      try {
        const [dados, metadata] = await Promise.all([
          carregarDadosDaApi('/api/cte-data'),
          carregarMetadados()
        ]);

        if (ativo) {
          setCteData({
            ...dados,
            atualizado_em: dados?.atualizado_em || metadata?.atualizadoEm || dados?.criado_em,
            atualizado_em_br: dados?.atualizado_em_br || metadata?.atualizadoEmBr || null
          });
        }
      } catch (erro) {
        if (ativo) {
          setErrorData(erro.message || 'Erro ao carregar dados da planilha.');
        }
      } finally {
        if (ativo) {
          setLoadingData(false);
        }
      }
    };

    carregarDados();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(TV_MODE_STORAGE_KEY, isTvMode ? '1' : '0');
    } catch {
      // Ignora falhas de storage em contextos restritos.
    }
  }, [isTvMode]);

  const alternarTvMode = () => setIsTvMode((prev) => !prev);

  return (
    <div className={`app ${isTvMode ? 'tv-mode' : ''}`}>
      <Header isTvMode={isTvMode} onToggleTvMode={alternarTvMode} cteData={cteData} />
      <main className="main-content">
        {loadingData ? <p>Carregando dados da planilha...</p> : null}
        {errorData ? <p>Erro: {errorData}</p> : null}
        {!loadingData && !errorData ? <Dashboard cteData={cteData} /> : null}
      </main>
    </div>
  );
}
 
export default App;


