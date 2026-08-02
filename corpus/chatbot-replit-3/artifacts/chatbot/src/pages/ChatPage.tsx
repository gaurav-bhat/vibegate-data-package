import { useState, useEffect } from 'react';
import { useListSessions } from '@workspace/api-client-react';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatPanel } from '@/components/ChatPanel';

export default function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const { data: sessions = [] } = useListSessions();

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  return (
    <div className="flex h-[100dvh] w-full">
      <ChatSidebar 
        activeSessionId={activeSessionId} 
        onSelectSession={setActiveSessionId} 
      />
      <div className="flex-1">
        <ChatPanel sessionId={activeSessionId} />
      </div>
    </div>
  );
}
