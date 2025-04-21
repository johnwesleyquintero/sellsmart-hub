'use client';

import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism-tomorrow.css';
import { useEffect, useRef } from 'react';
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

interface MessageBubbleProps {
  message: Message;
  onRetry?: (message: Message) => void;
  onDelete?: (timestamp: number) => void;
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

import { useReducer } from 'react';

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRetry,
  onDelete,
}) => {
  const isUser = message.role === 'user';
  const hasError = message.status === 'error';
  const canRetry =
    hasError && (message.retryCount || 0) < (message.retryLimit || 3);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-4 ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} ${hasError ? 'border-red-500 border-2' : ''}`}
      >
        {renderMessage(message.content)}
        {message.error && (
          <div className="text-red-500 text-sm mt-2">{message.error}</div>
        )}
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          <div className="flex gap-2">
            {canRetry && onRetry && (
              <button
                onClick={() => onRetry(message)}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Retry
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(message.timestamp)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function ChatInterface() {
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
  ): ChatState {
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

  const [{ messages, input, isLoading }, dispatch] = useReducer(
    chatReducer,
    initialState,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Optimize useEffect dependencies
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]); // Only trigger on array length changes

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Basic validation to ensure it's an array
        if (Array.isArray(parsedMessages)) {
          dispatch({ type: 'SET_MESSAGES', payload: parsedMessages });
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

  // Message handling functions
  const handleMessageSubmit = async (messageOrContent: Message | string) => {
    const content =
      typeof messageOrContent === 'string'
        ? messageOrContent
        : messageOrContent.content;
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      status: 'sending',
    };

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_MESSAGES', payload: [...messages, userMessage] });
      dispatch({ type: 'SET_INPUT', payload: '' });

      // Simulate API call - replace with actual API integration
      const response = await new Promise<string>((resolve) =>
        setTimeout(() => resolve('This is a mock response.'), 1000),
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        status: 'sent',
      };

      dispatch({
        type: 'SET_MESSAGES',
        payload: [...messages, userMessage, assistantMessage],
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch({
        type: 'SET_MESSAGES',
        payload: messages.map((msg) =>
          msg.timestamp === userMessage.timestamp
            ? {
                ...msg,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              }
            : msg,
        ),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col w-96 max-h-[80vh] bg-white shadow-lg rounded-t-lg">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.timestamp}
            message={msg}
            onRetry={handleMessageSubmit}
            onDelete={(timestamp) =>
              dispatch({
                type: 'SET_MESSAGES',
                payload: messages.filter((m) => m.timestamp !== timestamp),
              })
            }
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleMessageSubmit(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) =>
              dispatch({ type: 'SET_INPUT', payload: e.target.value })
            }
            placeholder="Type your message..."
            className="flex-1 rounded-lg border p-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
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
