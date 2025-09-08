'use client';
import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UploadedFile {
  id: string;
  filename: string;
  createdAt: string;
  chatId: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
  uploadProgress?: number;
}

interface FileUploadComponentProps {
  chatId: string | null;
  onChatDelete: () => void;
  onFileUploadSuccess: () => void;
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  chatId,
  onChatDelete,
  onFileUploadSuccess,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  // Per-chat file caching system to prevent re-renders
  const [chatFiles, setChatFiles] = React.useState<Record<string, UploadedFile[]>>({});
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});

  // Get files for current chat
  const files = chatId ? (chatFiles[chatId] || []) : [];
  const isLoading = chatId ? (loadingStates[chatId] ?? true) : false;

  // Fetch files only when switching to a new chat that hasn't been loaded
  React.useEffect(() => {
    if (!chatId) return;

    // If we already have files for this chat, don't refetch
    if (chatFiles[chatId]) {
      return;
    }

    // Set loading for this specific chat
    setLoadingStates(prev => ({ ...prev, [chatId]: true }));

    const fetchFiles = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`http://localhost:8000/chats/${chatId}/files`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setChatFiles(prev => ({ ...prev, [chatId]: data || [] }));
        } else {
          setChatFiles(prev => ({ ...prev, [chatId]: [] }));
        }
      } catch (error) {
        setChatFiles(prev => ({ ...prev, [chatId]: [] }));
      } finally {
        setLoadingStates(prev => ({ ...prev, [chatId]: false }));
      }
    };

    fetchFiles();
  }, [chatId, getToken]);

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

    // Add temp file to specific chat
    setChatFiles(prev => ({
      ...prev,
      [chatId]: [tempFile, ...(prev[chatId] || [])]
    }));

    // Progress simulation
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + Math.random() * 25, 95);
      setChatFiles(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(f =>
          f.id === tempId ? { ...f, uploadProgress: progress } : f
        )
      }));
    }, 300);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch(`http://localhost:8000/chats/${chatId}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const uploadedFile = await response.json();
        
        // Replace temp file with real file data in specific chat
        setChatFiles(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map(f => 
            f.id === tempId 
              ? { ...uploadedFile.file, uploadProgress: 100 }
              : f
          )
        }));

        // Clear progress after a short delay
        setTimeout(() => {
          setChatFiles(prev => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map(f => ({
              ...f,
              uploadProgress: undefined
            }))
          }));
        }, 1000);

        onFileUploadSuccess();

        // <-- Add this block to re-fetch file status after 7 seconds
        setTimeout(async () => {
          try {
            const token = await getToken();
            const statusRes = await fetch(`http://localhost:8000/chats/${chatId}/files`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statusRes.ok) {
              const data = await statusRes.json();
              setChatFiles(prev => ({
                ...prev,
                [chatId]: data || []
              }));
            }
          } catch (e) {
            // Optionally handle error
          }
        }, 8000);
        
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      
      // Mark temp file as error in specific chat
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

  const removeFile = (fileId: string) => {
    if (!chatId) return;
    setChatFiles(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).filter(f => f.id !== fileId)
    }));
  };

  const handleDeleteChat = async () => {
    if (!chatId || !window.confirm("This will delete the entire chat and all its files. Are you sure?")) {
      return;
    }
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:8000/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        // Clear files for this chat
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
        return <Loader2 className={`h-4 w-4 text-blue-500 ${isAnimated ? 'animate-spin' : ''}`} />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'DONE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <Loader2 className="h-4 w-4 text-slate-400 animate-pulse" />;
      default:
        return <File className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'PROCESSING':
        return <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 animate-pulse">Processing</Badge>;
      case 'ERROR':
        return <Badge variant="destructive" className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">Error</Badge>;
      case 'DONE':
        return <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">Ready</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="border-slate-300 dark:border-slate-600">Pending</Badge>;
      default:
        return null;
    }
  };

  const readyFiles = files.filter(f => f.status === 'DONE').length;
  const totalFiles = files.length;

  if (isLoading && chatId) {
    return (
      <div className="h-full p-4 animate-pulse">
        <div className="space-y-4">
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">Documents</h2>
              {totalFiles > 0 && (
                <Badge variant="secondary" className="ml-2 transition-all duration-300 hover:scale-105 bg-slate-200 dark:bg-slate-700">
                  {readyFiles}/{totalFiles}
                </Badge>
              )}
            </div>
            {chatId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteChat}
                className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 h-8 px-2 transition-all duration-200 hover:scale-105"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Upload Card */}
        <div className="p-4">
          <Card
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
              p-4 border-2 border-dashed transition-all duration-300 cursor-pointer relative overflow-hidden
              ${isDragOver && chatId && !isUploading
                ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.02] shadow-lg'
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
              }
              ${!chatId || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}
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
                p-3 rounded-full transition-all duration-300
                ${isDragOver && chatId
                  ? 'bg-blue-600 dark:bg-blue-500 text-white scale-110'
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                }
              `}>
                <Upload className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {!chatId
                    ? 'Select a Chat First'
                    : isUploading
                      ? 'Uploading Files...'
                      : 'Upload Documents'
                  }
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {chatId ? 'PDF files • Drag & drop or click to browse' : 'Choose an active chat to upload files'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Files List */}
        <div className="max-h-96 overflow-y-auto px-4 pb-4">
          {totalFiles > 0 ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 px-1 animate-fade-in">
                {readyFiles} of {totalFiles} files ready for chat
              </div>
              {files.map((file, index) => (
                <Card
                  key={file.id}
                  className="p-3 transition-all duration-300 hover:shadow-md animate-fade-in group hover:scale-[1.02] bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(file.status, true)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={`http://localhost:8000/files/${file.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium truncate text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {file.filename}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:scale-110"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(file.status)}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Enhanced Progress Bar */}
                  {file.status === 'PROCESSING' && file.uploadProgress !== undefined && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Uploading...</span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">{Math.round(file.uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-400 transition-all duration-500 ease-out"
                          style={{
                            width: `${file.uploadProgress}%`,
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-all duration-300 hover:scale-105">
                <FileText className="h-6 w-6 text-slate-400 dark:text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {chatId ? "No documents uploaded yet" : "Select a chat to view files"}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
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