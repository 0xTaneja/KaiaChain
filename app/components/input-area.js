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
    const accaddress = window.klaytn.selectedAddress;
    console.log(accaddress);
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, address:accaddress }),
      });

      const data = await response.json();
      const botMessage = {
        id: Date.now(),
        role: 'bot',
        content: data.response || 'No response received.',
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessagesWithTimestamp((prev) => [
        ...prev,
        { id: Date.now() - 1, role: 'user', content: input, timestamp: new Date().toLocaleTimeString() },
        botMessage,
      ]);
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
