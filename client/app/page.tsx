'use client';

import { UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useChat, ChatProvider } from './context/ChatContext';
import ChatComponent from './components/chat';
import FileUploadComponent from './components/file-upload';
import { Plus, FileText, Edit2, Check, X, Loader2, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

function DashboardContent() {
  const { 
    chats, 
    selectedChatId, 
    loading, 
    createChat, 
    selectChat, 
    deleteChat, 
    updateChatName, 
    editingChatId, 
    setEditingChatId 
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingChatName, setEditingChatName] = useState('');
  const [filePanelOpen, setFilePanelOpen] = useState(true);
  
  const startEditingChat = (chat: any) => {
    setEditingChatId(chat.id);
    setEditingChatName(chat.name);
  };

  const saveEditingChat = async () => {
     await updateChatName(editingChatName);
     setEditingChatName('');
  };
  
  const cancelEditingChat = () => {
    setEditingChatId(null);
    setEditingChatName('');
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (loading && chats.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#212121]">
        <div className="p-6 rounded-lg border border-white/10">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#212121] text-white antialiased">
      {/* Left Sidebar - Original Design with ChatGPT Colors */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden bg-[#171717] border-r border-white/5 flex flex-col relative`}>
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#171717]" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight">ChatPDF</span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        
        {/* New Chat Button */}
        <div className="p-4 border-b border-white/5">
          <button 
            onClick={createChat} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#171717] text-sm font-medium rounded-lg hover:bg-white/90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => selectChat(chat.id)} 
              className={`group m-1 p-3 rounded-lg cursor-pointer transition-all duration-150 ${
                selectedChatId === chat.id
                  ? 'bg-[#2f2f2f] border border-white/10'
                  : 'hover:bg-[#2f2f2f]/50 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                {editingChatId === chat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input 
                      value={editingChatName} 
                      onChange={(e) => setEditingChatName(e.target.value)} 
                      className="flex-1 h-7 text-sm bg-[#2f2f2f] border-white/10 rounded text-white" 
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter') saveEditingChat(); 
                        if (e.key === 'Escape') cancelEditingChat(); 
                      }} 
                      onClick={(e) => e.stopPropagation()} 
                      autoFocus 
                    />
                    <button onClick={(e) => { e.stopPropagation(); saveEditingChat(); }} className="p-1 hover:bg-white/10 rounded">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); cancelEditingChat(); }} className="p-1 hover:bg-white/10 rounded">
                      <X className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-white truncate flex-1">{chat.name}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditingChat(chat); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                    >
                      <Edit2 className="h-3 w-3 text-white/50" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>{formatDate(chat.createdAt)}</span>
                {chat.files && chat.files.length > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded text-white/50">
                    <FileText className="h-2.5 w-2.5" />
                    <span>{chat.files.length}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Collapse Button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute -right-3 top-1/2 z-20 transform -translate-y-1/2 bg-[#2f2f2f] border border-white/10 rounded-full p-1.5 hover:bg-[#3f3f3f] transition"
        >
          <PanelLeftClose className="h-3.5 w-3.5 text-white/60" />
        </button>
      </div>

      {/* Expand Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-1/2 z-20 transform -translate-y-1/2 bg-[#2f2f2f] border border-white/10 rounded-full p-2 hover:bg-[#3f3f3f] transition"
        >
          <PanelLeft className="h-4 w-4 text-white/60" />
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-row">
        <div className="flex-1 flex flex-col bg-[#212121]">
          {selectedChatId ? (
            <ChatComponent 
              key={selectedChatId}
              chatId={selectedChatId}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="max-w-md">
                <div className="w-14 h-14 bg-[#2f2f2f] border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-7 w-7 text-white/50" />
                </div>
                <h2 className="text-xl font-medium mb-2">Welcome to ChatPDF</h2>
                <p className="text-white/50 text-sm">Create a new chat or select an existing one to start.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - Original Design with ChatGPT Colors */}
        <div className={`relative transition-all duration-300 ${filePanelOpen ? 'w-[320px]' : 'w-0'} bg-[#171717] border-l border-white/5 overflow-hidden`}>
          <button
            className="absolute -left-3 top-1/2 z-10 transform -translate-y-1/2 bg-[#2f2f2f] border border-white/10 rounded-full p-1.5 hover:bg-[#3f3f3f] transition"
            onClick={() => setFilePanelOpen(open => !open)}
          >
            {filePanelOpen ? <PanelRightClose className="h-3.5 w-3.5 text-white/60" /> : <PanelRight className="h-3.5 w-3.5 text-white/60" />}
          </button>
          {filePanelOpen && (
            <FileUploadComponent
              chatId={selectedChatId}
              onChatDelete={deleteChat}
              onFileUploadSuccess={() => {}}
            />
          )}
        </div>

        {!filePanelOpen && (
          <button
            onClick={() => setFilePanelOpen(true)}
            className="fixed right-4 top-1/2 z-20 transform -translate-y-1/2 bg-[#2f2f2f] border border-white/10 rounded-full p-2 hover:bg-[#3f3f3f] transition"
          >
            <PanelRight className="h-4 w-4 text-white/60" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
    return (
        <ChatProvider>
            <DashboardContent />
        </ChatProvider>
    );
}
