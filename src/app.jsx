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

    const carregarDados = async () => {
      setLoadingData(true);
      setErrorData('');

      try {
        const resposta = await fetch('/api/cte-data');
        if (!resposta.ok) {
          throw new Error(`Falha ao carregar dados (${resposta.status})`);
        }

        const dados = await resposta.json();
        if (ativo) {
          setCteData(dados);
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
