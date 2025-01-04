import { useEffect, useRef, useState } from "react";

const suggestions = [
  {
    icon: "🎨",
    title: "Can You Please Help to check my balance of Kaia",
    color: "bg-blue-50"
  },
  {
    icon: "📊",
    title: "What is the Price of Bitcoin (BTC) Today",
    color: "bg-pink-50"
  },
  {
    icon: "✍️",
    title: "Send 50 Kaia to my Friend Address, His Address is ...",
    color: "bg-orange-50"
  }
];

export default function ChatArea({ account, messages }) {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const Message = ({ content, timestamp, role }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongContent = content.length > 300; // Threshold for long content

    return (
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {role === "user" ? "US" : "AI"}
          </span>
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-1 w-full max-w-[320px] md:max-w-[600px]">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-900">
              {role === "user" ? "You" : "RUSH"}
            </span>
            <span className="text-sm font-normal text-gray-400">{timestamp}</span>
          </div>
          <div
            className={`relative flex flex-col p-4 border border-gray-300 rounded-lg bg-gray-100 transition-all duration-300 ${
              isExpanded ? "max-h-full" : "max-h-40 overflow-hidden"
            }`}
          >
            <p className="text-sm font-normal text-gray-700">{content}</p>
            {isLongContent && !isExpanded && (
              <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-gray-100 via-gray-100"></div>
            )}
          </div>
          {isLongContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-500 underline self-start mt-1"
            >
              {isExpanded ? "Show Less" : "View Full"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex-1 overflow-auto p-4 bg-gray-50"
      ref={chatContainerRef}
      style={{ maxHeight: "80vh" }}
    >
      <div className="max-w-3xl mx-auto">
        {messages.length === 0 ? (
          <div className="text-center mt-20">
            <div className="w-16 h-16 bg-black rounded-full mx-auto mb-6 flex items-center justify-center">
              <img src="/kaialogo.png" alt="Logo" />
            </div>
            <h1 className="text-2xl mb-8 text-black">
              Hi, there 👋
              <br />
              How can we help?
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`${suggestion.color} p-4 rounded-lg cursor-pointer transition-all hover:shadow-md`}
                >
                  <div className="text-2xl mb-2">{suggestion.icon}</div>
                  <p className="text-sm text-gray-700">{suggestion.title}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((m) => (
              <Message
                key={m.id}
                content={m.content}
                timestamp={m.timestamp}
                role={m.role}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
