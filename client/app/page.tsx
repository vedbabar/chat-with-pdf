// 'use client';

// import { UserButton, useAuth } from '@clerk/nextjs';
// import { useState, useEffect, useCallback } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import ChatComponent from './components/chat';
// import FileUploadComponent from './components/file-upload';
// import { Menu, Plus, MessageCircle, FileText, Edit2, Check, X, Loader2, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';

// // ⭐ DEFINE API URL BASED ON ENVIRONMENT
// const API_BASE_URL = process.env.NODE_ENV === 'production' 
//   ? 'https://chat-with-pdf-back.vercel.app' 
//   : 'http://localhost:8000';

// // The main data structure for a single chat session
// interface File {
//   id: string;
//   filename: string;
//   path: string; 
//   publicId: string; 
//   status: 'PROCESSING' | 'DONE' | 'ERROR';
//   createdAt: string;
// }

// interface Chat {
//   id: string;
//   name: string;
//   createdAt: string;
//   updatedAt: string;
//   messages?: any[];
//   files?: File[]; 
// }

// export default function Dashboard() {
//   const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
//   const [chats, setChats] = useState<Chat[]>([]);
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [loading, setLoading] = useState(true);
//   const [editingChatId, setEditingChatId] = useState<string | null>(null);
//   const [editingChatName, setEditingChatName] = useState('');
//   const [filePanelOpen, setFilePanelOpen] = useState(true);
//   const [darkMode, setDarkMode] = useState(false);
  
//   const { getToken } = useAuth();
//   const router = useRouter();
//   const searchParams = useSearchParams();
  
//   const currentChat = chats.find(chat => chat.id === selectedChatId);

//   // Initialize dark mode from localStorage or system preference
//   useEffect(() => {
//     const savedDarkMode = localStorage.getItem('darkMode');
//     if (savedDarkMode !== null) {
//       setDarkMode(JSON.parse(savedDarkMode));
//     } else {
//       // Check system preference
//       const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//       setDarkMode(systemPrefersDark);
//     }
//   }, []);

//   // Apply dark mode to document
//   useEffect(() => {
//     if (darkMode) {
//       document.documentElement.classList.add('dark');
//     } else {
//       document.documentElement.classList.remove('dark');
//     }
//     localStorage.setItem('darkMode', JSON.stringify(darkMode));
//   }, [darkMode]);

//   const toggleDarkMode = () => {
//     setDarkMode(!darkMode);
//   };

//   // Function to load all chats for the logged-in user
//   const loadChats = useCallback(async (selectFirst = false) => {
//     try {
//       const token = await getToken();
//       if (!token) {
//           setLoading(false);
//           return;
//       }
//       // ⭐ UPDATED URL
//       const response = await fetch(`${API_BASE_URL}/chats`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (response.ok) {
//         const chatsData = await response.json();
//         setChats(chatsData);

//         const chatIdFromUrl = searchParams.get('chatId');
//         if (chatIdFromUrl && chatsData.some((c: Chat) => c.id === chatIdFromUrl)) {
//             setSelectedChatId(chatIdFromUrl);
//         } else if (selectFirst && chatsData.length > 0) {
//             const firstChatId = chatsData[0].id;
//             setSelectedChatId(firstChatId);
//             router.replace(`/?chatId=${firstChatId}`);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load chats:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, [getToken, searchParams, router]);

//   useEffect(() => {
//     loadChats(true); // On initial load, select the first chat
//   }, [loadChats]);

//   // Function to create a new chat and automatically select it
//   const createNewChat = async () => {
//     try {
//       const token = await getToken();
//       // ⭐ UPDATED URL
//       const response = await fetch(`${API_BASE_URL}/chats`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ name: `New Chat` }),
//       });
//       if (response.ok) {
//         const newChat = await response.json();
//         await loadChats(); // Reload all chats to get the new one in the list
//         setSelectedChatId(newChat.id);
//         router.push(`/?chatId=${newChat.id}`);
//       }
//     } catch (error) {
//       console.error('Failed to create chat:', error);
//     }
//   };

