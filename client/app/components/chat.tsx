'use client';

import { Button } from '@/components/ui/button';
import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { Send, FileText, User, Bot, ChevronDown, ThumbsUp, ThumbsDown, Copy, RotateCcw } from 'lucide-react';

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
  let cleaned = content.replace(/```[\s\S]*?```/g, match => match.replace(/```[\w]*\n?/, '').replace(/```$/, ''));
  cleaned = cleaned.replace(/<\/?html>/gi, '');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/\b(page \d+|section \d+|chapter \d+)/gi, '<span class="bg-white/10 px-1 py-0.5 rounded text-xs">$1</span>');
  cleaned = cleaned.replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-white/40">•</span><span>$1</span></div>');
  return cleaned.trim();
}

const ChatComponent: React.FC<ChatComponentProps> = ({ chatId, isLoading: externalLoading = false }) => {
  const [message, setMessage] = React.useState<string>('');
  const [messageCache, setMessageCache] = React.useState<Record<string, IMessage[]>>({});
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});
  
  const messages = (chatId ? messageCache[chatId] : []) || [];
  const isFetchingHistory = chatId ? (loadingStates[chatId] ?? true) : false;
  const hasMessages = messages.length > 0;

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [expandedDocs, setExpandedDocs] = React.useState<Record<number, boolean>>({});
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();

  React.useEffect(() => {
    if (chatId) setExpandedDocs({});
  }, [chatId]);

  React.useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;
      const inCache = messageCache[chatId] && messageCache[chatId].length > 0;
      if (!inCache) setLoadingStates(prev => ({ ...prev, [chatId]: true }));
      
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMessageCache(prev => ({ ...prev, [chatId]: data }));
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoadingStates(prev => ({ ...prev, [chatId]: false }));
      }
    };
    if (chatId && !externalLoading) fetchMessages();
  }, [chatId, getToken, externalLoading]);

  React.useEffect(() => {
    if (messages.length > 0 || chatId) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
    }
  }, [messages, chatId]);

  const updateCurrentChatMessages = (updater: (msgs: IMessage[]) => IMessage[]) => {
    if (!chatId) return;
    setMessageCache(prev => ({ ...prev, [chatId]: updater([...(prev[chatId] || [])]) }));
  };

  const handleSendChatMessage = async () => {
    if (!message.trim() || !chatId) return;
    const userMessage: IMessage = { role: 'user', content: message };
    updateCurrentChatMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsGenerating(true);
    setIsTyping(true);

    try {
      const token = await getToken();
      const assistantMessageId = Date.now().toString();
      updateCurrentChatMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '', documents: [] }]);

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
                updateCurrentChatMessages(prev => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg.role === 'assistant') lastMsg.documents = assistantDocs;
                  return prev;
                });
              }
              if (data.type === 'token') {
                assistantContent += data.text;
                setIsTyping(false);
                updateCurrentChatMessages(prev => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg.role === 'assistant') lastMsg.content = assistantContent;
                  return prev;
                });
              }
              if (data.type === 'error') throw new Error(data.message);
            } catch (e) {
              console.error("Error parsing chunk", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      updateCurrentChatMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && !prev[prev.length - 1].content) {
          prev.pop();
        }
        prev.push({ role: 'assistant', content: '<span class="text-red-400">Sorry, something went wrong. Please try again.</span>' });
        return prev;
      });
    } finally {
      setIsGenerating(false);
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
    return filename.length > 20 ? `${filename.substring(0, 20)}...` : filename;
  };

  const welcomePrompts = [
    "Summarize this document",
    "What are the key points?",
    "Find important dates",
    "Explain the main concepts"
  ];

  if (externalLoading || (isFetchingHistory && !hasMessages)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#212121]">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#212121] min-h-0 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {!chatId ? (
            <div className="flex flex-col items-center justify-center h-full text-center pt-20">
              <h2 className="text-2xl font-medium text-white mb-2">What can I help with?</h2>
              <p className="text-white/50">Select a chat to start</p>
            </div>
          ) : (messages.length === 0 && !isGenerating) ? (
            <div className="flex flex-col items-center justify-center pt-20">
              <h2 className="text-2xl font-medium text-white mb-8">What can I help with?</h2>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {welcomePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(prompt)}
                    className="px-4 py-2.5 text-sm text-white/80 bg-[#2f2f2f] hover:bg-[#3f3f3f] rounded-full transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div key={msg.id || `${chatId}-${index}`} className="group">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end mb-4">
                      <div className="max-w-[70%] bg-[#2f2f2f] rounded-3xl px-5 py-3">
                        <p className="text-white text-[15px]">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 bg-[#ab68ff] rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {msg.content ? (
                          <>
                            <div 
                              className="text-[15px] text-white/90 leading-relaxed prose prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: cleanAssistantContent(msg.content) }} 
                            />
                            {/* Action buttons - ChatGPT style */}
                            <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <Copy className="h-4 w-4 text-white/50" />
                              </button>
                              <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <ThumbsUp className="h-4 w-4 text-white/50" />
                              </button>
                              <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <ThumbsDown className="h-4 w-4 text-white/50" />
                              </button>
                              <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <RotateCcw className="h-4 w-4 text-white/50" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                            </div>
                          </div>
                        )}
                        
                        {msg.documents && msg.documents.length > 0 && (
                          <div className="mt-3">
                            <button 
                              onClick={() => toggleDocExpansion(index)}
                              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                            >
                              <ChevronDown className={`h-3 w-3 transition-transform ${expandedDocs[index] ? 'rotate-180' : ''}`} />
                              {msg.documents.length} source{msg.documents.length > 1 ? 's' : ''}
                            </button>
                            
                            {expandedDocs[index] && (
                              <div className="mt-2 space-y-2">
                                {msg.documents.map((doc, docIndex) => (
                                  <div key={docIndex} className="bg-[#2f2f2f] p-3 rounded-lg text-xs">
                                    <div className="flex items-center gap-2 mb-1 text-white/70">
                                      <FileText className="h-3 w-3" />
                                      <span>{formatSourceName(doc.metadata?.source)}</span>
                                      {doc.metadata?.loc?.pageNumber && (
                                        <span className="text-white/40">p.{doc.metadata.loc.pageNumber}</span>
                                      )}
                                    </div>
                                    <p className="text-white/50 leading-relaxed">
                                      {doc.pageContent ? (doc.pageContent.length > 100 ? doc.pageContent.substring(0, 100) + '...' : doc.pageContent) : 'No preview'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-[#2f2f2f] rounded-3xl">
            <div className="flex items-end p-2">
              <button className="p-2 text-white/50 hover:text-white/70 transition-colors">
                <span className="text-lg">+</span>
              </button>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChatMessage();
                  }
                }}
                placeholder="Ask anything"
                rows={1}
                className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/40 resize-none outline-none px-2 py-2 max-h-32"
                disabled={isGenerating || !chatId}
                style={{ minHeight: '24px' }}
              />
              <button 
                onClick={handleSendChatMessage} 
                disabled={!message.trim() || isGenerating || !chatId}
                className="p-2 text-white/50 hover:text-white transition-colors disabled:opacity-30"
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <Send className="h-4 w-4 text-[#212121]" />
                  </div>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-white/30 text-center mt-2">
            ChatPDF can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
