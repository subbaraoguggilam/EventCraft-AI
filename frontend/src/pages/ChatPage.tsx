import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Sparkles, Trash2, ArrowLeft, Bot, User, CornerDownLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ChatMessage, Event } from '../types'
import { chatApi, eventsApi, getErrorMessage } from '../services/api'
import Navbar from '../components/Layout/Navbar'
import Button from '../components/Common/Button'
import LoadingSpinner from '../components/Common/LoadingSpinner'

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    if (!id) return
    try {
      setIsLoadingHistory(true)
      const [ev, chatHistory] = await Promise.all([
        eventsApi.get(id),
        chatApi.getHistory(id).catch(() => []),
      ])
      setEvent(ev)
      setMessages(chatHistory)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage
    if (!text.trim() || !id || isSending) return

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      event_id: id,
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, tempUserMsg])
    setInputMessage('')
    setIsSending(true)

    try {
      const response = await chatApi.sendMessage(id, { message: text.trim() })
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        response.message,
        response.response,
      ])
    } catch (err) {
      toast.error(getErrorMessage(err))
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id))
    } finally {
      setIsSending(false)
    }
  }

  const handleClearHistory = async () => {
    if (!id) return
    try {
      await chatApi.clearHistory(id)
      setMessages([])
      toast.success('Chat history cleared')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const suggestedPrompts = [
    'How should I divide my budget across Mandap venue and Maharaj catering?',
    'Give me 3 unique entertainment & Sangeet ideas for 250 guests in Rajasthan.',
    'What key tasks must be completed 30 days before the wedding muhurat?',
    'Write a welcoming WhatsApp message and Lagan Patrika invite for my guests.',
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-1 flex flex-col h-[calc(100vh-4rem)]">
        {/* Chat Header */}
        <div className="bg-white rounded-t-2xl border border-b-0 border-gray-100 p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              to={`/events/${id}`}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Return to Event"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">
                  AI Planning Assistant
                </h1>
                <p className="text-[11px] text-gray-500">
                  {event ? `Context: ${event.title} (${event.event_type})` : 'Context Grounded'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-xs flex items-center gap-1 font-medium"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 bg-white border-x border-gray-100 p-4 sm:p-6 overflow-y-auto space-y-4">
          {isLoadingHistory ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="md" label="Loading assistant..." />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                How can I assist your celebration?
              </h2>
              <p className="text-xs text-gray-500 mt-1 mb-6">
                I know your event dates, guest count, venue, and budget. Ask for recommendations,
                schedules, or advice!
              </p>

              <div className="w-full space-y-2">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full p-2.5 text-left text-xs bg-gray-50 hover:bg-indigo-50/60 hover:text-indigo-700 rounded-xl border border-gray-100 text-gray-700 transition-colors flex items-center justify-between group"
                  >
                    <span>"{prompt}"</span>
                    <Sparkles className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant'
              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-xl rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        isAssistant ? 'text-gray-400' : 'text-indigo-200 text-right'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              )
            })
          )}

          {isSending && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>Gemini is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 p-4 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything about budgets, suppliers, timelines, or themes..."
              disabled={isSending}
              className="flex-1 rounded-xl border border-gray-300 text-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-50"
            />
            <Button
              type="submit"
              size="md"
              disabled={!inputMessage.trim() || isSending}
              isLoading={isSending}
              rightIcon={<CornerDownLeft className="w-4 h-4" />}
            >
              Send
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ChatPage
