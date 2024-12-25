'use client'

import { useState } from 'react'
import { useChat } from 'ai/react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/chat-area'
import Header from './components/header'
import InputArea from './components/input-area'

export default function Home() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} 
      />
      <main className="flex-1 flex flex-col">
        <Header />
        <ChatArea messages={messages} />
        <InputArea
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </main>
    </div>
  )
}

