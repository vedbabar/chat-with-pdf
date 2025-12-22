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

const getInlineViewUrl = (pdfUrl: string): string => {
    if (!pdfUrl) return '';
    const parts = pdfUrl.split('/upload/');
    if (parts.length === 2 && parts[1]) {
        return parts[0] + '/upload/fl_inline/' + parts[1];
    }
    return pdfUrl;
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
        return <Loader2 className={`h-4 w-4 text-blue-500 ${isAnimated ? 'animate-spin' : ''}`} />;
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
        return <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 animate-pulse">Processing</span>;
      case 'ERROR':
        return <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">Error</span>;
      case 'DONE':
        return <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">Ready</span>;
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
      <div className="h-full p-4 animate-pulse bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="space-y-4">
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <div className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden flex flex-col transition-colors duration-200">
        {/* Header */}
        <div className="relative p-5 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all transform hover:scale-105"
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
              relative p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden group
              ${isDragOver && chatId && !isUploading
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02] shadow-lg'
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
                relative p-4 rounded-2xl transition-all
                ${isDragOver && chatId
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 scale-110'
                  : 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 group-hover:scale-105'
                }
              `}>
                <Upload className={`h-6 w-6 ${isDragOver && chatId ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
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
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {totalFiles > 0 ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 px-1 animate-fade-in">
                {readyFiles} of {totalFiles} files ready for chat
              </div>
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="group p-4 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                  style={{ animationDelay: `${index * 100}ms` }}
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
                                <a
                                    href={getInlineViewUrl(file.path)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition transform hover:scale-110"
                                    title="View PDF"
                                >
                                    <Eye className="h-4 w-4" />
                                </a>
                            )}
                            
                            <button
                              onClick={() => handleDeleteFile(file)}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition transform hover:scale-110"
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
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{Math.round(file.uploadProgress)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 rounded-full"
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
            <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center transform hover:scale-105 transition">
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










// 'use client';
// import * as React from 'react';
// import { useAuth } from '@clerk/nextjs';
// import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, File, X, Eye } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';

// // ⭐ DEFINE API URL BASED ON ENVIRONMENT
// const API_BASE_URL = process.env.NODE_ENV === 'production' 
//   ? 'https://chat-with-pdf-back.vercel.app' 
//   : 'http://localhost:8000';

// interface UploadedFile {
//   id: string;
//   filename: string;
//   createdAt: string;
//   chatId: string;
//   status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
//   uploadProgress?: number;
//   path?: string; 
// }

// interface FileUploadComponentProps {
//   chatId: string | null;
//   onChatDelete: () => void;
//   onFileUploadSuccess: () => void;
//   onViewPdf?: (file: UploadedFile) => void;
// }

// // ⭐ HELPER FUNCTION: Generates the Cloudinary URL with the inline flag
// const getInlineViewUrl = (pdfUrl: string): string => {
//     if (!pdfUrl) return '';
//     const parts = pdfUrl.split('/upload/');
//     if (parts.length === 2 && parts[1]) {
//         return parts[0] + '/upload/fl_inline/' + parts[1];
//     }
//     return pdfUrl;
// };

// const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
//   chatId,
//   onChatDelete,
//   onFileUploadSuccess,
//   onViewPdf
// }) => {
//   const [isDragOver, setIsDragOver] = React.useState(false);
//   const [isUploading, setIsUploading] = React.useState(false);
//   const fileInputRef = React.useRef<HTMLInputElement>(null);
//   const { getToken } = useAuth();

//   // Per-chat file caching system to prevent re-renders
//   const [chatFiles, setChatFiles] = React.useState<Record<string, UploadedFile[]>>({});
//   const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});

//   // Get files for current chat
//   const files = chatId ? (chatFiles[chatId] || []) : [];
//   const isLoading = chatId ? (loadingStates[chatId] ?? true) : false;
  
//   // ⭐ Helper to check if we actually have data to show (FIXED)
//   const hasFiles = files.length > 0;

//   // ⭐ Helper to merge server data with local temp files (FIXED)
//   const updateFiles = (chatId: string, serverFiles: UploadedFile[]) => {
//     setChatFiles(prev => {
//       const currentFiles = prev[chatId] || [];
//       // Keep local temp files that haven't finished uploading
//       const localTempFiles = currentFiles.filter(f => f.id.startsWith('temp-'));
      
//       return {
//         ...prev,
//         [chatId]: [...localTempFiles, ...serverFiles]
//       };
//     });
//   };

//   // Fetch files only when switching to a new chat that hasn't been loaded
//   React.useEffect(() => {
//     if (!chatId) return;

//     // ⭐ FIX 1: Don't show loading spinner if we already have files (Silent Update)
//     const alreadyHasFiles = chatFiles[chatId] && chatFiles[chatId].length > 0;
    
//     if (!alreadyHasFiles) {
//         setLoadingStates(prev => ({ ...prev, [chatId]: true }));
//     }

//     const fetchFiles = async () => {
//       try {
//         const token = await getToken();
//         // ⭐ UPDATED URL
//         const response = await fetch(`${API_BASE_URL}/chats/${chatId}/files`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         });
//         if (response.ok) {
//           const data = await response.json();
//           // ⭐ USE SMART UPDATE
//           updateFiles(chatId, data || []);
//         }
//       } catch (error) {
//         // Only clear files if it was a hard error on initial load
//         if (!alreadyHasFiles) setChatFiles(prev => ({ ...prev, [chatId]: [] }));
//       } finally {
//         setLoadingStates(prev => ({ ...prev, [chatId]: false }));
//       }
//     };

//     fetchFiles();
//   }, [chatId, getToken]); // Removed chatFiles from dependency array to prevent loop

//   // Poll for file status updates (Worker completion)
//   React.useEffect(() => {
//     if (!chatId) return;

//     const pollingInterval = setInterval(async () => {
//       // Poll if we have active files OR if uploading (to see when server acknowledges it)
//       const hasActiveFiles = files.some(f => f.status === 'PROCESSING' || f.status === 'PENDING');
      
//       if (hasActiveFiles || isUploading) {
//         try {
//             const token = await getToken();
//             const response = await fetch(`${API_BASE_URL}/chats/${chatId}/files`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (response.ok) {
//                 const data = await response.json();
//                 // ⭐ USE SMART UPDATE HERE TOO
//                 updateFiles(chatId, data || []);
//             }
//         } catch (e) {}
//       }
//     }, 3000);

//     return () => clearInterval(pollingInterval);
//   }, [chatId, files, isUploading, getToken]);

//   const handleFileUpload = async (file: File) => {
//     if (!chatId) return;
//     setIsUploading(true);

//     const tempId = `temp-${Date.now()}`;
//     const tempFile: UploadedFile = {
//       id: tempId,
//       filename: file.name,
//       createdAt: new Date().toISOString(),
//       chatId,
//       status: 'PROCESSING',
//       uploadProgress: 0
//     };

//     // Add temp file to specific chat
//     setChatFiles(prev => ({
//       ...prev,
//       [chatId]: [tempFile, ...(prev[chatId] || [])]
//     }));

//     // Progress simulation
//     let progress = 0;
//     const progressInterval = setInterval(() => {
//       progress = Math.min(progress + 10, 90); // Faster progress updates
//       setChatFiles(prev => ({
//         ...prev,
//         [chatId]: (prev[chatId] || []).map(f =>
//           f.id === tempId ? { ...f, uploadProgress: progress } : f
//         )
//       }));
//     }, 400);

//     try {
//       const token = await getToken();
//       const formData = new FormData();
//       formData.append('pdf', file);

//       // ⭐ UPDATED URL
//       const response = await fetch(`${API_BASE_URL}/chats/${chatId}/files`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${token}` },
//         body: formData,
//       });

//       clearInterval(progressInterval);

//       if (response.ok) {
//         const uploadedFile = await response.json();
        
//         // Replace temp file with real file data in specific chat
//         setChatFiles(prev => ({
//           ...prev,
//           [chatId]: (prev[chatId] || []).map(f => 
//             f.id === tempId 
//               ? { ...uploadedFile.file, uploadProgress: 100 }
//               : f
//           )
//         }));

//         onFileUploadSuccess();
        
//       } else {
//         throw new Error('Upload failed');
//       }
//     } catch (error) {
//       clearInterval(progressInterval);
      
//       // Mark temp file as error in specific chat
//       setChatFiles(prev => ({
//         ...prev,
//         [chatId]: (prev[chatId] || []).map(f =>
//           f.id === tempId 
//             ? { ...f, status: 'ERROR', uploadProgress: 0 }
//             : f
//         )
//       }));
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const handleFileUploadButtonClick = () => {
//     fileInputRef.current?.click();
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       Array.from(e.target.files).forEach(handleFileUpload);
//     }
//   };

//   const handleDeleteFile = async (file: UploadedFile) => {
//     if (!file.id || !window.confirm(`Are you sure you want to permanently delete the file "${file.filename}"?`)) {
//       return;
//     }

//     // Optimistic removal
//     setChatFiles(prev => ({
//         ...prev,
//         [chatId!]: (prev[chatId!] || []).filter(f => f.id !== file.id)
//     }));

//     try {
//         const token = await getToken();
//         // ⭐ UPDATED URL
//         const response = await fetch(`${API_BASE_URL}/files/${file.id}`, { 
//             method: 'DELETE', 
//             headers: { 'Authorization': `Bearer ${token}` }
//         });

//         if (!response.ok) {
//              // throw new Error("Deletion failed"); 
//         }
//         onFileUploadSuccess(); 
        
//     } catch (error) {
//         console.error('Failed to delete file:', error);
//         setChatFiles(prev => ({
//             ...prev,
//             [file.chatId]: [file, ...(prev[file.chatId] || [])]
//         }));
//         alert(`Failed to delete file. Please try again.`);
//     }
//   };

//   const handleDeleteChat = async () => {
//     if (!chatId || !window.confirm("This will delete the entire chat and all its files. Are you sure?")) {
//       return;
//     }
//     try {
//       const token = await getToken();
//       // ⭐ UPDATED URL
//       const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
//         method: 'DELETE',
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (response.ok) {
//         // Clear files for this chat
//         setChatFiles(prev => ({ ...prev, [chatId]: [] }));
//         onChatDelete();
//       }
//     } catch (error) {
//       console.error('Failed to delete chat:', error);
//     }
//   };

//   const getStatusIcon = (status: UploadedFile['status'], isAnimated = false) => {
//     switch (status) {
//       case 'PROCESSING':
//         return <Loader2 className={`h-4 w-4 text-blue-500 ${isAnimated ? 'animate-spin' : ''}`} />;
//       case 'ERROR':
//         return <AlertCircle className="h-4 w-4 text-red-500" />;
//       case 'DONE':
//         return <CheckCircle className="h-4 w-4 text-green-500" />;
//       case 'PENDING':
//         return <Loader2 className="h-4 w-4 text-slate-400 animate-pulse" />;
//       default:
//         return <File className="h-4 w-4 text-slate-400" />;
//     }
//   };

//   const getStatusBadge = (status: UploadedFile['status']) => {
//     switch (status) {
//       case 'PROCESSING':
//         return <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 animate-pulse">Processing</Badge>;
//       case 'ERROR':
//         return <Badge variant="destructive" className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">Error</Badge>;
//       case 'DONE':
//         return <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">Ready</Badge>;
//       case 'PENDING':
//         return <Badge variant="outline" className="border-slate-300 dark:border-slate-600">Pending</Badge>;
//       default:
//         return null;
//     }
//   };

//   const readyFiles = files.filter(f => f.status === 'DONE').length;
//   const totalFiles = files.length;

//   // ⭐ FIX 2: Only show Skeleton if we have NO files and are loading
//   if (isLoading && chatId && !hasFiles) {
//     return (
//       <div className="h-full p-4 animate-pulse">
//         <div className="space-y-4">
//           <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
//           {[...Array(3)].map((_, i) => (
//             <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-full p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
//       <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
//         {/* Header */}
//         <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center gap-2">
//               <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
//               <h2 className="font-semibold text-slate-800 dark:text-slate-200">Documents</h2>
//               {totalFiles > 0 && (
//                 <Badge variant="secondary" className="ml-2 transition-all duration-300 hover:scale-105 bg-slate-200 dark:bg-slate-700">
//                   {readyFiles}/{totalFiles}
//                 </Badge>
//               )}
//             </div>
//             {chatId && (
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handleDeleteChat}
//                 className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 h-8 px-2 transition-all duration-200 hover:scale-105"
//               >
//                 <Trash2 className="h-3 w-3 mr-1" />
//                 Delete Chat
//               </Button>
//             )}
//           </div>
//         </div>

//         {/* Upload Card */}
//         <div className="p-4">
//           <Card
//             onDrop={(e) => {
//               e.preventDefault();
//               setIsDragOver(false);
//               if (chatId && !isUploading) {
//                 Array.from(e.dataTransfer.files).forEach(handleFileUpload);
//               }
//             }}
//             onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
//             onDragLeave={() => setIsDragOver(false)}
//             onClick={chatId && !isUploading ? handleFileUploadButtonClick : undefined}
//             className={`
//               p-4 border-2 border-dashed transition-all duration-300 cursor-pointer relative overflow-hidden
//               ${isDragOver && chatId && !isUploading
//                 ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.02] shadow-lg'
//                 : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
//               }
//               ${!chatId || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}
//             `}
//           >
//             <input
//               type="file"
//               accept="application/pdf"
//               multiple
//               ref={fileInputRef}
//               onChange={handleFileChange}
//               className="hidden"
//               disabled={!chatId || isUploading}
//             />
//             <div className="flex items-center gap-4">
//               <div className={`
//                 p-3 rounded-full transition-all duration-300
//                 ${isDragOver && chatId
//                   ? 'bg-blue-600 dark:bg-blue-500 text-white scale-110'
//                   : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
//                 }
//               `}>
//                 <Upload className="h-5 w-5" />
//               </div>
//               <div className="flex-1">
//                 <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
//                   {!chatId
//                     ? 'Select a Chat First'
//                     : isUploading
//                       ? 'Uploading Files...'
//                       : 'Upload Documents'
//                   }
//                 </p>
//                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
//                   {chatId ? 'PDF files • Drag & drop or click to browse' : 'Choose an active chat to upload files'}
//                 </p>
//               </div>
//             </div>
//           </Card>
//         </div>

//         {/* Files List */}
//         <div className="max-h-96 overflow-y-auto px-4 pb-4">
//           {totalFiles > 0 ? (
//             <div className="space-y-3">
//               <div className="text-xs text-slate-500 dark:text-slate-400 px-1 animate-fade-in">
//                 {readyFiles} of {totalFiles} files ready for chat
//               </div>
//               {files.map((file, index) => (
//                 <Card
//                   key={file.id}
//                   className="p-3 transition-all duration-300 hover:shadow-md animate-fade-in group hover:scale-[1.02] bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
//                   style={{ animationDelay: `${index * 100}ms` }}
//                 >
//                   <div className="flex items-start gap-3">
//                     <div className="flex-shrink-0 mt-0.5">
//                       {getStatusIcon(file.status, true)}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center justify-between gap-2">
//                         <span className="text-sm font-medium truncate text-slate-800 dark:text-slate-200" title={file.filename}>
//                             {file.filename}
//                         </span>
                        
//                         <div className='flex items-center gap-1'>
//                             {/* ⭐ VIEW PDF BUTTON with INLINE URL */}
//                             {file.status === 'DONE' && file.path && (
//                                 <a
//                                     href={getInlineViewUrl(file.path)}
//                                     target="_blank"
//                                     rel="noopener noreferrer"
//                                     className="h-6 w-6 p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 hover:scale-110"
//                                     title="View PDF"
//                                 >
//                                     <Eye className="h-4 w-4" />
//                                 </a>
//                             )}
                            
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => handleDeleteFile(file)}
//                               className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:scale-110"
//                               title="Delete File"
//                             >
//                               <Trash2 className="h-3 w-3" />
//                             </Button>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2 mt-2">
//                         {getStatusBadge(file.status)}
//                         <span className="text-xs text-slate-500 dark:text-slate-400">
//                           {new Date(file.createdAt).toLocaleDateString()}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                   {/* Enhanced Progress Bar */}
//                   {file.status === 'PROCESSING' && file.uploadProgress !== undefined && (
//                     <div className="mt-3 space-y-1">
//                       <div className="flex items-center justify-between text-xs">
//                         <span className="text-slate-500 dark:text-slate-400">Uploading...</span>
//                         <span className="text-blue-600 dark:text-blue-400 font-medium">{Math.round(file.uploadProgress)}%</span>
//                       </div>
//                       <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
//                         <div
//                           className="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-400 transition-all duration-500 ease-out"
//                           style={{
//                             width: `${file.uploadProgress}%`,
//                             boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
//                           }}
//                         />
//                       </div>
//                     </div>
//                   )}
//                 </Card>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-12 animate-fade-in">
//               <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-all duration-300 hover:scale-105">
//                 <FileText className="h-6 w-6 text-slate-400 dark:text-slate-300" />
//               </div>
//               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
//                 {chatId ? "No documents uploaded yet" : "Select a chat to view files"}
//               </p>
//               <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
//                 {chatId && "Upload your first PDF to get started"}
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FileUploadComponent;
