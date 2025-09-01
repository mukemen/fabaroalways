import { ReactNode } from 'react'

export default function MessageBubble({ role, children }: { role: 'user' | 'assistant' | 'system', children: ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
        isUser ? 'bg-brand text-white rounded-br-md' : 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-zinc-700 rounded-bl-md'
      }`}>
        {children}
      </div>
    </div>
  )
}
