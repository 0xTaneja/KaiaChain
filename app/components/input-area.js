import { Link } from 'lucide-react';
import { useState } from 'react';

export default function InputArea({
  input,
  handleInputChange,
  isLoading,
  account,
  setMessagesWithTimestamp
}) {

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !account) return;
  
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, walletAddress: account }),
      });
  
      const data = await response.json();
      setMessagesWithTimestamp((prev) => [...prev, { sender: 'bot', ...data }]);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // const [Input,setInput] = useState();
  // const [messages, setMessages] = useState([]);
  // const [quoteData, setQuoteData] = useState(null);
  // const [submitting, setSubmitting] = useState(false);
  // const [livePrice, setLivePrice] = useState(null);
  // const [showSwapConfirmation, setShowSwapConfirmation] = useState(false);
  // const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  // const [isTyping, setIsTyping] = useState(false);
  // const [isDarkMode, setIsDarkMode] = useState(false);
  // const [isTransactionPending, setIsTransactionPending] = useState(false);
  // const [selectableMessages, setSelectableMessages] = useState([]);
  // const [showAirdropAnimation, setShowAirdropAnimation] = useState(false);
  
  //  const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!input.trim() || !account) return;
  //   console.log(account);
  //   setSubmitting(true);
  //   setIsTyping(true);
  //   setSelectableMessages([]);
  //   const userMessage = { sender: 'user', content: input };
  //   setMessages((prev) => [...prev, userMessage]);
  //   setInput('');

  //   try {
  //     const response = await fetch('/api', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         message: input,
  //         walletAddress: account,
  //       }),
  //     });

  //     if (!response.ok) throw new Error('API response was not ok');

  //     const data = await response.json();
  //     console.log('full', data);

  //     console.log('flag', data.transactionDetails?.showSwapConfirmation);

  //     if (data.network) {
  //       onNetworkChange(data.network);
  //     }
  //     setShowSwapConfirmation(data.showSwapConfirmation || false);
  //     console.log('Quote Data from API:', data.quoteData);

  //     if (data.quoteData) {
  //       setQuoteData(data.quoteData);
  //       console.log('Quote Data from API:', data.quoteData);
  //       setShowSwapConfirmation(true);
  //     }
    
  //     const botMessage = {
  //       sender: 'bot',
  //       content: data.response,
  //       priceData: data.priceData,
  //     };
  //     setMessages((prev) => [...prev, botMessage]);
  //     setIsTyping(false);

  //     if (data.priceData) {
  //       setLivePrice(data.priceData);
  //       setIsLiveUpdating(true);
  //     }

  //     setShowSwapConfirmation(data.showSwapConfirmation || false);

  //     if (data.transactionDetails) {
  //       handleTransaction(data.transactionDetails);
  //     }

  //     const followUpResponse = await fetch('/api/generatefollowups', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         lastBotMessage: data.response,
  //       }),
  //     });

  //     const followUpData = await followUpResponse.json();

  //     if (followUpData.followUpMessages) {
  //       setSelectableMessages(followUpData.followUpMessages);
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //     const errorMessage = {
  //       sender: 'bot',
  //       content: `Error: ${(error).message}`,
  //     };
  //     setMessages((prev) => [...prev, errorMessage]);
  //     setIsTyping(false);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  return (
    <div className="p-4 border-t bg-white">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            className="w-full px-10 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" // Added text-black here
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 p-1 hover:bg-gray-100 rounded"
          >
            <Link className="w-4 h-4" />
          </button>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {input.length}/2000
          </div>
        </form>
        <p className="text-xs text-center mt-2 text-gray-500">
          AI may display inaccurate info, so please double check the response.{' '}
          <a href="#" className="underline">Your Privacy & AI</a>
        </p>
      </div>
    </div>
  );
}
