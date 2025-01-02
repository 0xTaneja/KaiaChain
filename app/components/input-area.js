import { useState } from 'react';

export default function InputArea({
  input,
  handleInputChange,
  isLoading,
  account,
  setMessagesWithTimestamp,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !account) return;
  
    setIsSubmitting(true);
  
    try {
      const objectWithData = {
        message: input,
        address: account,
      };
  
      // First API call
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objectWithData),
      });
  
      const data = await response.json();
      const botMessage = {
        id: Date.now(),
        role: 'bot',
        content: data.response || 'No response received.',
        timestamp: new Date().toLocaleTimeString(),
      };
  
      // Append the bot's response to the messages
      setMessagesWithTimestamp((prev) => [
        ...prev,
        { id: Date.now() - 1, role: 'user', content: input, timestamp: new Date().toLocaleTimeString() },
        botMessage,
      ]);
  
      // Call the follow-up suggestions API if botMessage.content exists
      if (botMessage.content) {
        const followUpResponse = await fetch('/api/generatefollowups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastBotMessage: data.response,
          }),
        });
  
        const followUpData = await followUpResponse.json();
  
        if (followUpData.followUpMessages && followUpData.followUpMessages.length > 0) {
          const followUpMessages = followUpData.followUpMessages.map((msg) => ({
            id: Date.now() + Math.random(), // Unique ID
            role: 'follow-up',
            content: msg,
            timestamp: new Date().toLocaleTimeString(),
          }));
  
          // Append follow-up messages to the chat
          setMessagesWithTimestamp((prev) => [...prev, ...followUpMessages]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className="flex items-center p-4 bg-gray-100 border-t">
      <input
        type="text"
        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none"
        placeholder={account ? "Type a message..." : "Connect your wallet to start chatting."}
        value={input}
        onChange={handleInputChange}
        disabled={!account || isSubmitting}
      />
      <button
        type="submit"
        className="ml-4 px-4 py-2 text-white bg-blue-500 rounded-lg disabled:opacity-50"
        disabled={!input.trim() || isSubmitting || !account}
      >
        {isSubmitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
