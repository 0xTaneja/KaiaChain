import { useState } from 'react';

export default function Header() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (typeof window.klaytn !== 'undefined') {
      try {
        // Request account access
        await window.klaytn.enable();
        const accounts = window.klaytn.selectedAddress;
        setAccount(accounts);
        console.log('Connected account:', accounts);
      } catch (error) {
        console.log('Error connecting wallet:', error);
      }
    } else {
    
      alert('Kaia wallet is not installed. Please install the Kaia wallet extension to connect.');
    }
  };

  const disconnectWallet = () => {
    if (account) {
      console.log('Disconnected account:', account);
      setAccount(null);
    }
  };

  return (
    <header className="h-16 border-b bg-black flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <span className="text-white text-xl">⚡</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {account ? (
          <>
            <span className="text-white">Connected: {account}</span>
            <button
              onClick={disconnectWallet}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md transition-colors"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
