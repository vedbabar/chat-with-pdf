'use client';
import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import PdfViewerModal from './PdfViewerModal';

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

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  chatId,
  onChatDelete,
  onFileUploadSuccess,
  onViewPdf
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [pdfToView, setPdfToView] = React.useState<{ url: string; name: string } | null>(null);

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
      return { ...prev, [chatId]: [...localTempFiles, ...serverFiles] };
    });
  };

  React.useEffect(() => {
    if (!chatId) return;
    const alreadyHasFiles = chatFiles[chatId] && chatFiles[chatId].length > 0;
    if (!alreadyHasFiles) setLoadingStates(prev => ({ ...prev, [chatId]: true }));

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

    setChatFiles(prev => ({ ...prev, [chatId]: [tempFile, ...(prev[chatId] || [])] }));

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 10, 90);
      setChatFiles(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(f => f.id === tempId ? { ...f, uploadProgress: progress } : f)
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
          [chatId]: (prev[chatId] || []).map(f => f.id === tempId ? { ...uploadedFile.file, uploadProgress: 100 } : f)
        }));
        onFileUploadSuccess();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setChatFiles(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(f => f.id === tempId ? { ...f, status: 'ERROR', uploadProgress: 0 } : f)
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(handleFileUpload);
    }
  };

  const handleDeleteFile = async (file: UploadedFile) => {
    if (!file.id || !window.confirm(`Delete "${file.filename}"?`)) return;

    setChatFiles(prev => ({ ...prev, [chatId!]: (prev[chatId!] || []).filter(f => f.id !== file.id) }));

    try {
      const token = await getToken();
      await fetch(`${API_BASE_URL}/files/${file.id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onFileUploadSuccess(); 
    } catch (error) {
      console.error('Failed to delete file:', error);
      setChatFiles(prev => ({ ...prev, [file.chatId]: [file, ...(prev[file.chatId] || [])] }));
    }
  };

  const handleDeleteChat = async () => {
    if (!chatId || !window.confirm("Delete this chat and all files?")) return;
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

  const getStatusIndicator = (status: UploadedFile['status']) => {
    switch (status) {
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-white/40 animate-spin" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'DONE':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      default:
        return <FileText className="h-4 w-4 text-white/40" />;
    }
  };

  const readyFiles = files.filter(f => f.status === 'DONE').length;

  if (isLoading && chatId && !hasFiles) {
    return (
      <div className="h-full flex items-center justify-center bg-[#171717]">
        <Loader2 className="h-5 w-5 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#171717]">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-white/60" />
            <span className="text-sm font-medium text-white">Documents</span>
            {files.length > 0 && (
              <span className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                {readyFiles}/{files.length}
              </span>
            )}
          </div>
          {chatId && (
            <button
              onClick={handleDeleteChat}
              className="text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              Delete chat
            </button>
          )}
        </div>
      </div>

      {/* Upload Area */}
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
          onClick={() => chatId && !isUploading && fileInputRef.current?.click()}
          className={`
            p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all
            ${isDragOver && chatId && !isUploading
              ? 'border-white/30 bg-white/5'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }
            ${!chatId || isUploading ? 'opacity-40 cursor-not-allowed' : ''}
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
          <div className="text-center">
            <Upload className={`h-6 w-6 mx-auto mb-2 ${isDragOver ? 'text-white' : 'text-white/40'}`} />
            <p className="text-sm text-white/60">
              {!chatId ? 'Select a chat first' : isUploading ? 'Uploading...' : 'Drop PDF here or click'}
            </p>
            <p className="text-xs text-white/30 mt-1">PDF files only</p>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="group p-3 bg-[#2f2f2f]/50 border border-white/5 rounded-lg hover:bg-[#2f2f2f] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getStatusIndicator(file.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium" title={file.filename}>
                      {file.filename}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                    
                    {file.status === 'PROCESSING' && file.uploadProgress !== undefined && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white/60 transition-all duration-300 rounded-full"
                            style={{ width: `${file.uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.status === 'DONE' && file.path && (
                      <button
                        onClick={() => setPdfToView({ url: file.path!, name: file.filename })}
                        className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                        title="View PDF"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFile(file)}
                      className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-white/10 mb-3" />
            <p className="text-sm text-white/40">
              {chatId ? "No documents uploaded yet" : "Select a chat to upload documents"}
            </p>
          </div>
        )}
      </div>

      {pdfToView && (
        <PdfViewerModal
          url={pdfToView.url}
          name={pdfToView.name}
          onClose={() => setPdfToView(null)}
        />
      )}
    </div>
  );
};

export default FileUploadComponent;
