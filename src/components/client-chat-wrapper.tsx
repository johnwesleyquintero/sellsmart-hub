'use client';

import dynamic from 'next/dynamic';

const ClientChatInterface = dynamic(
  () => import('@/components/ui/client-chat-interface'),
  { ssr: false },
);

export default function ClientChatWrapper() {
  return <ClientChatInterface />;
}
