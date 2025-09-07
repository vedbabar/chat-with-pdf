'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { Send, FileText, User, Bot, ChevronDown } from 'lucide-react';
import { ChatMessagesSkeleton } from './skeletons';

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
  return cleaned.trim();
}

const ChatComponent: React.FC<ChatComponentProps> = ({ chatId, isLoading: externalLoading = false }) => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [expandedDocs, setExpandedDocs] = React.useState<Record<number, boolean>>({});
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();

  // FIXED: Clear messages immediately when chatId changes
  React.useEffect(() => {
    if (chatId) {
      setMessages([]); // Clear immediately to prevent showing old messages
      setExpandedDocs({}); // Clear expanded docs state
    }
  }, [chatId]);

  // Fetch messages when the active chat changes
  React.useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) {
        setMessages([]);
        return;
      }
      
      try {
        const token = await getToken();
        const response = await fetch(`http://localhost:8000/chats/${chatId}/messages`, {
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

    // Only fetch if not in loading state (skeleton is showing)
    if (chatId && !externalLoading) {
      fetchMessages();
    }
  }, [chatId, getToken, externalLoading]);

  // IMPROVED: Auto-scroll with better timing
  React.useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    };

    // Scroll when messages change or when switching chats
    if (messages.length > 0 || chatId) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, chatId]);

  const handleSendChatMessage = async () => {
    if (!message.trim() || !chatId) return;

    const userMessage: IMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:8000/chat?message=${encodeURIComponent(userMessage.content || '')}&chatId=${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to get response");
      
      const data = await response.json();
      const assistantMessage: IMessage = {
        role: 'assistant',
        content: data.message,
        documents: data.docs,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      const errorMessage: IMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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

  // FIXED: Show skeleton when switching chats OR when externally loading
  if (externalLoading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header skeleton */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-lg">
              <div className="h-6 w-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
            </div>
            <div>
              <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-40 mb-1"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-56"></div>
            </div>
          </div>
        </div>

        <ChatMessagesSkeleton />

        {/* Input area skeleton */}
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 animate-pulse">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            <div className="h-10 w-10 bg-slate-300 dark:bg-slate-600 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg transition-colors duration-200">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">PDF Chat Assistant</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Ask questions about your uploaded documents</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {!chatId ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
             <Bot className="h-12 w-12 text-blue-500 mb-4" />
             <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Welcome!</h3>
             <p className="text-slate-500 dark:text-slate-400">Select or create a chat to get started.</p>
          </div>
        ) : (messages.length === 0 && !isLoading) ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">This chat is empty</h3>
            <p className="text-slate-500 dark:text-slate-400">Upload a document or ask a question.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id || `${chatId}-${index}`} className={`flex gap-4 items-start animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDelay: `${index * 50}ms` }}>
              {msg.role === 'assistant' && (
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 h-fit transition-colors duration-200">
                  <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div className={`max-w-3xl transition-all duration-300 hover:scale-[1.01] ${msg.role === 'user' ? 'order-2' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-300 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:shadow-md'
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: cleanAssistantContent(msg.content) }} />
                </div>
                {msg.documents && msg.documents.length > 0 && (
                   <div className="mt-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden transition-all duration-300 hover:shadow-md">
                     <button
                       onClick={() => toggleDocExpansion(index)}
                       className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                     >
                       <div className="flex items-center gap-2">
                         <FileText className="h-4 w-4" />
                         <span>{msg.documents.length} source{msg.documents.length > 1 ? 's' : ''}</span>
                       </div>
                       <div className={`transition-transform duration-200 ${expandedDocs[index] ? 'rotate-180' : ''}`}>
                         <ChevronDown className="h-4 w-4" />
                       </div>
                     </button>
                     <div className={`border-t border-slate-200 dark:border-slate-600 transition-all duration-300 overflow-hidden ${
                       expandedDocs[index] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                     }`}>
                       {expandedDocs[index] && (
                         <div>
                           {msg.documents.map((doc, docIndex) => (
                             <div key={docIndex} className="p-4 border-b last:border-b-0 border-slate-200 dark:border-slate-600 animate-fade-in" style={{ animationDelay: `${docIndex * 50}ms` }}>
                               <div className="flex items-center gap-2 mb-2">
                                 <div className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded transition-colors duration-200">
                                   {formatSourceName(doc.metadata?.source)}
                                 </div>
                                 {doc.metadata?.loc?.pageNumber && (
                                   <div className="text-xs text-slate-500 dark:text-slate-400">
                                     Page {doc.metadata.loc.pageNumber}
                                   </div>
                                 )}
                               </div>
                               <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                 {doc.pageContent && doc.pageContent.length > 200
                                   ? `${doc.pageContent.substring(0, 200)}...`
                                   : doc.pageContent}
                               </p>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="bg-slate-200 dark:bg-slate-600 rounded-full p-2 h-fit transition-colors duration-200">
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Enhanced loading indicator */}
        {isLoading && messages.length > 0 && (
          <div className="flex gap-4 justify-start animate-fade-in">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 h-fit transition-colors duration-200">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm transition-colors duration-200">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 transition-colors duration-200">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Input 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            onKeyDown={handleKeyPress} 
            placeholder={chatId ? "Ask a question..." : "Please select a chat to begin"} 
            className="flex-1 transition-all duration-200 focus:scale-[1.01] bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100" 
            disabled={isLoading || !chatId} 
          />
          <Button 
            onClick={handleSendChatMessage} 
            disabled={!message.trim() || isLoading || !chatId}
            className="transition-all duration-200 hover:scale-105"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;