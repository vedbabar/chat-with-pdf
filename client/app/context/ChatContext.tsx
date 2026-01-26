'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface File {
  id: string;
  filename: string;
  path: string;
  publicId: string;
  status: 'PROCESSING' | 'DONE' | 'ERROR';
  createdAt: string;
}

interface Chat {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messages?: any[];
  files?: File[];
}

interface ChatContextType {
  chats: Chat[];
  selectedChatId: string | null;
  loading: boolean;
  createChat: () => Promise<void>;
  selectChat: (chatId: string) => void;
  deleteChat: () => Promise<void>;
  updateChatName: (name: string) => Promise<void>;
  refreshChats: (selectFirst?: boolean) => Promise<void>;
  editingChatId: string | null;
  setEditingChatId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://chat-with-pdf-back.vercel.app' 
  : 'http://localhost:8000';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);

  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load Chats
  const refreshChats = useCallback(async (selectFirst = false) => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const chatsData = await response.json();
        setChats(chatsData);

        const chatIdFromUrl = searchParams.get('chatId');
        if (chatIdFromUrl && chatsData.some((c: Chat) => c.id === chatIdFromUrl)) {
            setSelectedChatId(chatIdFromUrl);
        } else if (selectFirst && chatsData.length > 0) {
            const firstChatId = chatsData[0].id;
            setSelectedChatId(firstChatId);
            router.replace(`/?chatId=${firstChatId}`);
        }
      } 
    } catch (error) {
      console.error('Failed to load chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [getToken, searchParams, router]);

  // Initial Load
  useEffect(() => {
    refreshChats(true);
  }, [refreshChats]);

  // Create Chat
  const createChat = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: `New Chat` }),
      });
      if (response.ok) {
        const newChat = await response.json();
        await refreshChats();
        setSelectedChatId(newChat.id);
        router.push(`/?chatId=${newChat.id}`);
        toast.success('Chat created!');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to create chat');
    }
  };

  // Select Chat
  const selectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    router.push(`/?chatId=${chatId}`);
  };

  // Delete Chat
  const deleteChat = async () => {
    if (!selectedChatId) return;
    try {
        const token = await getToken();
        await fetch(`${API_BASE_URL}/chats/${selectedChatId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setSelectedChatId(null);
        router.push('/');
        await refreshChats(true);
        toast.success('Chat deleted');
    } catch (error) {
        console.error('Delete failed', error);
        toast.error('Failed to delete chat');
    }
  };

  // Update Name
  const updateChatName = async (name: string) => {
    if (!editingChatId || !name.trim()) return;
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/chats/${editingChatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (response.ok) {
        const updatedChat = await response.json();
        setChats(prev => prev.map(chat => 
          chat.id === editingChatId ? { ...chat, name: updatedChat.name } : chat
        ));
        toast.success('Chat renamed');
      }
    } catch (error) {
      console.error('Failed to update chat:', error);
      toast.error('Failed to rename chat');
    } finally {
      setEditingChatId(null);
    }
  };

  return (
    <ChatContext.Provider value={{
      chats,
      selectedChatId,
      loading,
      createChat,
      selectChat,
      deleteChat,
      updateChatName,
      refreshChats,
      editingChatId,
      setEditingChatId
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
