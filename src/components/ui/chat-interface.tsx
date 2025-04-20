'use client';

import { Send, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error' | 'read';
  error?: string;
  retryCount?: number;
  isTyping?: boolean;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
      status: 'sending',
      retryCount: 0,
      personalInfo: { name: '', email: '' } // Initialize with default values
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-4), // Send last 4 messages for context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process chat message');
      }

      const data = await response.json();
      // Update user message status to sent
      setMessages((prev) =>
        prev.map((msg) =>
          msg === userMessage ? { ...msg, status: 'sent' } : msg,
        ),
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content:
          data.response || "I couldn't generate a response. Please try again.",
        timestamp: Date.now(),
        status: 'sent',
        isTyping: true,
      };
      
      // Simulate typing indicator
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg === assistantMessage 
              ? { ...msg, isTyping: false, status: 'read' } 
              : msg
          )
        );
      }, 1500);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Sorry, an unexpected error occurred';

      // Update user message status to error
      setMessages((prev) =>
        prev.map((msg) =>
          msg === userMessage
            ? {
                ...msg,
                status: 'error',
                error: errorMessage,
                retryCount: (msg.retryCount || 0) + 1,
              }
            : msg,
        ),
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
          timestamp: Date.now(),
          status: 'error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (lastInput: string) => {
    setInput(lastInput);
    await handleSubmit({ preventDefault: () => {} } as any);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none"
      >
        Chat
      </button>

      {/* Chat Interface */}
      {isChatOpen && (
        <div className="fixed bottom-16 right-4 w-full max-w-md bg-white border rounded-lg shadow-lg overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b bg-gray-50">
            <button
              onClick={clearHistory}
              className="text-gray-500 hover:text-red-500 focus:outline-none"
              title="Clear chat history"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <span className="font-medium">Chat Assistant</span>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col h-[600px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-300 ${message.status === 'sending' ? 'opacity-80' : 'opacity-100'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'} relative transition-all duration-300 ${message.isTyping ? 'animate-pulse' : ''}`}
                  >
                    <div className="absolute -bottom-4 right-0 text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                      {message.status === 'sending' && ' • Sending...'}
                      {message.status === 'error' && ' • Failed'}
                    </div>
                    {message.content.startsWith('[ERROR] ') ? (
                      <div className="space-y-2">
                        <div>{message.content.replace('[ERROR] ', '')}</div>
                        <button
                          onClick={() =>
                            handleRetry(
                              message.content.match(/Last input: (.*)/)?.[1] ||
                                '',
                            )
                          }
                          className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      <span>Generating response...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="border-t p-4">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                    maxLength={500}
                  />
                  <span className="absolute right-2 bottom-2 text-xs text-gray-400">
                    {input.length}/500
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
