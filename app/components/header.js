

export default function Header() {
  
   


    return (
      <header className="h-16 border-b bg-black flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">⚡</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md transition-colors">
           Connect Wallet
          </button>
        </div>
      </header>
    )
  }
  
  