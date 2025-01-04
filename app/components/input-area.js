import { useState } from "react";

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
      // Detect transaction-related input
      const transactionMatch = input.match(/send\s(\d+(\.\d+)?)\s?kaia\s?to\s([a-zA-Z0-9]+)/i);

      const requestBody = {
        message: input,
        address: account,
      };

      if (transactionMatch) {
        // Extract transaction details
        const amount = parseFloat(transactionMatch[1]);
        const recipient = transactionMatch[3];

        // Add transaction data to the request body
        requestBody.transaction = {
          actionType: "SEND_TRANSACTION",
          recipient,
          amount,
        };
      }
      
      // Make API call
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // Update UI with the backend's response
      setMessagesWithTimestamp((prev) => [
        ...prev,
        { id: Date.now() - 1, role: "user", content: input, timestamp: new Date().toLocaleTimeString() },
        {
          id: Date.now(),
          role: "bot",
          content: data.response || "An error occurred.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessagesWithTimestamp((prev) => [
        ...prev,
        { id: Date.now() - 1, role: "user", content: input, timestamp: new Date().toLocaleTimeString() },
        {
          id: Date.now(),
          role: "bot",
          content: "An error occurred while processing your request.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center p-4 bg-gray-100 border-t">
      <input
        type="text"
        className="flex-1 px-4 py-2 border rounded-lg text-black focus:outline-none"
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
        {isSubmitting ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
