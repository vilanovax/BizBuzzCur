'use client';

import { useState, useRef } from 'react';
import { Send, Paperclip, X, Loader2, Image as ImageIcon, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MessageInputProps {
  onSend: (content: string, attachments?: Array<{ type: string; url: string; name: string; size?: number }>) => void;
  disabled?: boolean;
  placeholder?: string;
  showAttachments?: boolean;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'پیام خود را بنویسید...',
  showAttachments = true,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Array<{ type: string; url: string; name: string; size?: number; file?: File }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if ((!content.trim() && attachments.length === 0) || disabled) return;

    // Upload attachments first if any
    const uploadedAttachments = [];
    if (attachments.length > 0) {
      setUploading(true);
      for (const attachment of attachments) {
        if (attachment.file) {
          try {
            const formData = new FormData();
            formData.append('file', attachment.file);

            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            const data = await res.json();

            if (data.success) {
              uploadedAttachments.push({
                type: attachment.type,
                url: data.url,
                name: attachment.name,
                size: attachment.size,
              });
            }
          } catch (error) {
            console.error('Upload failed:', error);
          }
        } else {
          uploadedAttachments.push({
            type: attachment.type,
            url: attachment.url,
            name: attachment.name,
            size: attachment.size,
          });
        }
      }
      setUploading(false);
    }

    onSend(content.trim(), uploadedAttachments.length > 0 ? uploadedAttachments : undefined);
    setContent('');
    setAttachments([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((file) => ({
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      file,
    }));

    setAttachments([...attachments, ...newAttachments]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    URL.revokeObjectURL(newAttachments[index].url);
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex-shrink-0 border-t bg-background p-3">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 group"
            >
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-accent flex flex-col items-center justify-center p-2">
                  <FileIcon className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                    {attachment.name.split('.').pop()}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        {showAttachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || uploading}
            rows={1}
            className={cn(
              'w-full px-4 py-2.5 rounded-2xl border bg-accent/50 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:opacity-50',
              'max-h-[120px]'
            )}
            style={{ height: 'auto' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || uploading || (!content.trim() && attachments.length === 0)}
          className={cn(
            'p-2.5 rounded-xl transition-colors',
            content.trim() || attachments.length > 0
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-accent text-muted-foreground',
            'disabled:opacity-50'
          )}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
