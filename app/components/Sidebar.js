import { Menu, MessageCircle, Grid, FileText, Settings } from 'lucide-react'

export default function Sidebar({ isExpanded, onToggle }) {
  const navItems = [
    { icon: MessageCircle, label: 'Chat' },
    { icon: Grid, label: 'Dashboard' },
    { icon: FileText, label: 'Documents' },
    { icon: Settings, label: 'Settings' },
  ]

  return (
    <div className={`
      bg-black border-r transition-all duration-300 flex flex-col
      ${isExpanded ? 'w-64' : 'w-16'}
    `}>
      <div className="p-4 flex items-center gap-4">
        <button 
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {isExpanded && (
          <span className="font-semibold">Navigation</span>
        )}
      </div>

      <nav className="flex flex-col gap-2 p-2">
        {navItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={index}
              className={`
                flex items-center gap-4 p-2 hover:bg-gray-100 rounded-lg transition-colors
                ${isExpanded ? 'justify-start' : 'justify-center'}
              `}
            >
              <Icon className="w-5 h-5" />
              {isExpanded && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

