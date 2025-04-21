'use client';

import copy from 'clipboard-copy';
import 'katex/dist/katex.min.css';
import { Copy, MoveHorizontal, Send, Trash2, X } from 'lucide-react';
import 'prismjs/themes/prism-tomorrow.css';
import { useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypePrism from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error' | 'read' | 'retry';
  isTyping?: boolean;
  error?: string;
  retryCount?: number;
  retryLimit?: number;
  personalInfo?: {
    name: string;
    email: string;
  };
}

// Helper function to update message status by timestamp
const updateMessageStatus =
  (timestamp: number, role: 'user' | 'assistant', updates: Partial<Message>) =>
  (prev: Message[]): Message[] => {
    return prev.map((msg) =>
      msg.timestamp === timestamp && msg.role === role
        ? { ...msg, ...updates }
        : msg,
    );
  };

// Helper function to remove a message by timestamp
const removeMessageByTimestamp =
  (timestamp: number) =>
  (prev: Message[]): Message[] => {
    return prev.filter((msg) => msg.timestamp !== timestamp);
  };

export function ChatInterface() {
  import { useReducer } from 'react';

  type ChatState = {
    messages: Message[];
    input: string;
    isLoading: boolean;
    isChatOpen: boolean;
    isCentered: boolean;
  };

  const initialState: ChatState = {
    messages: [],
    input: '',
    isLoading: false,
    isChatOpen: false,
    isCentered: false,
  };

  function chatReducer(
    state: ChatState,
    action: { type: string; payload?: any },
  ) {
    switch (action.type) {
      case 'SET_MESSAGES':
        return { ...state, messages: action.payload };
      case 'SET_INPUT':
        return { ...state, input: action.payload };
      case 'SET_LOADING':
        return { ...state, isLoading: action.payload };
      case 'TOGGLE_CHAT':
        return { ...state, isChatOpen: !state.isChatOpen };
      case 'TOGGLE_CENTERED':
        return { ...state, isCentered: !state.isCentered };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(chatReducer, initialState);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const RETRY_LIMIT = 3;
  const MESSAGES_PER_PAGE = 50;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Basic validation to ensure it's an array
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
        } else {
          console.warn('Invalid chat messages found in localStorage.');
          localStorage.removeItem('chatMessages');
        }
      } catch (error) {
        console.error(
          'Failed to parse chat messages from localStorage:',
          error,
        );
        localStorage.removeItem('chatMessages');
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    // Avoid saving initial empty state or during hydration mismatch potential
    if (messages.length > 0 || localStorage.getItem('chatMessages')) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent, messageContent?: string) => {
      if (e) e.preventDefault();
      const currentInput = messageContent || input;
      if (!currentInput.trim()) return;

      const userMessage: Message = {
        role: 'user',
        content: currentInput,
        timestamp: Date.now(),
        status: 'sending',
        retryCount: 0,
        retryLimit: RETRY_LIMIT,
      };

      setMessages((prev) => {
        const newMessages = [...prev, userMessage];
        if (newMessages.length > MESSAGES_PER_PAGE) {
          return newMessages.slice(-MESSAGES_PER_PAGE);
        }
        return newMessages;
      });

      if (!messageContent) setInput('');
      setIsLoading(true);
      setIsTyping(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            history: messages.slice(-4),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Server error (${response.status}): ${response.statusText}. Please try again.`,
          );
        }

        const data = await response.json();
        setMessages(
          updateMessageStatus(userMessage.timestamp, 'user', {
            status: 'sent',
          }),
        );

        const assistantMessage: Message = {
          role: 'assistant',
          content:
            data.response ||
            "I apologize, but I couldn't generate a response. Please try again.",
          timestamp: Date.now(),
          status: 'sent',
          isTyping: true,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setTimeout(() => {
          setMessages(
            updateMessageStatus(assistantMessage.timestamp, 'assistant', {
              isTyping: false,
              status: 'read',
            }),
          );
        }, 1000);
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';

        if (userMessage.retryCount && userMessage.retryCount >= RETRY_LIMIT) {
          setMessages(
            updateMessageStatus(userMessage.timestamp, 'user', {
              status: 'error',
              error: `${errorMessage}. Retry limit reached.`,
              retryCount: userMessage.retryCount,
            }),
          );
        } else {
          setMessages(
            updateMessageStatus(userMessage.timestamp, 'user', {
              status: 'retry',
              error: errorMessage,
              retryCount: (userMessage.retryCount || 0) + 1,
            }),
          );
        }
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    },
    [input, messages],
  );

  const handleRetry = useCallback(
    async (messageToRetry: Message) => {
      if (messageToRetry.status !== 'error' || !messageToRetry.content) return;

      // Remove the failed message before retrying using the helper function
      setMessages(removeMessageByTimestamp(messageToRetry.timestamp));

      // Resubmit the original content
      await handleSubmit(undefined, messageToRetry.content);
    },
    [handleSubmit], // Dependency for useCallback
  );

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Toggle chat"
      >
        {/* Consider adding a chat icon here */}
        Chat
      </button>

      {/* Chat Interface */}
      {isChatOpen && (
        <div
          className={`fixed ${isCentered ? 'left-1/2 transform -translate-x-1/2' : 'right-4'} bottom-20 w-full max-w-md bg-background border border-border rounded-lg shadow-lg overflow-hidden z-40 flex flex-col h-[70vh] max-h-[600px]`}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-border bg-muted/40">
            <button
              onClick={clearHistory}
              className="text-muted-foreground hover:text-destructive focus:outline-none p-1 rounded"
              title="Clear chat history"
              aria-label="Clear chat history"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <span className="font-medium text-foreground">Chat Assistant</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCentered(!isCentered)}
                className="text-muted-foreground hover:text-foreground focus:outline-none p-1 rounded"
                title="Toggle center position"
                aria-label="Toggle center position"
              >
                <MoveHorizontal className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-muted-foreground hover:text-foreground focus:outline-none p-1 rounded"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((message, index) => (
              <div
                key={message.timestamp + '-' + index} // Use timestamp and index for a more stable key
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 shadow-sm relative ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  } ${message.status === 'sending' ? 'opacity-70' : ''} ${
                    message.isTyping ? 'animate-pulse' : ''
                  }`}
                >
                  {/* Content */}
                  <div className="prose prose-sm max-w-none dark:prose-invert break-words relative group">
                    <button
                      onClick={() => copy(message.content)}
                      className="absolute right-0 top-0 p-1 text-muted-foreground/60 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy message"
                      aria-label="Copy message"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>

                  {/* Timestamp and Status */}
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user'
                        ? 'text-primary-foreground/80 text-right'
                        : 'text-muted-foreground text-left'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {message.status === 'sending' && ' • Sending...'}
                    {message.status === 'error' && ' • Failed'}
                    {/* Add 'read' status indicator if needed */}
                  </div>

                  {/* Error Handling & Retry */}
                  {message.status === 'error' && message.role === 'user' && (
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => handleRetry(message)}
                        disabled={isLoading}
                        className="text-xs px-2 py-1 bg-destructive/20 text-destructive-foreground rounded hover:bg-destructive/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Loading Indicator */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted text-foreground shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
                    <span className="text-sm">Generating...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border p-4 bg-background"
          >
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2 pr-16 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 min-h-[44px] max-h-[200px] resize-y"
                  disabled={isLoading}
                  aria-label="Chat message input"
                  rows={1}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// Custom renderer for code blocks to handle Mermaid diagrams
interface CodeBlockProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  node,
  inline,
  className,
  children,
}) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  if (language === 'mermaid') {
    return <pre className="mermaid">{String(children).trim()}</pre>;
  }

  return <code className={className}>{children}</code>;
};

const renderMessage = (content: string) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[rehypeKatex, [rehypePrism, { showLineNumbers: true }]]}
    components={{
      code: CodeBlock as any,
    }}
  >
    {content}
  </ReactMarkdown>
);
function setIsTyping(arg0: boolean) {
  throw new Error('Function not implemented.');
}
