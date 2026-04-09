import React, { useState } from 'react';
import { FileIcon, Download, Eye, X, FileText, Image, File } from 'lucide-react';
import { filesApi } from '../services/api';

interface FileViewerProps {
  fileId?: string;
  fileName?: string;
  fileType?: string;
  title?: string;
  onClose?: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ 
  fileId, 
  fileName = 'Document', 
  fileType,
  title,
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!fileId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <File className="h-12 w-12 mb-2" />
        <p>No file available</p>
      </div>
    );
  }

  const handleView = () => {
    setIsLoading(true);
    filesApi.viewFile(fileId);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleDownload = () => {
    filesApi.downloadFile(fileId, fileName);
  };

  const getFileIcon = () => {
    if (fileType?.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    }
    if (fileType?.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <FileIcon className="h-8 w-8 text-gray-500" />;
  };

  // For images, show preview
  const isImage = fileType?.startsWith('image/');
  const fileUrl = filesApi.getFileUrl(fileId);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {onClose && (
        <div className="flex justify-end mb-2">
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      )}

      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </p>
          {fileType && (
            <p className="text-xs text-gray-500 mt-1">
              {fileType}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleView}
            disabled={isLoading}
            className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            {isLoading ? 'Opening...' : 'View'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </button>
        </div>
      </div>

      {/* Image Preview */}
      {isImage && fileUrl && (
        <div className="mt-4 border rounded-lg overflow-hidden">
          <img 
            src={fileUrl} 
            alt={fileName}
            className="w-full max-h-64 object-contain"
            loading="lazy"
          />
        </div>
      )}

      {/* PDF Preview iframe */}
      {!isImage && fileType?.includes('pdf') && fileUrl && (
        <div className="mt-4 border rounded-lg overflow-hidden">
          <iframe
            src={fileUrl}
            title={fileName}
            className="w-full h-96"
          />
        </div>
      )}
    </div>
  );
};

export default FileViewer;
