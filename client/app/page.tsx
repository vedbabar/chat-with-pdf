'use client';

import { UserButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatComponent from './components/chat';
import FileUploadComponent from './components/file-upload';
import { Menu, Plus, MessageCircle, FileText, Edit2, Check, X, Loader2, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ⭐ DEFINE API URL BASED ON ENVIRONMENT
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://chat-with-pdf-readme-generator.vercel.app' 
  : 'http://localhost:8000';

// The main data structure for a single chat session
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

export default function Dashboard() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState('');
  const [filePanelOpen, setFilePanelOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentChat = chats.find(chat => chat.id === selectedChatId);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(systemPrefersDark);
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Function to load all chats for the logged-in user
  const loadChats = useCallback(async (selectFirst = false) => {
    try {
      const token = await getToken();
      if (!token) {
          setLoading(false);
          return;
      }
      // ⭐ UPDATED URL
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
    } finally {
      setLoading(false);
    }
  }, [getToken, searchParams, router]);

  useEffect(() => {
    loadChats(true); // On initial load, select the first chat
  }, [loadChats]);

  // Function to create a new chat and automatically select it
  const createNewChat = async () => {
    try {
      const token = await getToken();
      // ⭐ UPDATED URL
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
        await loadChats(); // Reload all chats to get the new one in the list
        setSelectedChatId(newChat.id);
        router.push(`/?chatId=${newChat.id}`);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  // ✅ FIX: This function now handles the state change cleanly before navigation
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    router.push(`/?chatId=${chatId}`);
  };

  const handleChatDelete = async () => {
    setLoading(true);
    setSelectedChatId(null);
    router.push('/');
    await loadChats(true); // Reload chats and select the new first one
  };

  const startEditingChat = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingChatName(chat.name);
  };

  const saveEditingChat = async () => {
    if (!editingChatId || !editingChatName.trim()) return;
    try {
      const token = await getToken();
      // ⭐ UPDATED URL
      const response = await fetch(`${API_BASE_URL}/chats/${editingChatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingChatName.trim() }),
      });
      if (response.ok) {
        const updatedChat = await response.json();
        setChats(prev => prev.map(chat => 
          chat.id === editingChatId ? { ...chat, name: updatedChat.name } : chat
        ));
      }
    } catch (error) {
      console.error('Failed to update chat:', error);
    } finally {
      setEditingChatId(null);
      setEditingChatName('');
    }
  };
  
  const cancelEditingChat = () => {
    setEditingChatId(null);
    setEditingChatName('');
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (loading && chats.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-100 dark:bg-slate-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-slate-800 dark:text-slate-200">Chat-with-PDF</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-8 w-8 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <Button onClick={createNewChat} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div key={chat.id} className={`m-2 rounded-lg border group ${selectedChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent'}`}>
              <div onClick={() => handleSelectChat(chat.id)} className="p-3 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  {editingChatId === chat.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input value={editingChatName} onChange={(e) => setEditingChatName(e.target.value)} className="h-7 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') saveEditingChat(); if (e.key === 'Escape') cancelEditingChat(); }} onClick={(e) => e.stopPropagation()} autoFocus />
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); saveEditingChat(); }} className="h-6 w-6"><Check className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); cancelEditingChat(); }} className="h-6 w-6"><X className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">{chat.name}</p>
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); startEditingChat(chat); }} className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"><Edit2 className="h-3 w-3" /></Button>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{formatDate(chat.createdAt)}</span>
                  {chat.files && chat.files.length > 0 && <div className="flex items-center gap-1"><FileText className="h-3 w-3" /><span className="font-medium">{chat.files.length}</span></div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area + Right Panel */}
      <div className="flex-1 flex flex-row">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu className="h-4 w-4" /></Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFilePanelOpen(!filePanelOpen)}
                className="h-8 w-8 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                aria-label={filePanelOpen ? "Hide file panel" : "Show file panel"}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-8 w-8 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          {selectedChatId ? (
            <ChatComponent 
              key={selectedChatId} // ✅ FIX: Add a key to force re-mounting
              chatId={selectedChatId}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Welcome to DocuChat</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Create a new chat to get started.</p>
              </div>
            </div>
          )}
        </div>
        {/* Collapsible File Upload Panel */}
        <div className={`relative transition-all duration-300 ${filePanelOpen ? 'w-[350px] min-w-[300px]' : 'w-6 min-w-0'} bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col`}>
          {/* Collapse/Expand Button */}
          <button
            className="absolute -left-3 top-1/2 z-10 transform -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full shadow p-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            onClick={() => setFilePanelOpen(open => !open)}
            aria-label={filePanelOpen ? "Collapse file panel" : "Expand file panel"}
            tabIndex={0}
          >
            {filePanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          {filePanelOpen && (
            <FileUploadComponent
              chatId={selectedChatId}
              onChatDelete={handleChatDelete}
              onFileUploadSuccess={() => loadChats(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}