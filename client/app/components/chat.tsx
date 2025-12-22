'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { Send, FileText, User, Bot, ChevronDown, BookOpen, Quote, Sparkles } from 'lucide-react';
import { ChatMessagesSkeleton } from './skeletons';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://chat-with-pdf-back.vercel.app' 
  : 'http://localhost:8000';

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: { pageNumber?: number };
    source?: string;
  };
}

interface IMessage {
  id?: string;
  role: 'assistant' | 'user';
  content?: string;
  documents?: Doc[];
}

interface ChatComponentProps {
  chatId: string | null;
  isLoading?: boolean;
}

function cleanAssistantContent(content?: string) {
  if (!content) return '';
  
  let cleaned = content.replace(/```[\s\S]*?```/g, match => {
    return match.replace(/```[\w]*\n?/, '').replace(/```$/, '');
  });
  
  cleaned = cleaned.replace(/<\/?html>/gi, '');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/\b(page \d+|section \d+|chapter \d+)/gi, '<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">$1</span>');
  cleaned = cleaned.replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-2"><span class="text-blue-500 mt-1">•</span><span>$1</span></div>');
  
  return cleaned.trim();
}

const ChatComponent: React.FC<ChatComponentProps> = ({ chatId, isLoading: externalLoading = false }) => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [expandedDocs, setExpandedDocs] = React.useState<Record<number, boolean>>({});
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();

  React.useEffect(() => {
    if (chatId) {
      setMessages([]);
      setExpandedDocs({});
    }
  }, [chatId]);

  React.useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) {
        setMessages([]);
        return;
      }
      
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);
      }
    };

    if (chatId && !externalLoading) {
      fetchMessages();
    }
  }, [chatId, getToken, externalLoading]);

  React.useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    };

    if (messages.length > 0 || chatId) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, chatId]);

  const handleSendChatMessage = async () => {
    if (!message.trim() || !chatId) return;

    const userMessage: IMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const token = await getToken();
      const assistantMessageId = Date.now().toString();
      setMessages(prev => [...prev, { 
        id: assistantMessageId,
        role: 'assistant', 
        content: '', 
        documents: [] 
      }]);

      const response = await fetch(`${API_BASE_URL}/chat?message=${encodeURIComponent(userMessage.content || '')}&chatId=${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok || !response.body) throw new Error("Failed to get response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantDocs: Doc[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;

            try {
              const data = JSON.parse(dataStr);

              if (data.type === 'sources') {
                assistantDocs = data.docs || [];
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  if (lastMsg.role === 'assistant') {
                    lastMsg.documents = assistantDocs;
                  }
                  return newMsgs;
                });
              }

              if (data.type === 'token') {
                assistantContent += data.text;
                setIsTyping(false);
                
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  if (lastMsg.role === 'assistant') {
                    lastMsg.content = assistantContent;
                  }
                  return newMsgs;
                });
              }

              if (data.type === 'error') {
                throw new Error(data.message);
              }

            } catch (e) {
              console.error("Error parsing chunk", e);
            }
          }
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'assistant' && !newMsgs[newMsgs.length - 1].content) {
            newMsgs.pop();
        }
        
        newMsgs.push({
            role: 'assistant',
            content: '<div class="flex items-center gap-2 text-red-600 dark:text-red-400"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>Sorry, I encountered an error. Please try again.</div>',
        });
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  const toggleDocExpansion = (messageIndex: number) => {
    setExpandedDocs(prev => ({ ...prev, [messageIndex]: !prev[messageIndex] }));
  };

  const formatSourceName = (source?: string) => {
    if (!source) return 'Document';
    const filename = source.split('/').pop()?.split('\\').pop() || source;
    return filename.length > 30 ? `${filename.substring(0, 30)}...` : filename;
  };

  const welcomePrompts = [
    "What are the main topics covered in this document?",
    "Can you summarize the key points from the uploaded PDF?",
    "What specific information should I know about this document?",
    "Are there any important dates or figures mentioned?"
  ];

  if (externalLoading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="relative px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-3 rounded-2xl">
                <div className="h-6 w-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
              </div>
              <div>
                <div className="h-7 bg-slate-300 dark:bg-slate-600 rounded w-48 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
              </div>
            </div>
          </div>
        </div>
        <ChatMessagesSkeleton />
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 px-6 py-4 animate-pulse">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="flex-1 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
            <div className="h-14 w-14 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-700 dark:to-purple-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 transition-all duration-300">
      {/* Modern Header */}
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg transform group-hover:scale-105 transition">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Chat-with-PDF
                </h1>
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI-powered document assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {!chatId ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 p-8 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/20">
                <BookOpen className="h-20 w-20 text-blue-600 dark:text-blue-400 mx-auto" />
              </div>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3">
              Welcome to Chat-with-PDF
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md text-lg">
              Select or create a chat to start analyzing your PDF documents with AI-powered insights
            </p>
          </div>
        ) : (messages.length === 0 && !isLoading) ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="max-w-3xl w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="relative mb-6 w-fit mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur opacity-50"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-5 rounded-2xl shadow-lg">
                  <Bot className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Ready to analyze your document
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Ask me anything about your PDF. I can summarize, find information, and provide detailed analysis.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {welcomePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(prompt)}
                    className="group text-left p-4 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Quote className="h-5 w-5 text-blue-500 mt-0.5 group-hover:text-blue-600 transition flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition font-medium">
                        {prompt}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || `${chatId}-${index}`}
              className={`flex gap-4 items-start animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {msg.role === 'assistant' && (
                <div className="relative group flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-50 transition"></div>
                  <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full p-3 shadow-md transform group-hover:scale-110 transition">
                    <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              )}
              <div className={`transition-all duration-300 hover:scale-[1.01] ${msg.role === 'user' ? 'order-2 max-w-md' : 'max-w-3xl'}`}>
                <div className={`rounded-2xl px-6 py-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-blue-500/20'
                    : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200'
                }`}>
                  {msg.content ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>div]:mb-2 [&>div>span]:inline-block" dangerouslySetInnerHTML={{ __html: cleanAssistantContent(msg.content) }} />
                  ) : (
                      <div className="flex items-center gap-2">
                        <span className="animate-pulse">Analyzing document...</span>
                      </div>
                  )}
                </div>
                
                {msg.documents && msg.documents.length > 0 && (
                  <div className="mt-3">
                    <button 
                      onClick={() => toggleDocExpansion(index)}
                      className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 mb-2 transition group"
                    >
                      <ChevronDown className={`h-4 w-4 transform transition ${expandedDocs[index] ? 'rotate-180' : ''}`} />
                      <span className="group-hover:underline">
                        {expandedDocs[index] ? 'Hide' : 'View'} {msg.documents.length} Source{msg.documents.length > 1 ? 's' : ''}
                      </span>
                    </button>
                    
                    {expandedDocs[index] && (
                      <div className="grid gap-2 animate-fade-in">
                        {msg.documents.map((doc, docIndex) => (
                          <div key={docIndex} className="bg-slate-50/80 dark:bg-slate-700/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 dark:border-slate-600/50 text-xs hover:border-blue-300 dark:hover:border-blue-600 transition">
                            <div className="flex items-center gap-2 mb-2 font-semibold text-blue-700 dark:text-blue-300">
                              <FileText className="h-4 w-4" />
                              <span>{formatSourceName(doc.metadata?.source)}</span>
                              {doc.metadata?.loc?.pageNumber && (
                                <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-md text-xs">
                                  Page {doc.metadata.loc.pageNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 italic pl-4 border-l-2 border-blue-300 dark:border-blue-600">
                              "{doc.pageContent ? (doc.pageContent.length > 150 ? doc.pageContent.substring(0, 150) + '...' : doc.pageContent) : 'No content preview'}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="relative group flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full blur opacity-0 group-hover:opacity-50 transition"></div>
                  <div className="relative bg-slate-200 dark:bg-slate-700 rounded-full p-3 shadow-md transform group-hover:scale-110 transition">
                    <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
          <div className="flex gap-4 justify-start animate-fade-in">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full p-3 h-fit shadow-md">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl px-6 py-4 shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Modern Input Area */}
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 px-6 py-5 transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative group">
            <Input 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              onKeyDown={handleKeyPress} 
              placeholder={chatId ? "Ask anything about your document..." : "Select a chat to begin"} 
              className="h-14 text-base bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none group-hover:border-slate-300 dark:group-hover:border-slate-600" 
              disabled={isLoading || !chatId} 
            />
            {isTyping && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>
          <Button 
            onClick={handleSendChatMessage} 
            disabled={!message.trim() || isLoading || !chatId}
            className="relative h-14 w-14 p-0 rounded-2xl shadow-lg transform hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-pink-500 transition"></div>
            <Send className="relative h-5 w-5 text-white z-10" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;







// 'use client';

// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import * as React from 'react';
// import { useAuth } from '@clerk/nextjs';
// import { Send, FileText, User, Bot, ChevronDown, BookOpen, Quote, AlertCircle, Sparkles } from 'lucide-react';
// import { ChatMessagesSkeleton } from './skeletons';

// // ⭐ DEFINE API URL BASED ON ENVIRONMENT
// const API_BASE_URL = process.env.NODE_ENV === 'production' 
//   ? 'https://chat-with-pdf-back.vercel.app' 
//   : 'http://localhost:8000';

// interface Doc {
//   pageContent?: string;
//   metadata?: {
//     loc?: { pageNumber?: number };
//     source?: string;
//   };
// }

// interface IMessage {
//   id?: string;
//   role: 'assistant' | 'user';
//   content?: string;
//   documents?: Doc[];
// }

// interface ChatComponentProps {
//   chatId: string | null;
//   isLoading?: boolean;
// }

// function cleanAssistantContent(content?: string) {
//   if (!content) return '';
  
//   // Enhanced HTML processing for DocuChat responses
//   let cleaned = content.replace(/```[\s\S]*?```/g, match => {
//     return match.replace(/```[\w]*\n?/, '').replace(/```$/, '');
//   });
  
//   // Remove html tags but keep content
//   cleaned = cleaned.replace(/<\/?html>/gi, '');
  
//   // Enhanced formatting for DocuChat responses
//   // Convert **text** to <strong>text</strong>
//   cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
//   // Convert section references to highlighted spans
//   cleaned = cleaned.replace(/\b(page \d+|section \d+|chapter \d+)/gi, '<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">$1</span>');
  
//   // Enhanced bullet points with proper formatting
//   cleaned = cleaned.replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-2"><span class="text-blue-500 mt-1">•</span><span>$1</span></div>');
  
//   return cleaned.trim();
// }

// const ChatComponent: React.FC<ChatComponentProps> = ({ chatId, isLoading: externalLoading = false }) => {
//   const [message, setMessage] = React.useState<string>('');
//   const [messages, setMessages] = React.useState<IMessage[]>([]);
//   const [isLoading, setIsLoading] = React.useState(false);
//   const [expandedDocs, setExpandedDocs] = React.useState<Record<number, boolean>>({});
//   const [isTyping, setIsTyping] = React.useState(false);
//   const messagesEndRef = React.useRef<HTMLDivElement>(null);
//   const { getToken } = useAuth();

//   // Clear messages immediately when chatId changes
//   React.useEffect(() => {
//     if (chatId) {
//       setMessages([]);
//       setExpandedDocs({});
//     }
//   }, [chatId]);

//   // Fetch messages when the active chat changes
//   React.useEffect(() => {
//     const fetchMessages = async () => {
//       if (!chatId) {
//         setMessages([]);
//         return;
//       }
      
//       try {
//         const token = await getToken();
//         // ⭐ UPDATED URL
//         const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         });
//         if (response.ok) {
//           const data = await response.json();
//           setMessages(data);
//         } else {
//           setMessages([]);
//         }
//       } catch (error) {
//         console.error("Failed to fetch messages:", error);
//         setMessages([]);
//       }
//     };

//     if (chatId && !externalLoading) {
//       fetchMessages();
//     }
//   }, [chatId, getToken, externalLoading]);

//   // Enhanced auto-scroll
//   React.useEffect(() => {
//     const scrollToBottom = () => {
//       messagesEndRef.current?.scrollIntoView({ 
//         behavior: 'smooth',
//         block: 'end'
//       });
//     };

//     if (messages.length > 0 || chatId) {
//       setTimeout(scrollToBottom, 100);
//     }
//   }, [messages, chatId]);

//   const handleSendChatMessage = async () => {
//     if (!message.trim() || !chatId) return;

//     // 1. Add User Message
//     const userMessage: IMessage = { role: 'user', content: message };
//     setMessages(prev => [...prev, userMessage]);
//     setMessage('');
//     setIsLoading(true);
//     setIsTyping(true);

//     try {
//       const token = await getToken();

//       // 2. Add empty Assistant Message immediately so we can stream into it
//       const assistantMessageId = Date.now().toString(); // Temporary ID
//       setMessages(prev => [...prev, { 
//         id: assistantMessageId,
//         role: 'assistant', 
//         content: '', 
//         documents: [] 
//       }]);

//       // 3. Start Streaming Fetch
//       const response = await fetch(`${API_BASE_URL}/chat?message=${encodeURIComponent(userMessage.content || '')}&chatId=${chatId}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });

//       if (!response.ok || !response.body) throw new Error("Failed to get response");

//       // 4. Read the Stream
//       const reader = response.body.getReader();
//       const decoder = new TextDecoder();
//       let assistantContent = '';
//       let assistantDocs: Doc[] = [];

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         const chunk = decoder.decode(value, { stream: true });
//         const lines = chunk.split('\n\n');

//         for (const line of lines) {
//           if (line.startsWith('data: ')) {
//             const dataStr = line.replace('data: ', '').trim();
//             if (dataStr === '[DONE]') break;

//             try {
//               const data = JSON.parse(dataStr);

//               // A. Handle Sources Event
//               if (data.type === 'sources') {
//                 assistantDocs = data.docs || [];
//                 // Update docs immediately
//                 setMessages(prev => {
//                   const newMsgs = [...prev];
//                   const lastMsg = newMsgs[newMsgs.length - 1];
//                   if (lastMsg.role === 'assistant') {
//                     lastMsg.documents = assistantDocs;
//                   }
//                   return newMsgs;
//                 });
//               }

//               // B. Handle Token (Text) Event
//               if (data.type === 'token') {
//                 assistantContent += data.text;
//                 setIsTyping(false); // Stop typing indicator once text starts appearing
                
//                 // Update text content
//                 setMessages(prev => {
//                   const newMsgs = [...prev];
//                   const lastMsg = newMsgs[newMsgs.length - 1];
//                   if (lastMsg.role === 'assistant') {
//                     lastMsg.content = assistantContent;
//                   }
//                   return newMsgs;
//                 });
//               }

//               // C. Handle Error Event
//               if (data.type === 'error') {
//                 throw new Error(data.message);
//               }

//             } catch (e) {
//               console.error("Error parsing chunk", e);
//             }
//           }
//         }
//       }

//     } catch (error) {
//       console.error("Chat error:", error);
//       // Replace the last message (which was empty/partial) with error
//       setMessages(prev => {
//         const newMsgs = [...prev];
//         // Remove the empty assistant message we added earlier if it failed completely
//         if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'assistant' && !newMsgs[newMsgs.length - 1].content) {
//             newMsgs.pop();
//         }
        
//         newMsgs.push({
//             role: 'assistant',
//             content: '<div class="flex items-center gap-2 text-red-600 dark:text-red-400"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>Sorry, I encountered an error while processing your request. Please try again.</div>',
//         });
//         return newMsgs;
//       });
//     } finally {
//       setIsLoading(false);
//       setIsTyping(false);
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendChatMessage();
//     }
//   };

//   const toggleDocExpansion = (messageIndex: number) => {
//     setExpandedDocs(prev => ({ ...prev, [messageIndex]: !prev[messageIndex] }));
//   };

//   const formatSourceName = (source?: string) => {
//     if (!source) return 'Document';
//     const filename = source.split('/').pop()?.split('\\').pop() || source;
//     return filename.length > 30 ? `${filename.substring(0, 30)}...` : filename;
//   };

//   // Enhanced welcome prompts
//   const welcomePrompts = [
//     "What are the main topics covered in this document?",
//     "Can you summarize the key points from the uploaded PDF?",
//     "What specific information should I know about this document?",
//     "Are there any important dates or figures mentioned?"
//   ];

//   if (externalLoading) {
//     return (
//       <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
//         {/* Enhanced header skeleton */}
//         <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm animate-pulse">
//           <div className="flex items-center gap-3">
//             <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-3 rounded-xl">
//               <div className="h-6 w-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
//             </div>
//             <div>
//               <div className="h-7 bg-slate-300 dark:bg-slate-600 rounded w-48 mb-2"></div>
//               <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
//             </div>
//           </div>
//         </div>

//         <ChatMessagesSkeleton />

//         {/* Enhanced input area skeleton */}
//         <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 animate-pulse">
//           <div className="flex gap-3 max-w-4xl mx-auto">
//             <div className="flex-1 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
//             <div className="h-12 w-12 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-700 dark:to-purple-700 rounded-xl"></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-300">
//       {/* Enhanced Header */}
//       <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-2 shadow-sm transition-all duration-300">
//         <div className="flex items-center gap-4">
//           <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl shadow-md transition-all duration-300 hover:scale-105">
//             <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//           </div>
//           <div>
//             <div className="flex items-center gap-2">
//               <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Chat-with-PDF</h1>
//               <Sparkles className="h-4 w-4 text-purple-500" />
//             </div>
//             <p className="text-sm text-slate-600 dark:text-slate-400">Document analysis assistant</p>
//           </div>
//         </div>
//       </div>

//       {/* Messages Container */}
//       <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
//         {!chatId ? (
//           <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
//             <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-6 rounded-2xl shadow-lg mb-6">
//               <BookOpen className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto" />
//             </div>
//             <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Welcome to Chat-with-PDF!</h3>
//             <p className="text-slate-500 dark:text-slate-400 max-w-md">Select or create a chat to start analyzing your PDF documents with AI-powered insights.</p>
//           </div>
//         ) : (messages.length === 0 && !isLoading) ? (
//           <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
//             <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-8 rounded-2xl shadow-lg mb-6 max-w-2xl">
//               <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-4 rounded-xl shadow-md mb-4 w-fit mx-auto">
//                 <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
//               </div>
//               <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">Ready to analyze your document!</h3>
//               <p className="text-slate-600 dark:text-slate-400 mb-6">Ask me anything about your uploaded PDF. I can help you find specific information, summarize content, and provide detailed analysis.</p>
              
//               {/* Quick start prompts */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 {welcomePrompts.map((prompt, index) => (
//                   <button
//                     key={index}
//                     onClick={() => setMessage(prompt)}
//                     className="text-left p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 group"
//                   >
//                     <div className="flex items-start gap-2">
//                       <Quote className="h-4 w-4 text-blue-500 mt-0.5 group-hover:text-blue-600" />
//                       <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{prompt}</span>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         ) : (
//           messages.map((msg, index) => (
//             <div
//               key={msg.id || `${chatId}-${index}`}
//               className={`flex gap-4 items-start animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
//               style={{ animationDelay: `${index * 50}ms` }}
//             >
//               {msg.role === 'assistant' && (
//                 <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2.5 h-fit shadow-md transition-all duration-300 hover:scale-105">
//                   <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
//                 </div>
//               )}
//               <div className={`transition-all duration-300 hover:scale-[1.01] ${msg.role === 'user' ? 'order-2 max-w-md' : 'max-w-3xl'}`}>
//                 <div className={`rounded-2xl px-5 py-4 shadow-md transition-all duration-300 hover:shadow-lg ${
//                   msg.role === 'user'
//                     ? 'bg-blue-600 text-white hover:bg-blue-700'
//                     : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
//                 }`}>
//                   {/* Render content safely */}
//                   {msg.content ? (
//                       <div className="prose prose-sm dark:prose-invert max-w-none [&>div]:mb-2 [&>div>span]:inline-block" dangerouslySetInnerHTML={{ __html: cleanAssistantContent(msg.content) }} />
//                   ) : (
//                       <div className="flex items-center gap-2">
//                         <span className="animate-pulse">Analyzing document...</span>
//                       </div>
//                   )}
//                 </div>
                
//                 {/* Documents section */}
//                 {msg.documents && msg.documents.length > 0 && (
//                   <div className="mt-2">
//                     <button 
//                       onClick={() => toggleDocExpansion(index)}
//                       className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline mb-2"
//                     >
//                       {expandedDocs[index] ? <ChevronDown className="h-3 w-3 rotate-180" /> : <ChevronDown className="h-3 w-3" />}
//                       {expandedDocs[index] ? 'Hide Sources' : `View ${msg.documents.length} Sources`}
//                     </button>
                    
//                     {expandedDocs[index] && (
//                       <div className="grid gap-2 animate-fade-in">
//                         {msg.documents.map((doc, docIndex) => (
//                           <div key={docIndex} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300">
//                             <div className="flex items-center gap-2 mb-1 font-semibold text-blue-700 dark:text-blue-300">
//                               <FileText className="h-3 w-3" />
//                               <span>{formatSourceName(doc.metadata?.source)}</span>
//                               {doc.metadata?.loc?.pageNumber && (
//                                 <span className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-[10px]">
//                                   Page {doc.metadata.loc.pageNumber}
//                                 </span>
//                               )}
//                             </div>
//                             <p className="italic opacity-80 pl-4 border-l-2 border-slate-300 dark:border-slate-500">
//                               "{doc.pageContent ? (doc.pageContent.length > 150 ? doc.pageContent.substring(0, 150) + '...' : doc.pageContent) : 'No content preview'}"
//                             </p>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//               {msg.role === 'user' && (
//                 <div className="bg-slate-200 dark:bg-slate-600 rounded-full p-2.5 h-fit shadow-md transition-all duration-300 hover:scale-105">
//                   <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
//                 </div>
//               )}
//             </div>
//           ))
//         )}
        
//         {/* Enhanced typing indicator - only show if strictly loading AND no partial message is being streamed */}
//         {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
//           <div className="flex gap-4 justify-start animate-fade-in">
//             <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full p-2.5 h-fit shadow-md">
//               <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
//             </div>
//             <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 shadow-md">
//               <div className="flex items-center gap-2">
//                 <div className="flex gap-1">
//                   <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
//                   <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
//                   <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
//                 </div>
//                 <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">Bro is analyzing...</span>
//               </div>
//             </div>
//           </div>
//         )}
        
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Enhanced Input Area */}
//       <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 transition-colors duration-300">
//         <div className="flex gap-4 max-w-4xl mx-auto">
//           <div className="flex-1 relative">
//             <Input 
//               value={message} 
//               onChange={(e) => setMessage(e.target.value)} 
//               onKeyDown={handleKeyPress} 
//               placeholder={chatId ? "Ask DocuChat about your document..." : "Please select a chat to begin"} 
//               className="h-12 text-base transition-all duration-200 focus:scale-[1.01] bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl shadow-sm focus:shadow-md pr-12" 
//               disabled={isLoading || !chatId} 
//             />
//             {isTyping && (
//               <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                 <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
//               </div>
//             )}
//           </div>
//           <Button 
//             onClick={handleSendChatMessage} 
//             disabled={!message.trim() || isLoading || !chatId}
//             className="h-12 px-6 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 rounded-xl shadow-md hover:shadow-lg disabled:from-slate-400 disabled:to-slate-500"
//           >
//             <Send className="h-5 w-5" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatComponent;
