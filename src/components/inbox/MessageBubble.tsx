'use client';

import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Check, CheckCheck, FileIcon, ImageIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    message_type: string;
    attachments: Array<{
      type: string;
      url: string;
      name: string;
      size?: number;
    }>;
    is_read: boolean;
    created_at: string;
    sender: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
    is_mine: boolean;
  };
  showAvatar?: boolean;
}

export function MessageBubble({ message, showAvatar = true }: MessageBubbleProps) {
  const time = format(new Date(message.created_at), 'HH:mm', { locale: faIR });

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="space-y-2 mt-2">
        {message.attachments.map((attachment, index) => {
          if (attachment.type === 'image') {
            return (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="max-w-[200px] rounded-lg"
                />
              </a>
            );
          }

          return (
            <a
              key={index}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                message.is_mine
                  ? 'bg-primary-foreground/20'
                  : 'bg-accent'
              )}
            >
              <FileIcon className="w-4 h-4" />
              <span className="text-sm flex-1 truncate">{attachment.name}</span>
              <Download className="w-4 h-4" />
            </a>
          );
        })}
      </div>
    );
  };

  if (message.is_mine) {
    return (
      <div className="flex justify-start gap-2 mb-3">
        <div className="max-w-[75%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2">
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}
            {renderAttachments()}
          </div>
          <div className="flex items-center gap-1 mt-1 justify-start px-1">
            <span className="text-[10px] text-muted-foreground">{time}</span>
            {message.is_read ? (
              <CheckCheck className="w-3 h-3 text-primary" />
            ) : (
              <Check className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2 mb-3">
      <div className="max-w-[75%]">
        <div className="bg-accent rounded-2xl rounded-bl-md px-4 py-2">
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          {renderAttachments()}
        </div>
        <div className="flex items-center gap-1 mt-1 justify-end px-1">
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>
      </div>
      {showAvatar && (
        message.sender.avatar_url ? (
          <img
            src={message.sender.avatar_url}
            alt={message.sender.first_name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium">
              {message.sender.first_name?.charAt(0)}
            </span>
          </div>
        )
      )}
    </div>
  );
}
