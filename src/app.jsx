import React from 'react';
import './app.css';
import Header from './components/header';
import Dashboard from './components/dashboard';
 
function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Dashboard />
      </main>
    </div>
  );
}
 
export default App;
 


