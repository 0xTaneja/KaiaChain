import { Link } from 'lucide-react'

export default function InputArea({
  input,
  handleInputChange,
  handleSubmit,
  isLoading
}) {
  return (
    <div className="p-4 border-t bg-white">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            className="w-full px-10 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  )
}