//   // ✅ FIX: This function now handles the state change cleanly before navigation
//   const handleSelectChat = (chatId: string) => {
//     setSelectedChatId(chatId);
//     router.push(`/?chatId=${chatId}`);
//   };

//   const handleChatDelete = async () => {
//     setLoading(true);
//     setSelectedChatId(null);
//     router.push('/');
//     await loadChats(true); // Reload chats and select the new first one
//   };

//   const startEditingChat = (chat: Chat) => {
//     setEditingChatId(chat.id);
//     setEditingChatName(chat.name);
//   };

//   const saveEditingChat = async () => {
//     if (!editingChatId || !editingChatName.trim()) return;
//     try {
//       const token = await getToken();
//       // ⭐ UPDATED URL
//       const response = await fetch(`${API_BASE_URL}/chats/${editingChatId}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ name: editingChatName.trim() }),
//       });
//       if (response.ok) {
//         const updatedChat = await response.json();
//         setChats(prev => prev.map(chat => 
//           chat.id === editingChatId ? { ...chat, name: updatedChat.name } : chat
//         ));
//       }
//     } catch (error) {
//       console.error('Failed to update chat:', error);
//     } finally {
//       setEditingChatId(null);
//       setEditingChatName('');
//     }
//   };
  
//   const cancelEditingChat = () => {
//     setEditingChatId(null);
//     setEditingChatName('');
//   };

//   const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

//   if (loading && chats.length === 0) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
//         <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen flex bg-slate-100 dark:bg-slate-900">
//       {/* Sidebar */}
//       <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col`}>
//         <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <h1 className="font-semibold text-slate-800 dark:text-slate-200">Chat-with-PDF</h1>
//           </div>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={toggleDarkMode}
//               className="h-8 w-8 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
//               aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
//             >
//               {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
//             </Button>
//             <UserButton afterSignOutUrl="/" />
//           </div>
//         </div>
//         <div className="p-4 border-b border-slate-200 dark:border-slate-700">
//           <Button onClick={createNewChat} className="w-full">
//             <Plus className="h-4 w-4 mr-2" /> New Chat
//           </Button>
//         </div>
//         <div className="flex-1 overflow-y-auto">
//           {chats.map((chat) => (
//             <div key={chat.id} className={`m-2 rounded-lg border group ${selectedChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent'}`}>
//               <div onClick={() => handleSelectChat(chat.id)} className="p-3 cursor-pointer">
//                 <div className="flex items-center justify-between mb-2">
//                   {editingChatId === chat.id ? (
//                     <div className="flex items-center gap-1 flex-1">
//                       <Input value={editingChatName} onChange={(e) => setEditingChatName(e.target.value)} className="h-7 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') saveEditingChat(); if (e.key === 'Escape') cancelEditingChat(); }} onClick={(e) => e.stopPropagation()} autoFocus />
//                       <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); saveEditingChat(); }} className="h-6 w-6"><Check className="h-3 w-3" /></Button>
//                       <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); cancelEditingChat(); }} className="h-6 w-6"><X className="h-3 w-3" /></Button>
//                     </div>
//                   ) : (
//                     <>
//                       <p className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">{chat.name}</p>
//                       <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); startEditingChat(chat); }} className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"><Edit2 className="h-3 w-3" /></Button>
//                     </>
//                   )}
//                 </div>
//                 <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
//                   <span>{formatDate(chat.createdAt)}</span>
//                   {chat.files && chat.files.length > 0 && <div className="flex items-center gap-1"><FileText className="h-3 w-3" /><span className="font-medium">{chat.files.length}</span></div>}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Main Content Area + Right Panel */}
//       <div className="flex-1 flex flex-row">
//         {/* Main Chat Area */}
//         <div className="flex-1 flex flex-col">
//           <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu className="h-4 w-4" /></Button>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => setFilePanelOpen(!filePanelOpen)}
//                 className="h-8 w-8 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
//                 aria-label={filePanelOpen ? "Hide file panel" : "Show file panel"}
//               >
//                 <FileText className="h-4 w-4" />
//               </Button>
//             </div>
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={toggleDarkMode}
//                 className="h-8 w-8 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
//                 aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
//               >
//                 {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
//               </Button>
//               <UserButton afterSignOutUrl="/" />
//             </div>
//           </div>
//           {selectedChatId ? (
//             <ChatComponent 
//               key={selectedChatId} // ✅ FIX: Add a key to force re-mounting
//               chatId={selectedChatId}
//             />
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-center">
//               <div>
//                 <MessageCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
//                 <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Welcome to DocuChat</h2>
//                 <p className="text-slate-500 dark:text-slate-400 mt-2">Create a new chat to get started.</p>
//               </div>
//             </div>
//           )}
//         </div>
//         {/* Collapsible File Upload Panel */}
//         <div className={`relative transition-all duration-300 ${filePanelOpen ? 'w-[350px] min-w-[300px]' : 'w-6 min-w-0'} bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col`}>
//           {/* Collapse/Expand Button */}
//           <button
//             className="absolute -left-3 top-1/2 z-10 transform -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full shadow p-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
//             onClick={() => setFilePanelOpen(open => !open)}
//             aria-label={filePanelOpen ? "Collapse file panel" : "Expand file panel"}
//             tabIndex={0}
//           >
//             {filePanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
//           </button>
//           {filePanelOpen && (
//             <FileUploadComponent
//               chatId={selectedChatId}
//               onChatDelete={handleChatDelete}
//               onFileUploadSuccess={() => loadChats(false)}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


























