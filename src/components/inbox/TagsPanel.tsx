'use client';

import { useState } from 'react';
import { X, Plus, Tag, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

const PRESET_TAGS = [
  { label: 'مشتری بالقوه', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { label: 'همکار', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { label: 'نمایشگاه', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { label: 'مشاوره', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { label: 'سرمایه‌گذار', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { label: 'استخدام', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
];

interface TagsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialTags: string[];
  onSave: (tags: string[]) => Promise<void>;
  participantName: string;
}

export function TagsPanel({
  isOpen,
  onClose,
  initialTags,
  onSave,
  participantName,
}: TagsPanelProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags || []);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (!newTag.trim() || selectedTags.includes(newTag.trim())) return;
    setSelectedTags([...selectedTags, newTag.trim()]);
    setNewTag('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedTags);
      onClose();
    } catch (error) {
      console.error('Failed to save tags:', error);
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
            <Tag className="w-5 h-5 text-primary" />
            <h3 className="font-medium">دسته‌بندی ارتباط</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <p className="text-sm text-muted-foreground mb-4">
          این برچسب‌ها فقط برای مدیریت شخصی شماست.
        </p>

        {/* Preset tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag.label);
            return (
              <button
                key={tag.label}
                onClick={() => toggleTag(tag.label)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all',
                  isSelected
                    ? cn(tag.color, 'ring-2 ring-primary ring-offset-2')
                    : 'bg-accent text-muted-foreground hover:bg-accent/80'
                )}
              >
                {isSelected && <Check className="w-3 h-3" />}
                {tag.label}
              </button>
            );
          })}
        </div>

        {/* Custom tag input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
            placeholder="برچسب جدید..."
            className="flex-1 px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button
            variant="outline"
            onClick={addCustomTag}
            disabled={!newTag.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Selected custom tags */}
        {selectedTags.filter(t => !PRESET_TAGS.some(pt => pt.label === t)).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTags
              .filter(t => !PRESET_TAGS.some(pt => pt.label === t))
              .map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-accent"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
            ذخیره
          </Button>
        </div>
      </div>
    </div>
  );
}
