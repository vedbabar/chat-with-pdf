'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { Send, FileText, User, Bot, ChevronDown, BookOpen, Quote, AlertCircle, Sparkles } from 'lucide-react';
import { ChatMessagesSkeleton } from './skeletons';

// ⭐ DEFINE API URL BASED ON ENVIRONMENT
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://chat-with-pdf-readme-generator.vercel.app' 
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
  
  // Enhanced HTML processing for DocuChat responses
  let cleaned = content.replace(/```[\s\S]*?```/g, match => {
    return match.replace(/```[\w]*\n?/, '').replace(/```$/, '');
  });
  
  // Remove html tags but keep content
  cleaned = cleaned.replace(/<\/?html>/gi, '');
  
  // Enhanced formatting for DocuChat responses
  // Convert **text** to <strong>text</strong>
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert section references to highlighted spans
  cleaned = cleaned.replace(/\b(page \d+|section \d+|chapter \d+)/gi, '<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">$1</span>');
  
  // Enhanced bullet points with proper formatting
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

  // Clear messages immediately when chatId changes
  React.useEffect(() => {
    if (chatId) {
      setMessages([]);
      setExpandedDocs({});
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
        // ⭐ UPDATED URL
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

  // Enhanced auto-scroll
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
      // ⭐ UPDATED URL
      const response = await fetch(`${API_BASE_URL}/chat?message=${encodeURIComponent(userMessage.content || '')}&chatId=${chatId}`, {
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
        content: '<div class="flex items-center gap-2 text-red-600 dark:text-red-400"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>Sorry, I encountered an error while processing your request. Please try again.</div>',
      };
      setMessages(prev => [...prev, errorMessage]);
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

  // Enhanced welcome prompts
  const welcomePrompts = [
    "What are the main topics covered in this document?",
    "Can you summarize the key points from the uploaded PDF?",
    "What specific information should I know about this document?",
    "Are there any important dates or figures mentioned?"
  ];

  if (externalLoading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Enhanced header skeleton */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-3 rounded-xl">
              <div className="h-6 w-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
            </div>
            <div>
              <div className="h-7 bg-slate-300 dark:bg-slate-600 rounded w-48 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
            </div>
          </div>
        </div>

        <ChatMessagesSkeleton />

        {/* Enhanced input area skeleton */}
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 animate-pulse">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="flex-1 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-12 w-12 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-700 dark:to-purple-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-300">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-2 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl shadow-md transition-all duration-300 hover:scale-105">
            <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Chat-with-PDF</h1>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Document analysis assistant</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {!chatId ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-6 rounded-2xl shadow-lg mb-6">
              <BookOpen className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Welcome to Chat-with-PDF!</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">Select or create a chat to start analyzing your PDF documents with AI-powered insights.</p>
          </div>
        ) : (messages.length === 0 && !isLoading) ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-8 rounded-2xl shadow-lg mb-6 max-w-2xl">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-4 rounded-xl shadow-md mb-4 w-fit mx-auto">
                <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">Ready to analyze your document!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Ask me anything about your uploaded PDF. I can help you find specific information, summarize content, and provide detailed analysis.</p>
              
              {/* Quick start prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {welcomePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(prompt)}
                    className="text-left p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-2">
                      <Quote className="h-4 w-4 text-blue-500 mt-0.5 group-hover:text-blue-600" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{prompt}</span>
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
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2.5 h-fit shadow-md transition-all duration-300 hover:scale-105">
                  <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div className={`transition-all duration-300 hover:scale-[1.01] ${msg.role === 'user' ? 'order-2 max-w-md' : 'max-w-3xl'}`}>
                <div className={`rounded-2xl px-5 py-4 shadow-md transition-all duration-300 hover:shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>div]:mb-2 [&>div>span]:inline-block" dangerouslySetInnerHTML={{ __html: cleanAssistantContent(msg.content) }} />
                </div>
                {/* ...document sources code remains unchanged... */}
              </div>
              {msg.role === 'user' && (
                <div className="bg-slate-200 dark:bg-slate-600 rounded-full p-2.5 h-fit shadow-md transition-all duration-300 hover:scale-105">
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Enhanced typing indicator */}
        {isLoading && messages.length > 0 && (
          <div className="flex gap-4 justify-start animate-fade-in">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full p-2.5 h-fit shadow-md">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">Bro is analyzing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 transition-colors duration-300">
        <div className="flex gap-4 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              onKeyDown={handleKeyPress} 
              placeholder={chatId ? "Ask DocuChat about your document..." : "Please select a chat to begin"} 
              className="h-12 text-base transition-all duration-200 focus:scale-[1.01] bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl shadow-sm focus:shadow-md pr-12" 
              disabled={isLoading || !chatId} 
            />
            {isTyping && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>
          <Button 
            onClick={handleSendChatMessage} 
            disabled={!message.trim() || isLoading || !chatId}
            className="h-12 px-6 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 rounded-xl shadow-md hover:shadow-lg disabled:from-slate-400 disabled:to-slate-500"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Status indicator */}
        {/* {chatId && (
          <div className="flex items-center justify-center mt-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Ready to analyze your document</span>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ChatComponent;
