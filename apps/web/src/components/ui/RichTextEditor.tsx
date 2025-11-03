import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter your text...',
  error,
  className,
  minHeight = 200,
  maxHeight = 400,
  disabled = false,
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.textContent !== value) {
      // Use textContent instead of innerHTML for security
      editorRef.current.textContent = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      // Use textContent instead of innerHTML for security
      const content = editorRef.current.textContent || '';
      onChange(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          handleInput();
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          handleInput();
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          handleInput();
          break;
      }
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setSelectedText(selection.toString());
    } else {
      setSelectedText('');
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  const insertList = (ordered: boolean) => {
    const command = ordered ? 'insertOrderedList' : 'insertUnorderedList';
    document.execCommand(command);
    handleInput();
    editorRef.current?.focus();
  };

  const toolbarButtons = [
    {
      icon: '𝐁',
      title: 'Bold (Ctrl+B)',
      command: 'bold',
      active: document.queryCommandState('bold'),
    },
    {
      icon: '𝐼',
      title: 'Italic (Ctrl+I)',
      command: 'italic',
      active: document.queryCommandState('italic'),
    },
    {
      icon: '𝐔',
      title: 'Underline (Ctrl+U)',
      command: 'underline',
      active: document.queryCommandState('underline'),
    },
    {
      icon: '•',
      title: 'Bullet List',
      action: () => insertList(false),
    },
    {
      icon: '1.',
      title: 'Numbered List',
      action: () => insertList(true),
    },
  ];

  return (
    <div className={cn('relative', className)}>
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ 
          opacity: isFocused ? 1 : 0.7, 
          y: 0 
        }}
        className="flex items-center space-x-1 p-2 bg-surface/50 border border-border rounded-t-lg"
      >
        {toolbarButtons.map((button, index) => (
          <button
            key={index}
            type="button"
            onClick={button.action || (() => formatText(button.command!))}
            disabled={disabled}
            title={button.title}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded transition-colors',
              'hover:bg-primary/10 hover:text-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              button.active ? 'bg-primary/20 text-primary' : 'text-textSecondary'
            )}
          >
            {button.icon}
          </button>
        ))}
        
        <div className="w-px h-6 bg-border mx-2" />
        
        <button
          type="button"
          onClick={() => formatText('removeFormat')}
          disabled={disabled || !selectedText}
          title="Clear Formatting"
          className="px-3 py-1.5 text-sm text-textSecondary hover:bg-error/10 hover:text-error rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </motion.div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        className={cn(
          'w-full px-4 py-3 bg-surface border-x border-b border-border rounded-b-lg',
          'text-text placeholder-textSecondary',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'overflow-y-auto resize-none',
          error && 'border-error focus:ring-error',
          disabled && 'opacity-50 cursor-not-allowed bg-surface/50',
          'prose prose-sm max-w-none',
          '[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1',
          '[&_strong]:font-semibold [&_em]:italic [&_u]:underline'
        )}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Placeholder */}
      {!value && !isFocused && (
        <div 
          className="absolute top-[52px] left-4 text-textSecondary pointer-events-none"
          style={{ top: `${52}px` }}
        >
          {placeholder}
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-error"
        >
          {error}
        </motion.p>
      )}

      {/* Character count */}
      <div className="flex justify-between items-center mt-2 text-xs text-textSecondary">
        <div>
          {selectedText && (
            <span>{selectedText.length} characters selected</span>
          )}
        </div>
        <div>
          {value.replace(/<[^>]*>/g, '').length} characters
        </div>
      </div>
    </div>
  );
}