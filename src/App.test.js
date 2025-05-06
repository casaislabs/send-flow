import React from 'react';

jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: (props) => <button onClick={props.onClick}>Connect Wallet</button>,
}));
jest.mock('alchemy-sdk', () => ({
  Alchemy: function () { return { core: { getTokenBalances: jest.fn(), getTokenMetadata: jest.fn() } }; },
  Network: {},
}));
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));
jest.mock('@tsparticles/react', () => ({
  __esModule: true,
  default: () => <div data-testid="particles" />,
  initParticlesEngine: jest.fn(),
}));
jest.mock('@tsparticles/slim', () => ({
  loadSlim: jest.fn(),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import WalletConnector from './components/WalletConnector';
import ConnectWalletPrompt from './components/ConnectWalletPrompt';
import SendEth from './components/SendEth';
import TokenBalances from './components/TokenBalances';
import TransactionHistoryContainer from './components/TransactionHistoryContainer';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { toast } from 'sonner';
import { BalancesContext } from './context/BalancesContext';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useWalletClient: jest.fn(),
  usePublicClient: jest.fn(),
}));
jest.mock('sonner', () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
  },
}));

describe('WalletConnector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAccount.mockReturnValue({ isConnected: false });
  });

  it('shows Connect Wallet button', () => {
    render(<WalletConnector />);
    expect(screen.getByText(/connect wallet/i)).toBeInTheDocument();
  });

  it('calls toast.info on click', () => {
    render(<WalletConnector />);
    fireEvent.click(screen.getByText(/connect wallet/i));
    expect(toast.info).toHaveBeenCalled();
  });
});

describe('ConnectWalletPrompt', () => {
  it('shows prompt to connect wallet', () => {
    render(<ConnectWalletPrompt />);
    expect(screen.getAllByText(/connect your wallet/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/please connect your wallet/i)).toBeInTheDocument();
  });
});

describe('SendEth', () => {
  beforeEach(() => {
    useAccount.mockReturnValue({ address: '0x123', isConnected: true });
    useWalletClient.mockReturnValue({ data: null });
  });

  it('renders send form', () => {
    render(
      <BalancesContext.Provider value={{ nativeBalance: '1.0', tokenBalances: [], loading: false }}>
        <SendEth />
      </BalancesContext.Provider>
    );
    expect(screen.getAllByText(/send/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/recipient address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/amount/i)).toBeInTheDocument();
  });
});

describe('TokenBalances', () => {
  beforeEach(() => {
    useAccount.mockReturnValue({ address: '0x123', isConnected: false });
    usePublicClient.mockReturnValue({});
  });

  it('asks to connect wallet if not connected', () => {
    render(<TokenBalances onTokensFetched={() => {}} />);
    expect(screen.getByText(/please connect your wallet/i)).toBeInTheDocument();
  });
});

describe('TransactionHistoryContainer', () => {
  beforeEach(() => {
    useAccount.mockReturnValue({ address: '0x123' });
    useWalletClient.mockReturnValue({ data: { chain: { id: 1 } } });
  });

  it('shows transaction history title', () => {
    render(
      <BalancesContext.Provider value={{ nativeCurrency: { symbol: 'ETH', decimals: 18 } }}>
        <TransactionHistoryContainer />
      </BalancesContext.Provider>
    );
    expect(screen.getByText(/your recent transactions/i)).toBeInTheDocument();
  });
});