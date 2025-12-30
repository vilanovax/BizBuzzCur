'use client';

import { useState } from 'react';
import { X, Save, Loader2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialNotes: string | null;
  onSave: (notes: string) => Promise<void>;
  participantName: string;
}

export function NotesPanel({
  isOpen,
  onClose,
  initialNotes,
  onSave,
  participantName,
}: NotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(notes);
      onClose();
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-background w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            <h3 className="font-medium">یادداشت خصوصی</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <p className="text-sm text-muted-foreground mb-3">
          این یادداشت فقط برای خودت قابل مشاهده است.
        </p>

        {/* Textarea */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="مثلاً: صحبت درباره همکاری مالی بعد از سمینار"
          className="w-full h-32 px-3 py-2 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin ml-1" />
            ) : (
              <Save className="w-4 h-4 ml-1" />
            )}
            ذخیره یادداشت
          </Button>
        </div>
      </div>
    </div>
  );
}
