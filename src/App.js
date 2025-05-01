import React from 'react';
import WalletConnector from './components/WalletConnector';
import WalletInfo from './components/WalletInfo';
import SendEth from './components/SendEth';

const App = () => {
  return (
    <div className="App min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col">
      {/* Barra superior */}
      <div className="relative flex justify-between items-center p-4 bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
        {/* Logotipo o título */}
        <div className="flex items-center text-white font-bold text-lg">
          <span>Send ETH App</span>
        </div>

        {/* Esquina superior izquierda: Balance */}
        <div className="flex items-center">
          <WalletInfo />
        </div>

        {/* Esquina superior derecha: Botón de conexión */}
        <div className="flex items-center">
          <WalletConnector />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-grow flex justify-center items-start bg-gray-100">
        <SendEth />
      </div>
    </div>
  );
};

export default App;