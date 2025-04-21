'use client';

import 'katex/dist/katex.min.css';
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
  return <div>Message Content</div>; // Placeholder implementation
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

  const [{ messages, input }, dispatch] = useReducer(chatReducer, initialState);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const RETRY_LIMIT = 3;

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

  const clearHistory = useCallback(() => {
    dispatch({ type: 'SET_MESSAGES', payload: [] });
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

      dispatch({ type: 'SET_MESSAGES', payload: [...messages, userMessage] });
      if (!messageContent) dispatch({ type: 'SET_INPUT', payload: '' });
      dispatch({ type: 'SET_LOADING', payload: true });

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
        dispatch({
          type: 'SET_MESSAGES',
          payload: messages.map((msg) =>
            msg.timestamp === userMessage.timestamp
              ? { ...msg, status: 'sent' }
              : msg,
          ),
        });

        const assistantMessage: Message = {
          role: 'assistant',
          content:
            data.response ||
            "I apologize, but I couldn't generate a response. Please try again.",
          timestamp: Date.now(),
          status: 'sent',
          isTyping: true,
        };

        dispatch({
          type: 'SET_MESSAGES',
          payload: [...messages, assistantMessage],
        });
      } catch (error) {
        console.error('Chat submission error:', error);
        dispatch({
          type: 'SET_MESSAGES',
          payload: messages.map((msg) =>
            msg.timestamp === userMessage.timestamp
              ? {
                  ...msg,
                  status: 'error',
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                }
              : msg,
          ),
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [input, messages],
  );

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col">
      {/* Chat interface implementation */}
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
function setIsTyping(arg0: boolean) {
  throw new Error('Function not implemented.');
}
