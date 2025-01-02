'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/chat-area';
import Header from './components/header';
import InputArea from './components/input-area';
import NodeCache from 'node-cache';

const addressc = new NodeCache();
export default function Home() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const { messages, input, handleInputChange, isLoading } = useChat();
  const [account, setAccount] = useState(null);
  const [messagesWithTimestamp, setMessagesWithTimestamp] = useState([]);
  const [error, setError] = useState(null);

  // Function to get the current time in HH:mm format
  const getCurrentTime = () => {
    let myDate = new Date();
    let hours = myDate.getHours();
    let minutes = myDate.getMinutes();

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutes}`;
  };

  // Persist wallet connection across sessions
  useEffect(() => {
    const savedAccount = localStorage.getItem('connectedAccount');
    if (savedAccount) {
      setAccount(savedAccount);
    }
  }, []);

  // Handle wallet connection
  const connectWallet = async () => {
    if (typeof window.klaytn !== 'undefined') {
      try {
        await window.klaytn.enable();
        const accounts = window.klaytn.selectedAddress;
        setAccount(accounts);
        localStorage.setItem('connectedAccount', accounts)
        addressc.set("Address",accounts); // Persist account
      } catch (error) {
        setError('Error connecting wallet');
      }
    } else {
      setError('Install the Kaia wallet extension.');
    }
  };

  // Handle wallet disconnection
  const disconnectWallet = () => {
    if (account) {
      setAccount(null);
      localStorage.removeItem('connectedAccount'); // Clear persisted account
    }
  };

  // Validate wallet connection
  const validateWalletConnection = () => {
    if (!account) {
      setError('Please connect your wallet to continue.');
      return false;
    }
    return true;
  };

  // Update messages with timestamps
  useEffect(() => {
    setMessagesWithTimestamp((prevMessages) => {
      return messages.map((message, index) => {
        // If the message already exists in the previous state, use its timestamp
        const existingMessage = prevMessages.find((m) => m.id === message.id);
        return existingMessage || { ...message, timestamp: getCurrentTime() };
      });
    });
  }, [messages]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 text-red-800 p-2 rounded-md absolute top-0 left-0 w-full text-center">
          {error}
        </div>
      )}

      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      <main className="flex-1 flex flex-col">
        <Header
          account={account}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
        />

        <ChatArea account={account} messages={messagesWithTimestamp} />

        <InputArea
          input={input}
          handleInputChange={handleInputChange}
          isLoading={isLoading}
          account={account}
          validateWalletConnection={validateWalletConnection}
          setMessagesWithTimestamp={setMessagesWithTimestamp}
        />
      </main>
    </div>
  );
}
