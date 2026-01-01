'use client';

import { UserButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatComponent from './components/chat';
import FileUploadComponent from './components/file-upload';
import { Menu, Plus, MessageCircle, FileText, Edit2, Check, X, Loader2, ChevronLeft, ChevronRight, Sun, Moon, BookOpen, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://chat-with-pdf-back.vercel.app' 
  : 'http://localhost:8000';

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

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(systemPrefersDark);
    }
  }, []);

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

  const loadChats = useCallback(async (selectFirst = false) => {
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
    } finally {
      setLoading(false);
    }
  }, [getToken, searchParams, router]);

  useEffect(() => {
    loadChats(true);
  }, [loadChats]);

  const createNewChat = async () => {
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
        await loadChats();
        setSelectedChatId(newChat.id);
        router.push(`/?chatId=${newChat.id}`);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    router.push(`/?chatId=${chatId}`);
  };

  const handleChatDelete = async () => {
    setLoading(true);
    setSelectedChatId(null);
    router.push('/');
    await loadChats(true);
  };

  const startEditingChat = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingChatName(chat.name);
  };

  const saveEditingChat = async () => {
    if (!editingChatId || !editingChatName.trim()) return;
    try {
      const token = await getToken();
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
      <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="relative">
          <div className="relative bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <Loader2 className="h-12 w-12 text-slate-900 dark:text-white animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Enhanced Left Sidebar with Custom Scrollbar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-lg relative`}>
        {/* Sidebar Content */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-900 dark:bg-white">
                <BookOpen className="h-5 w-5 text-white dark:text-slate-900" />
              </div>
              <h1 className="font-bold text-lg text-slate-900 dark:text-white">
                Chat-with-PDF
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="h-4 w-4 text-slate-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <button 
            onClick={createNewChat} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => handleSelectChat(chat.id)} 
              className={`group m-2 p-4 rounded-lg cursor-pointer transition-all ${
                selectedChatId === chat.id
                  ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {editingChatId === chat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input 
                      value={editingChatName} 
                      onChange={(e) => setEditingChatName(e.target.value)} 
                      className="flex-1 h-8 text-sm bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg" 
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter') saveEditingChat(); 
                        if (e.key === 'Escape') cancelEditingChat(); 
                      }} 
                      onClick={(e) => e.stopPropagation()} 
                      autoFocus 
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); saveEditingChat(); }}
                      className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition"
                    >
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelEditingChat(); }}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-slate-900 dark:text-white truncate flex-1">{chat.name}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditingChat(chat); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{formatDate(chat.createdAt)}</span>
                {chat.files && chat.files.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md">
                    <FileText className="h-3 w-3" />
                    <span className="font-semibold">{chat.files.length}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Left Collapse Button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute -right-3 top-1/2 z-20 transform -translate-y-1/2 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-full shadow-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Left Expand Button - Visible when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-1/2 z-20 transform -translate-y-1/2 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-full shadow-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition animate-fade-in"
          aria-label="Expand sidebar"
        >
          <PanelLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </button>
      )}

      {/* Main Content Area + Right Panel */}
      <div className="flex-1 flex flex-row">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFilePanelOpen(!filePanelOpen)}
                className="h-8 w-8 text-slate-600 dark:text-slate-400 rounded-lg"
                aria-label={filePanelOpen ? "Hide file panel" : "Show file panel"}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="h-4 w-4 text-slate-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          
          {selectedChatId ? (
            <ChatComponent 
              key={selectedChatId}
              chatId={selectedChatId}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center bg-white dark:bg-slate-950">
              <div>
                <div className="relative mb-6 w-fit mx-auto">
                  <div className="relative bg-slate-100 dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
                    <MessageCircle className="h-20 w-20 text-slate-900 dark:text-white mx-auto" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                  Welcome to Chat-with-PDF
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Create a new chat to get started.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Right File Upload Panel - Now Collapsible */}
        <div className={`relative transition-all duration-300 ${filePanelOpen ? 'w-[350px] min-w-[300px]' : 'w-0 min-w-0'} bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-lg overflow-hidden`}>
          {/* Right Panel Toggle Button */}
          <button
            className="absolute -left-3 top-1/2 z-10 transform -translate-y-1/2 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-full shadow-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            onClick={() => setFilePanelOpen(open => !open)}
            aria-label={filePanelOpen ? "Collapse file panel" : "Expand file panel"}
          >
            {filePanelOpen ? <PanelRightClose className="h-4 w-4 text-slate-600 dark:text-slate-400" /> : <PanelRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
          </button>
          {filePanelOpen && (
            <FileUploadComponent
              chatId={selectedChatId}
              onChatDelete={handleChatDelete}
              onFileUploadSuccess={() => loadChats(false)}
            />
          )}
        </div>

        {/* Right Expand Button - Visible when file panel is closed */}
        {!filePanelOpen && (
          <button
            onClick={() => setFilePanelOpen(true)}
            className="fixed right-4 top-1/2 z-20 transform -translate-y-1/2 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-full shadow-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition animate-fade-in"
            aria-label="Expand file panel"
          >
            <PanelRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
}
