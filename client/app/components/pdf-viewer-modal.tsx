'use client';

import * as React from 'react';
import { X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfViewerModalProps {
    /** The Cloudinary URL with the 'fl_inline' flag applied. */
    url: string;
    /** The filename to display in the header. */
    name: string;
    /** Function to close the modal and clear the viewer state. */
    onClose: () => void;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ url, name, onClose }) => {
    // Basic handler for the Escape key to close the modal
    React.useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!url) return null;

    return (
        // 1. Modal Overlay (Fixed to screen)
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 transition-opacity duration-300">
            
            {/* 2. Modal Container */}
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-lg shadow-2xl flex flex-col overflow-hidden">
                
                {/* 3. Header/Toolbar */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate" title={name}>
                            Viewing: {name}
                        </h2>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose}
                        className="h-8 w-8 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                        aria-label="Close viewer"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* 4. PDF Viewer Area */}
                <div className="flex-1 overflow-hidden">
                    {/* The iframe uses the browser's native PDF viewing capability */}
                    <iframe 
                        src={url} 
                        title={name}
                        className="w-full h-full border-0"
                        // Sandbox might be necessary in some secure environments, 
                        // but can restrict viewer controls. Omit unless necessary.
                        // sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                </div>
            </div>
        </div>
    );
};

export default PdfViewerModal;