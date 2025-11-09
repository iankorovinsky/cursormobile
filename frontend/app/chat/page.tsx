import ChatInterface from '../components/ChatInterface';

// Force dynamic rendering for this page since it uses useSearchParams
export const dynamic = 'force-dynamic';

export default function ChatPage() {
  return <ChatInterface />;
}
