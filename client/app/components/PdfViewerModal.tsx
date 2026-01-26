'use client';

import * as React from 'react';
import { X, FileText, ExternalLink, Download } from 'lucide-react';

interface PdfViewerModalProps {
    url: string;
    name: string;
    onClose: () => void;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ url, name, onClose }) => {
    
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

    React.useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    if (!url) return null;

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="relative w-full h-full max-w-5xl max-h-[90vh] bg-[#171717] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#212121]">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4 text-white/70" />
                        </div>
                        <h2 className="text-sm font-medium text-white truncate" title={name}>
                            {name}
                        </h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <a 
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            title="Open in new tab"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                        <a 
                            href={url}
                            download={name}
                            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            title="Download"
                        >
                            <Download className="h-4 w-4" />
                        </a>
                        <button 
                            onClick={onClose}
                            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-1"
                            title="Close (Esc)"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Viewer Area */}
                <div className="flex-1 overflow-hidden bg-[#0a0a0a] relative">
                    <iframe 
                        src={viewerUrl} 
                        className="w-full h-full border-0"
                        title={name}
                        loading="lazy"
                    />
                </div>
            </div>
        </div>
    );
};

export default PdfViewerModal;
