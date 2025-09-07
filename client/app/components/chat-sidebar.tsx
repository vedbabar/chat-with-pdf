'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, Loader2 } from 'lucide-react'; // Add this import

// Define the shape of a chat object
interface Chat {
  id: string;
  name: string;
}

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  loadingChatId?: string | null; // <-- add this
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ chats, activeChatId, loadingChatId, onSelectChat, onNewChat }) => {
  return (
    <div className="h-full bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200">Conversations</h2>
        <Button size="sm" onClick={onNewChat} className="h-8">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {chats.length > 0 ? (
          <div className="space-y-2">
            {chats.map((chat) => {
              const isActive = activeChatId === chat.id;
              const isLoading = loadingChatId === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  disabled={isLoading}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  } ${isLoading ? 'opacity-60 cursor-wait' : ''}`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="flex-1 truncate">{chat.name}</span>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-4 text-sm text-slate-500">
            No chats yet. Create one to start!
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;