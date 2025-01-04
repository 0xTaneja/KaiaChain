import { useEffect, useRef } from "react";

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

  return (
    <div
      className="flex-1 overflow-auto p-4"
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
              <div key={m.id} className="flex items-start gap-2.5">
                {/* Avatar */}
                <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {m.role === "user" ? "US" : "AI"}
                  </span>
                </div>

                {/* Message Content */}
                <div className="flex flex-col gap-1 w-full max-w-[320px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {m.role === "user" ? "You" : "RUSH"}
                    </span>
                    <span className="text-sm font-normal text-gray-400">
                      {m.timestamp}
                    </span>
                  </div>
                  <div className="flex flex-col leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl">
                    <p className="text-sm font-normal text-gray-700">
                      {m.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
