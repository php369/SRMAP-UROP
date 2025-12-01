import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, ProgressIndicator } from '../ui';
import { cn } from '../../utils/cn';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  preview?: string;
  error?: string;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/zip',
  'text/x-python-script',
  'text/javascript',
  'text/html',
  'text/css',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({
  onFilesChange,
  acceptedTypes = ACCEPTED_TYPES,
  maxFileSize = MAX_FILE_SIZE,
  maxFiles = 5,
  className,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`;
    }
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('text')) return '📄';
    if (fileType.includes('zip')) return '🗜️';
    if (fileType.includes('python')) return '🐍';
    if (fileType.includes('javascript')) return '📜';
    return '📎';
  };

  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const simulateUpload = (fileId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: 100, status: 'completed' as const }
              : f
          ));
          resolve();
        } else {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, progress }
              : f
          ));
        }
      }, 100);

      // Simulate occasional errors
      if (Math.random() < 0.1) {
        setTimeout(() => {
          clearInterval(interval);
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error' as const, error: 'Upload failed. Please try again.' }
              : f
          ));
          reject(new Error('Upload failed'));
        }, 2000);
      }
    });
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    if (disabled) return;

    const newFiles: UploadedFile[] = [];
    const filesToProcess = Array.from(fileList).slice(0, maxFiles - files.length);

    for (const file of filesToProcess) {
      const error = validateFile(file);
      const id = `${Date.now()}-${Math.random()}`;
      const preview = await createPreview(file);

      const uploadedFile: UploadedFile = {
        id,
        file,
        progress: 0,
        status: error ? 'error' : 'uploading',
        preview,
        error: error || undefined,
      };

      newFiles.push(uploadedFile);
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);

    // Start uploads for valid files
    newFiles.forEach(uploadedFile => {
      if (uploadedFile.status === 'uploading') {
        simulateUpload(uploadedFile.id).catch(() => {
          // Error handling is done in simulateUpload
        });
      }
    });
  }, [files, maxFiles, disabled, onFilesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const retryUpload = (fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'uploading', progress: 0, error: undefined }
        : f
    ));
    simulateUpload(fileId).catch(() => {
      // Error handling is done in simulateUpload
    });
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const canAddMore = files.length < maxFiles;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <motion.div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300',
          isDragOver && !disabled
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          !canAddMore && 'opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={!disabled && canAddMore ? { scale: 1.01 } : {}}
        whileTap={!disabled && canAddMore ? { scale: 0.99 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || !canAddMore}
        />

        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-medium text-text mb-2">
              {canAddMore ? 'Drop files here or click to browse' : 'Maximum files reached'}
            </h3>
            <p className="text-sm text-textSecondary">
              {canAddMore ? (
                <>
                  Supports: PDF, Word, Images, Code files<br />
                  Max size: {formatFileSize(maxFileSize)} per file<br />
                  {maxFiles - files.length} of {maxFiles} files remaining
                </>
              ) : (
                `You can upload up to ${maxFiles} files`
              )}
            </p>
          </div>

          {canAddMore && !disabled && (
            <button
              onClick={openFileDialog}
              className="px-6 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Choose Files
            </button>
          )}
        </div>

        {isDragOver && !disabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-primary/10 rounded-xl flex items-center justify-center"
          >
            <div className="text-primary font-medium">Drop files here</div>
          </motion.div>
        )}
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="font-medium text-text">Uploaded Files ({files.length})</h4>
            
            {files.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-surface border border-border rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                        {getFileIcon(uploadedFile.file.type)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-medium text-text truncate">
                        {uploadedFile.file.name}
                      </h5>
                      <Badge
                        variant="glass"
                        className={cn(
                          uploadedFile.status === 'completed' && 'bg-success',
                          uploadedFile.status === 'uploading' && 'bg-info',
                          uploadedFile.status === 'error' && 'bg-error'
                        )}
                      >
                        {uploadedFile.status === 'completed' && '✓ Complete'}
                        {uploadedFile.status === 'uploading' && '⏳ Uploading'}
                        {uploadedFile.status === 'error' && '❌ Error'}
                      </Badge>
                    </div>

                    <p className="text-sm text-textSecondary mb-2">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>

                    {uploadedFile.status === 'uploading' && (
                      <ProgressIndicator
                        value={uploadedFile.progress}
                        showLabel={false}
                        size="sm"
                        color="primary"
                      />
                    )}

                    {uploadedFile.error && (
                      <p className="text-sm text-error mt-1">{uploadedFile.error}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {uploadedFile.status === 'error' && (
                      <button
                        onClick={() => retryUpload(uploadedFile.id)}
                        className="p-1 text-warning hover:text-warning/80 transition-colors"
                        title="Retry upload"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className="p-1 text-error hover:text-error/80 transition-colors"
                      title="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { UploadedFile };
