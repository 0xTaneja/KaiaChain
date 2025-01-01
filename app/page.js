'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/chat-area';
import Header from './components/header';
import InputArea from './components/input-area';

export default function Home() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const { messages, input, handleInputChange, isLoading } = useChat();
  const [account, setAccount] = useState(null);
  // Function to get the current time in HH:mm format
  const getCurrentTime = () => {
    let myDate = new Date();
    let hours = myDate.getHours();
    let minutes = myDate.getMinutes();

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutes}`;
  };
  const [messagesWithTimestamp, setMessagesWithTimestamp] = useState([]);
const [error, setError] = useState(null);

const connectWallet = async () => {
  if (typeof window.klaytn !== 'undefined') {
    try {
      await window.klaytn.enable();
      const accounts = window.klaytn.selectedAddress;
      setAccount(accounts);
    } catch (error) {
      setError('Error connecting wallet');
    }
  } else {
    alert('Install the Kaia wallet extension.');
  }
};

  
  const disconnectWallet = () => {
    if (account) {
      console.log('Disconnected account:', account);
      setAccount(null);
    }
  };
  // Add timestamps only to messages that don't have one
 
 
  




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
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />
      <main className="flex-1 flex flex-col">
        <Header account={account} connectWallet={connectWallet} disconnectWallet={disconnectWallet}/>
        <ChatArea account={account} messages={messagesWithTimestamp} />
        <InputArea
          input={input}
          handleInputChange={handleInputChange}
          isLoading={isLoading}
          account={account}
          setMessagesWithTimestamp={setMessagesWithTimestamp}
        />
      </main>
    </div>
  );
}
