import React, { useEffect, useMemo, useState } from 'react';
import WalletConnector from './components/WalletConnector';
import SendEth from './components/SendEth';
import TransactionHistoryContainer from './components/TransactionHistoryContainer';
import { BalancesProvider } from './context/BalancesContext';
import { useAccount } from 'wagmi';
import ConnectWalletPrompt from './components/ConnectWalletPrompt';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Toaster } from 'sonner';

const App = () => {
  const { isConnected } = useAccount();

  const [init, setInit] = useState(false);
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);
  const particleOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: { enable: true, mode: ["grab", "bubble"] },
          onClick: { enable: true, mode: "push" },
          resize: true,
        },
        modes: {
          grab: { distance: 180, links: { opacity: 0.7 } },
          bubble: { distance: 120, size: 8, duration: 2, opacity: 1 },
          push: { quantity: 2 },
        },
      },
      particles: {
        color: { value: ["#a78bfa", "#60a5fa", "#fff"] },
        links: {
          color: "#a78bfa",
          distance: 120,
          enable: true,
          opacity: 0.5,
          width: 2,
        },
        move: {
          enable: true,
          speed: 2,
          outModes: { default: "bounce" },
        },
        number: { value: 160, density: { enable: true, area: 1200 } },
        opacity: { value: 0.8 },
        shape: { type: "circle" },
        size: { value: { min: 2, max: 6 } },
      },
      detectRetina: true,
    }),
    []
  );

  return (
    <BalancesProvider>
      <div className="App min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col">
        <div className="flex items-center justify-between px-10 py-6 bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl rounded-b-3xl mb-4 z-20">
          <div className="flex items-center space-x-4">
            <span className="text-white font-extrabold text-3xl tracking-wider drop-shadow-lg">Send ETH App</span>
          </div>
          <div>
            <WalletConnector />
          </div>
        </div>
        <div className="flex-grow flex flex-col items-center bg-gray-100 space-y-8 relative z-10">
          {!isConnected && init && (
            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
              <Particles id="tsparticles" options={particleOptions} style={{ width: "100%", height: "100%" }} />
            </div>
          )}
          <div className="relative z-10 w-full flex flex-col items-center">
            {isConnected ? (
              <>
                <SendEth />
                <TransactionHistoryContainer />
              </>
            ) : (
              <ConnectWalletPrompt />
            )}
          </div>
        </div>
        <Toaster
  position="bottom-right"
  theme="light"
  richColors
  toastOptions={{
    style: {
      borderRadius: '16px',
      background: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ff 100%)',
      color: '#312e81',
      border: '2px solid #a78bfa',
      boxShadow: '0 4px 24px 0 rgba(96,165,250,0.10)',
      fontWeight: 600,
      fontFamily: 'inherit',
      fontSize: '1.05rem',
      padding: '1.25rem 1.5rem',
      letterSpacing: '0.01em',
    },
    duration: 7000,
    className: 'shadow-xl',
  }}
/>
      </div>
    </BalancesProvider>
  );
};

export default App;