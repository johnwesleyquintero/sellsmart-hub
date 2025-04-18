import { ChatInterface } from '@/components/ui/chat-interface';

export default function ChatPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">AI Chat Assistant</h1>
      <ChatInterface />
    </div>
  );
}