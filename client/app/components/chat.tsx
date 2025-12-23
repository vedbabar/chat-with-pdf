'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { Send, FileText, User, Bot, ChevronDown, BookOpen, Quote } from 'lucide-react';
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
  cleaned = cleaned.replace(/\b(page \d+|section \d+|chapter \d+)/gi, '<span class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-sm font-medium">$1</span>');
  cleaned = cleaned.replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-2"><span class="text-slate-900 dark:text-white mt-1">•</span><span>$1</span></div>');
  
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
      <div className="flex flex-col h-full bg-white dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-lg">
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
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 animate-pulse">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="flex-1 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 transition-all duration-300">
      {/* Clean Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-slate-900 dark:bg-white">
              <BookOpen className="h-5 w-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Chat-with-PDF
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI Document Assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
        {!chatId ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="relative mb-8">
              <div className="relative bg-slate-100 dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
                <BookOpen className="h-20 w-20 text-slate-900 dark:text-white mx-auto" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Welcome to Chat-with-PDF
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md text-lg">
              Select or create a chat to start analyzing your PDF documents
            </p>
          </div>
        ) : (messages.length === 0 && !isLoading) ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-lg">
              <div className="relative mb-6 w-fit mx-auto">
                <div className="relative bg-slate-900 dark:bg-white p-5 rounded-xl shadow-lg">
                  <Bot className="h-10 w-10 text-white dark:text-slate-900" />
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
                    className="text-left p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Quote className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
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
              className={`flex gap-4 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-3 shadow-sm">
                    <Bot className="h-5 w-5 text-slate-900 dark:text-white" />
                  </div>
                </div>
              )}
              <div className={`${msg.role === 'user' ? 'order-2 max-w-md' : 'max-w-3xl'}`}>
                <div className={`rounded-lg px-5 py-4 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
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
                      className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-white mb-2 transition"
                    >
                      <ChevronDown className={`h-4 w-4 transform transition ${expandedDocs[index] ? 'rotate-180' : ''}`} />
                      <span>
                        {expandedDocs[index] ? 'Hide' : 'View'} {msg.documents.length} Source{msg.documents.length > 1 ? 's' : ''}
                      </span>
                    </button>
                    
                    {expandedDocs[index] && (
                      <div className="grid gap-2">
                        {msg.documents.map((doc, docIndex) => (
                          <div key={docIndex} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                            <div className="flex items-center gap-2 mb-2 font-semibold text-slate-900 dark:text-white">
                              <FileText className="h-4 w-4" />
                              <span>{formatSourceName(doc.metadata?.source)}</span>
                              {doc.metadata?.loc?.pageNumber && (
                                <span className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                                  Page {doc.metadata.loc.pageNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 italic pl-4 border-l-2 border-slate-300 dark:border-slate-600">
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
                <div className="flex-shrink-0">
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-full p-3 shadow-sm">
                    <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
          <div className="flex gap-4 justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-3 h-fit shadow-sm">
              <Bot className="h-5 w-5 text-slate-900 dark:text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Clean Input Area */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors duration-300">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              onKeyDown={handleKeyPress} 
              placeholder={chatId ? "Ask anything about your document..." : "Select a chat to begin"} 
              className="h-12 text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg focus:border-slate-900 dark:focus:border-white transition-all outline-none" 
              disabled={isLoading || !chatId} 
            />
            {isTyping && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 dark:border-white border-t-transparent"></div>
              </div>
            )}
          </div>
          <Button 
            onClick={handleSendChatMessage} 
            disabled={!message.trim() || isLoading || !chatId}
            className="h-12 w-12 p-0 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
