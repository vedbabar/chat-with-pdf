'use client';
import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://chat-with-pdf-back.vercel.app' 
  : 'http://localhost:8000';

interface UploadedFile {
  id: string;
  filename: string;
  createdAt: string;
  chatId: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
  uploadProgress?: number;
  path?: string; 
}

interface FileUploadComponentProps {
  chatId: string | null;
  onChatDelete: () => void;
  onFileUploadSuccess: () => void;
  onViewPdf?: (file: UploadedFile) => void;
}

const handleViewPdf = (file: UploadedFile) => {
    if (!file.path) return;

    // A. Ensure HTTPS
    const secureUrl = file.path.replace("http://", "https://");

    // B. Use Google Docs Viewer
    // This works even if Cloudinary set the file to "force download" (raw)
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(secureUrl)}&embedded=false`;

    // C. Open in new tab
    window.open(googleViewerUrl, '_blank', 'noopener,noreferrer');
  };

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  chatId,
  onChatDelete,
  onFileUploadSuccess,
  onViewPdf
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  const [chatFiles, setChatFiles] = React.useState<Record<string, UploadedFile[]>>({});
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});

  const files = chatId ? (chatFiles[chatId] || []) : [];
  const isLoading = chatId ? (loadingStates[chatId] ?? true) : false;
  const hasFiles = files.length > 0;

  const updateFiles = (chatId: string, serverFiles: UploadedFile[]) => {
    setChatFiles(prev => {
      const currentFiles = prev[chatId] || [];
      const localTempFiles = currentFiles.filter(f => f.id.startsWith('temp-'));
      
      return {
        ...prev,
        [chatId]: [...localTempFiles, ...serverFiles]
      };
    });
  };

  React.useEffect(() => {
    if (!chatId) return;

    const alreadyHasFiles = chatFiles[chatId] && chatFiles[chatId].length > 0;
    
    if (!alreadyHasFiles) {
        setLoadingStates(prev => ({ ...prev, [chatId]: true }));
    }

    const fetchFiles = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/files`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          updateFiles(chatId, data || []);
        }
      } catch (error) {
        if (!alreadyHasFiles) setChatFiles(prev => ({ ...prev, [chatId]: [] }));
      } finally {
        setLoadingStates(prev => ({ ...prev, [chatId]: false }));
      }
    };

    fetchFiles();
  }, [chatId, getToken]);

  React.useEffect(() => {
    if (!chatId) return;

    const pollingInterval = setInterval(async () => {
      const hasActiveFiles = files.some(f => f.status === 'PROCESSING' || f.status === 'PENDING');
      
      if (hasActiveFiles || isUploading) {
        try {
            const token = await getToken();
            const response = await fetch(`${API_BASE_URL}/chats/${chatId}/files`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                updateFiles(chatId, data || []);
            }
        } catch (e) {}
      }
    }, 3000);

    return () => clearInterval(pollingInterval);
  }, [chatId, files, isUploading, getToken]);

  const handleFileUpload = async (file: File) => {
    if (!chatId) return;
    setIsUploading(true);

    const tempId = `temp-${Date.now()}`;
    const tempFile: UploadedFile = {
      id: tempId,
      filename: file.name,
      createdAt: new Date().toISOString(),
      chatId,
      status: 'PROCESSING',
      uploadProgress: 0
    };

    setChatFiles(prev => ({
      ...prev,
      [chatId]: [tempFile, ...(prev[chatId] || [])]
    }));

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 10, 90);
      setChatFiles(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(f =>
          f.id === tempId ? { ...f, uploadProgress: progress } : f
        )
      }));
    }, 400);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const uploadedFile = await response.json();
        
        setChatFiles(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map(f => 
            f.id === tempId 
              ? { ...uploadedFile.file, uploadProgress: 100 }
              : f
          )
        }));

        onFileUploadSuccess();
        
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      
      setChatFiles(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(f =>
          f.id === tempId 
            ? { ...f, status: 'ERROR', uploadProgress: 0 }
            : f
        )
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(handleFileUpload);
    }
  };

  const handleDeleteFile = async (file: UploadedFile) => {
    if (!file.id || !window.confirm(`Delete "${file.filename}"?`)) {
      return;
    }

    setChatFiles(prev => ({
        ...prev,
        [chatId!]: (prev[chatId!] || []).filter(f => f.id !== file.id)
    }));

    try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/files/${file.id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
             // throw new Error("Deletion failed"); 
        }
        onFileUploadSuccess(); 
        
    } catch (error) {
        console.error('Failed to delete file:', error);
        setChatFiles(prev => ({
            ...prev,
            [file.chatId]: [file, ...(prev[file.chatId] || [])]
        }));
        alert(`Failed to delete file. Please try again.`);
    }
  };

  const handleDeleteChat = async () => {
    if (!chatId || !window.confirm("Delete this chat and all files?")) {
      return;
    }
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setChatFiles(prev => ({ ...prev, [chatId]: [] }));
        onChatDelete();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const getStatusIcon = (status: UploadedFile['status'], isAnimated = false) => {
    switch (status) {
      case 'PROCESSING':
        return <Loader2 className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${isAnimated ? 'animate-spin' : ''}`} />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'DONE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <Loader2 className="h-4 w-4 text-slate-400 animate-pulse" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'PROCESSING':
        return <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Processing</span>;
      case 'ERROR':
        return <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">Error</span>;
      case 'DONE':
        return <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">Ready</span>;
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400">Pending</span>;
      default:
        return null;
    }
  };

  const readyFiles = files.filter(f => f.status === 'DONE').length;
  const totalFiles = files.length;

  if (isLoading && chatId && !hasFiles) {
    return (
      <div className="h-full p-4 animate-pulse bg-white dark:bg-slate-950">
        <div className="space-y-4">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 bg-white dark:bg-slate-950 transition-colors duration-200">
      <div className="h-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-900 dark:bg-white">
                <FileText className="h-5 w-5 text-white dark:text-slate-900" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Documents</h2>
                {totalFiles > 0 && (
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {readyFiles}/{totalFiles} ready
                  </span>
                )}
              </div>
            </div>
            {chatId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteChat}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                <Trash2 className="h-3 w-3" />
                Delete Chat
              </Button>
            )}
          </div>
        </div>

        {/* Upload Card */}
        <div className="p-4">
          <div
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (chatId && !isUploading) {
                Array.from(e.dataTransfer.files).forEach(handleFileUpload);
              }
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={chatId && !isUploading ? handleFileUploadButtonClick : undefined}
            className={`
              relative p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer
              ${isDragOver && chatId && !isUploading
                ? 'border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }
              ${!chatId || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="file"
              accept="application/pdf"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={!chatId || isUploading}
            />
            <div className="flex items-center gap-4">
              <div className={`
                relative p-3 rounded-xl transition-all
                ${isDragOver && chatId
                  ? 'bg-slate-900 dark:bg-white scale-110'
                  : 'bg-slate-100 dark:bg-slate-800 group-hover:scale-105'
                }
              `}>
                <Upload className={`h-6 w-6 ${isDragOver && chatId ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {!chatId
                    ? 'Select a Chat First'
                    : isUploading
                      ? 'Uploading Files...'
                      : 'Upload Documents'
                  }
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {chatId ? 'PDF files • Drag & drop or click' : 'Choose an active chat first'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          {totalFiles > 0 ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 px-1">
                {readyFiles} of {totalFiles} files ready for chat
              </div>
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="group p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(file.status, true)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={file.filename}>
                            {file.filename}
                        </span>
                        
                        <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                            {file.status === 'DONE' && file.path && (
                                <button
                                  type="button"
                                  onClick={() => handleViewPdf(file)}
                                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                  title="View PDF"
                              >
                                  <Eye className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteFile(file)}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                              title="Delete File"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(file.status)}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {file.status === 'PROCESSING' && file.uploadProgress !== undefined && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
                            <span className="text-slate-900 dark:text-white font-bold">{Math.round(file.uploadProgress)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-slate-900 dark:bg-white transition-all duration-500 rounded-full"
                              style={{ width: `${file.uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {chatId ? "No documents uploaded yet" : "Select a chat to view files"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {chatId && "Upload your first PDF to get started"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadComponent;
