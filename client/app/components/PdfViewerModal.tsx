'use client';

import * as React from 'react';
import { X, FileText, ExternalLink } from 'lucide-react'; // Added ExternalLink icon
import { Button } from '@/components/ui/button';

interface PdfViewerModalProps {
    url: string;
    name: string;
    onClose: () => void;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ url, name, onClose }) => {
    
    // 1. Construct the Google Docs Viewer URL
    // We encode the PDF URL so Google can read it safely
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

    React.useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!url) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 transition-opacity duration-300">
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-lg shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[300px]" title={name}>
                            {name}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* 2. Added a "Open in New Tab" fallback button just in case */}
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition"
                            title="Open original file"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onClose}
                            className="h-8 w-8 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* 3. The Viewer Area */}
                <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950 relative">
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
