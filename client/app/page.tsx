'use client';

import { UserButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatComponent from './components/chat';
import FileUploadComponent from './components/file-upload';
import { Menu, Plus, MessageCircle, Edit2, Check, X, Loader2, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardSkeleton } from './components/skeletons';

interface Chat {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messages?: any[];
  files?: any[];
}

export default function Dashboard() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filesPanelOpen, setFilesPanelOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [switchingChat, setSwitchingChat] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dark mode effect
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  
  const currentChat = chats.find(chat => chat.id === selectedChatId);

  const loadChats = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
          setLoading(false);
          return;
      }
      const response = await fetch('http://localhost:8000/chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const chatsData = await response.json();
        setChats(chatsData);

        const chatIdFromUrl = searchParams.get('chatId');
        if (chatIdFromUrl && chatsData.some((c: Chat) => c.id === chatIdFromUrl)) {
            setSelectedChatId(chatIdFromUrl);
        } else if (chatsData.length > 0 && !selectedChatId) {
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
  }, [getToken, searchParams, router, selectedChatId]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const createNewChat = async () => {
    try {
      const token = await getToken();
      const response = await fetch('http://localhost:8000/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: `New Chat` }),
      });
      if (response.ok) {
        const newChat = await response.json();
        setChats(prev => [newChat, ...prev]);
        
        setSwitchingChat(true);
        setSelectedChatId(newChat.id);
        router.push(`/?chatId=${newChat.id}`);
        
        setTimeout(() => setSwitchingChat(false), 500);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleChatSelection = (chatId: string) => {
    if (chatId === selectedChatId || switchingChat) return;
    
    setSwitchingChat(true);
    setSelectedChatId(chatId);
    router.push(`/?chatId=${chatId}`);
    
    setTimeout(() => setSwitchingChat(false), 400);
  };

  const handleChatDelete = async () => {
    setLoading(true);
    setSelectedChatId(null);
    router.push('/');
    await loadChats();
  };

  const startEditingChat = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingChatName(chat.name);
  };

  const saveEditingChat = async () => {
    if (!editingChatId || !editingChatName.trim()) return;
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:8000/chats/${editingChatId}`, {
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="h-screen flex bg-slate-100 dark:bg-slate-900 transition-colors duration-200">
      {/* Main Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-14'} transition-all duration-300 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col relative`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'opacity-0'} transition-opacity duration-200`}>
            <h1 className="font-semibold text-slate-800 dark:text-slate-200">Chat-with-PDF</h1>
          </div>
          <div className="flex items-center gap-2">
            {sidebarOpen && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <UserButton afterSignOutUrl="/" />
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 p-0"
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {sidebarOpen && (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <Button onClick={createNewChat} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> New Chat
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => (
                <div key={chat.id} className={`m-2 rounded-lg border group transition-all duration-200 ${
                  selectedChatId === chat.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 scale-[1.02]' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent hover:scale-[1.01]'
                } ${switchingChat && selectedChatId === chat.id ? 'animate-pulse' : ''}`}>
                  <div 
                    onClick={() => handleChatSelection(chat.id)} 
                    className="p-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      {editingChatId === chat.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input 
                            value={editingChatName} 
                            onChange={(e) => setEditingChatName(e.target.value)} 
                            className="h-7 text-sm" 
                            onKeyDown={(e) => { 
                              if (e.key === 'Enter') saveEditingChat(); 
                              if (e.key === 'Escape') cancelEditingChat(); 
                            }} 
                            onClick={(e) => e.stopPropagation()} 
                            autoFocus 
                          />
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); saveEditingChat(); }} className="h-6 w-6">
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); cancelEditingChat(); }} className="h-6 w-6">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">{chat.name}</p>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={(e) => { e.stopPropagation(); startEditingChat(chat); }} 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatDate(chat.createdAt)}</span>
                      {chat.files && chat.files.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{chat.files.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {!sidebarOpen && (
          <div className="flex flex-col items-center py-4 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="h-8 w-8 p-0"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          
          {selectedChatId ? (
            <ChatComponent 
              chatId={selectedChatId}
              isLoading={switchingChat}
              key={selectedChatId}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="animate-fade-in">
                <MessageCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Welcome to DocuChat</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Create a new chat to get started.</p>
              </div>
            </div>
          )}
        </div>

        {/* Files Panel */}
        <div className={`${filesPanelOpen ? 'w-80' : 'w-12'} transition-all duration-300 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 relative`}>
          <div className="absolute top-4 left-2 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilesPanelOpen(!filesPanelOpen)}
              className="h-8 w-8 p-0 bg-white dark:bg-slate-800 shadow-sm border"
            >
              {filesPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          
          {filesPanelOpen && (
            <div className="pt-16 h-full">
              <FileUploadComponent 
                chatId={selectedChatId} 
                onChatDelete={handleChatDelete} 
                onFileUploadSuccess={loadChats} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}