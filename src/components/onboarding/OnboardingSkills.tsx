'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { Search, X, Loader2 } from 'lucide-react';
import type { Skill } from '@/types/professional';

interface SelectedSkill {
  skill: Skill;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface OnboardingSkillsProps {
  selectedSkills: SelectedSkill[];
  suggestedSkills: Skill[];
  onAddSkill: (skill: Skill) => void;
  onRemoveSkill: (skillId: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  domainId?: string;
  specializationIds?: string[];
  maxSkills?: number;
}

export function OnboardingSkills({
  selectedSkills,
  suggestedSkills,
  onAddSkill,
  onRemoveSkill,
  onContinue,
  onSkip,
  domainId,
  specializationIds,
  maxSkills = 5,
}: OnboardingSkillsProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canAddMore = selectedSkills.length < maxSkills;
  const selectedIds = new Set(selectedSkills.map((s) => s.skill.id));

  // Debounced search
  useEffect(() => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({ q: query, limit: '8' });
        if (domainId) params.set('domain_id', domainId);
        if (specializationIds?.[0]) params.set('specialization_id', specializationIds[0]);

        const res = await fetch(`/api/taxonomy/skills?${params}`);
        const data = await res.json();

        if (data.success) {
          setSuggestions(data.data.filter((s: Skill) => !selectedIds.has(s.id)));
        }
      } catch (error) {
        console.error('Failed to search skills:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, domainId, specializationIds, selectedIds]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSkill = useCallback(
    (skill: Skill) => {
      if (!canAddMore) return;
      onAddSkill(skill);
      setQuery('');
      setShowDropdown(false);
      setSuggestions([]);
    },
    [canAddMore, onAddSkill]
  );

  // Filter suggested skills to not include already selected
  const filteredSuggested = suggestedSkills.filter((s) => !selectedIds.has(s.id));

  return (
    <div className="flex flex-col items-center min-h-[60vh] px-4">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 text-center">
        می‌خواهی مهارت‌هات رو دقیق‌تر مشخص کنی؟
      </h1>

      {/* Subtitle */}
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        این کار کمک می‌کنه در فرصت‌های شغلی بهتر دیده بشی.
      </p>

      {/* Search Input */}
      <div className="relative w-full max-w-md mb-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder={canAddMore ? 'مهارت را تایپ کن...' : `حداکثر ${maxSkills} مهارت`}
            disabled={!canAddMore}
            className={cn(
              'w-full rounded-xl border border-input bg-background px-4 py-3 pr-10 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </div>
        </div>

        {/* Search Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-2 w-full rounded-xl border bg-popover shadow-lg"
          >
            <ul className="max-h-48 overflow-auto py-2">
              {suggestions.map((skill) => (
                <li key={skill.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSkill(skill)}
                    className="w-full px-4 py-2 text-right hover:bg-accent transition-colors"
                  >
                    <span className="font-medium">{skill.name_fa}</span>
                    <span className="text-xs text-muted-foreground mr-2">
                      {skill.name_en}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Suggested Skills (only show if we can add more) */}
      {canAddMore && filteredSuggested.length > 0 && (
        <div className="w-full max-w-md mb-6">
          <p className="text-sm text-muted-foreground mb-2">پیشنهادی:</p>
          <div className="flex flex-wrap gap-2">
            {filteredSuggested.slice(0, 6).map((skill) => (
              <button
                key={skill.id}
                onClick={() => handleSelectSkill(skill)}
                className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm transition-colors"
              >
                {skill.name_fa}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Skills */}
      {selectedSkills.length > 0 && (
        <div className="w-full max-w-md mb-8">
          <p className="text-sm text-muted-foreground mb-2">
            انتخاب شده ({selectedSkills.length}/{maxSkills}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map(({ skill }) => (
              <div
                key={skill.id}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm"
              >
                <span>{skill.name_fa}</span>
                <button
                  onClick={() => onRemoveSkill(skill.id)}
                  className="hover:bg-primary-foreground/10 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs mt-auto">
        <Button onClick={onContinue} size="lg" className="w-full">
          {selectedSkills.length > 0 ? 'ذخیره و ادامه' : 'ادامه'}
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full text-muted-foreground"
        >
          بعداً
        </Button>
      </div>
    </div>
  );
}
