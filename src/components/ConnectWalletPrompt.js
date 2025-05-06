import React from "react";

const ConnectWalletPrompt = () => (
  <div className="relative flex flex-col items-center justify-center mt-24 min-h-[350px] z-10">
    <div className="relative z-10 bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-pulse border-4 border-white/30">
      <svg className="mx-auto mb-4 w-16 h-16 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v.01M12 13a4 4 0 100-8 4 4 0 000 8zm0 0v4m0 0h4m-4 0H8" />
      </svg>
      <h2 className="text-2xl font-bold text-white mb-2">Connect your wallet</h2>
      <p className="text-white text-lg opacity-90">Please connect your wallet to use the app features.</p>
    </div>
  </div>
);

export default ConnectWalletPrompt;