'use client';

import { UserButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatComponent from './components/chat';
import FileUploadComponent from './components/file-upload';
import { Menu, Plus, MessageCircle, FileText, Edit2, Check, X, Loader2, ChevronLeft, ChevronRight, Sun, Moon, BookOpen } from 'lucide-react';
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
          <div className="relative bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      {/* Modern Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col shadow-2xl`}>
        <div className="relative p-5 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition"></div>
                <div className="relative p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Chat-with-PDF
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition transform hover:scale-110"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-slate-600" />}
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
        
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <button 
            onClick={createNewChat} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="h-5 w-5" />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => handleSelectChat(chat.id)} 
              className={`group m-2 p-4 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] ${
                selectedChatId === chat.id
                  ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-300 dark:border-blue-600 shadow-lg'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-2 border-transparent'
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
                      className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition transform hover:scale-110"
                    >
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelEditingChat(); }}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition transform hover:scale-110"
                    >
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-slate-900 dark:text-white truncate flex-1">{chat.name}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditingChat(chat); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transform hover:scale-110"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{formatDate(chat.createdAt)}</span>
                {chat.files && chat.files.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                    <FileText className="h-3 w-3" />
                    <span className="font-semibold">{chat.files.length}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area + Right Panel */}
      <div className="flex-1 flex flex-row">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="lg:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="h-4 w-4" />
              </Button>
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
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-slate-600" />}
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
            <div className="flex-1 flex items-center justify-center text-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
              <div>
                <div className="relative mb-6 w-fit mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 p-8 rounded-3xl shadow-2xl">
                    <MessageCircle className="h-20 w-20 text-blue-600 dark:text-blue-400 mx-auto" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3">
                  Welcome to Chat-with-PDF
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Create a new chat to get started.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Collapsible File Upload Panel */}
        <div className={`relative transition-all duration-300 ${filePanelOpen ? 'w-[350px] min-w-[300px]' : 'w-6 min-w-0'} bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-l border-slate-200/50 dark:border-slate-700/50 flex flex-col shadow-2xl`}>
          <button
            className="absolute -left-3 top-1/2 z-10 transform -translate-y-1/2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-full shadow-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition transform hover:scale-110"
            onClick={() => setFilePanelOpen(open => !open)}
            aria-label={filePanelOpen ? "Collapse file panel" : "Expand file panel"}
          >
            {filePanelOpen ? <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" /> : <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
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
