'use client';

import dynamic from 'next/dynamic';

const ChatInterface = dynamic(
  () => import('@/components/ui/chat-interface').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div>Loading...</div>,
  },
);

export default function ClientChatInterface() {
  return <ChatInterface />;
}
