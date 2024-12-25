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
  ]
  
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
            <div className="space-y-6">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-xl rounded-lg p-4
                    ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}
                  `}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  