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

export default function ChatArea({ messages }) {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-3xl mx-auto">
        {messages.length === 0 ? (
          <div className="text-center mt-20">
            <div className="w-16 h-16 bg-black rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-black text-2xl">⚡</span>
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
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${m.role === "user" ? "justify-start" : "justify-start"}`}
              >
                {m.role === "user" && (
                  <img
                    className="w-8 h-8 rounded-full"
                    src="/docs/images/people/profile-picture-3.jpg"
                    alt="Your Profile"
                  />
                )}
                <div className="flex flex-col gap-1 w-full max-w-[320px]">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {m.role === "user" ? "You" : "Bonnie Green"}
                    </span>
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">11:46</span>
                  </div>
                  <div className="flex flex-col leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700">
                    <p className="text-sm font-normal text-gray-900 dark:text-white">
                      {m.content}
                    </p>
                  </div>
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">Delivered</span>
                </div>
                {m.role !== "user" && (
                  <img
                    className="w-8 h-8 rounded-full"
                    src="/docs/images/people/profile-picture-3.jpg"
                    alt="Profile"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
