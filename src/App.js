import React from 'react';
import WalletConnector from './components/WalletConnector';
import WalletInfo from './components/WalletInfo';
import SendEth from './components/SendEth';

const App = () => {
  return (
    <div className="App h-screen bg-gray-50">
      {/* Barra superior */}
      <div className="relative">
        {/* Esquina superior izquierda: Balance */}
        <WalletInfo />

        {/* Esquina superior derecha: Botón de conexión */}
        <div className="absolute top-4 right-4">
          <WalletConnector />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex justify-center items-center h-full">
        <div className="w-full max-w-lg">
          <SendEth />
        </div>
      </div>
    </div>
  );
};

export default App;