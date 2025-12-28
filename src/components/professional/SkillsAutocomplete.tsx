'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import type { Skill, SkillLevel, SkillCategory } from '@/types/professional';
import { SKILL_LEVELS, SKILL_CATEGORIES } from '@/types/professional';

interface SelectedSkill {
  skill: Skill;
  level: SkillLevel;
  years_experience?: number;
}

interface SkillsAutocompleteProps {
  selectedSkills: SelectedSkill[];
  onAddSkill: (skill: Skill, level: SkillLevel) => void;
  onRemoveSkill: (skillId: string) => void;
  onUpdateSkill: (skillId: string, level: SkillLevel, years?: number) => void;
  domainId?: string;
  specializationId?: string;
  maxSkills?: number;
  className?: string;
}

export function SkillsAutocomplete({
  selectedSkills,
  onAddSkill,
  onRemoveSkill,
  onUpdateSkill,
  domainId,
  specializationId,
  maxSkills = 20,
  className,
}: SkillsAutocompleteProps) {
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<Skill[]>([]);
  const [popularSkills, setPopularSkills] = React.useState<Skill[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingPopular, setIsLoadingPopular] = React.useState(true);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Load popular/suggested skills on mount and when domain changes
  React.useEffect(() => {
    async function loadPopularSkills() {
      setIsLoadingPopular(true);
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (domainId) params.set('domain_id', domainId);
        if (specializationId) params.set('specialization_id', specializationId);

        const res = await fetch(`/api/taxonomy/skills?${params}`);
        const data = await res.json();

        if (data.success) {
          setPopularSkills(data.data);
        }
      } catch (error) {
        console.error('Failed to load popular skills:', error);
      } finally {
        setIsLoadingPopular(false);
      }
    }
    loadPopularSkills();
  }, [domainId, specializationId]);

  // Debounced search
  React.useEffect(() => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ q: query, limit: '10' });
        if (domainId) params.set('domain_id', domainId);
        if (specializationId) params.set('specialization_id', specializationId);

        const res = await fetch(`/api/taxonomy/skills?${params}`);
        const data = await res.json();

        if (data.success) {
          // Filter out already selected skills
          const selectedIds = new Set(selectedSkills.map(s => s.skill.id));
          setSuggestions(data.data.filter((s: Skill) => !selectedIds.has(s.id)));
        }
      } catch (error) {
        console.error('Failed to fetch skills:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, domainId, specializationId, selectedSkills]);

  // Close dropdown on outside click
  React.useEffect(() => {
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

  const handleSelectSkill = (skill: Skill) => {
    if (selectedSkills.length >= maxSkills) return;
    onAddSkill(skill, 'intermediate');
    setQuery('');
    setShowDropdown(false);
    setSuggestions([]);
  };

  const canAddMore = selectedSkills.length < maxSkills;
  const selectedIds = new Set(selectedSkills.map(s => s.skill.id));
  const availablePopularSkills = popularSkills.filter(s => !selectedIds.has(s.id));

  // Group popular skills by category
  const groupedPopularSkills = React.useMemo(() => {
    const groups: Record<string, Skill[]> = {};
    availablePopularSkills.forEach(skill => {
      const category = skill.category || 'technical';
      if (!groups[category]) groups[category] = [];
      groups[category].push(skill);
    });
    return groups;
  }, [availablePopularSkills]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder={canAddMore ? 'جستجوی مهارت...' : 'حداکثر تعداد مهارت‌ها'}
            disabled={!canAddMore}
            className={cn(
              'w-full rounded-xl border border-input bg-background px-4 py-3 pr-10 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-2 w-full rounded-xl border bg-popover shadow-lg"
          >
            <ul className="max-h-60 overflow-auto py-2">
              {suggestions.map((skill) => (
                <li key={skill.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSkill(skill)}
                    className="w-full px-4 py-2 text-right hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {SKILL_CATEGORIES[skill.category as SkillCategory]?.labelFa}
                      </span>
                      <div>
                        <div className="font-medium">{skill.name_fa}</div>
                        <div className="text-xs text-muted-foreground">{skill.name_en}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showDropdown && query.length > 0 && suggestions.length === 0 && !isLoading && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-2 w-full rounded-xl border bg-popover p-4 text-center text-sm text-muted-foreground shadow-lg"
          >
            مهارتی یافت نشد
          </div>
        )}
      </div>

      {/* Suggested Skills - Show when no skills selected or less than 5 */}
      {canAddMore && availablePopularSkills.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">مهارت‌های پیشنهادی</h3>
            <span className="text-xs text-muted-foreground">
              کلیک کنید تا اضافه شود
            </span>
          </div>

          {isLoadingPopular ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedPopularSkills).map(([category, skills]) => (
                <div key={category}>
                  <p className="text-xs text-muted-foreground mb-2">
                    {SKILL_CATEGORIES[category as SkillCategory]?.labelFa || category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skills.slice(0, 8).map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => handleSelectSkill(skill)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm',
                          'bg-muted hover:bg-primary/10 hover:text-primary',
                          'border border-transparent hover:border-primary/30',
                          'transition-all duration-200'
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{skill.name_fa}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Skills Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <span>
          {selectedSkills.length} از {maxSkills} مهارت انتخاب شده
        </span>
        {!canAddMore && (
          <span className="text-amber-600">
            حداکثر تعداد مهارت
          </span>
        )}
      </div>

      {/* Selected Skills List */}
      <div className="space-y-2">
        {selectedSkills.map(({ skill, level, years_experience }) => (
          <div
            key={skill.id}
            className="rounded-xl border bg-card p-4 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Skill Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{skill.name_fa}</h4>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {SKILL_CATEGORIES[skill.category as SkillCategory]?.labelFa}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{skill.name_en}</p>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => onRemoveSkill(skill.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Level Selector */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(SKILL_LEVELS) as SkillLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onUpdateSkill(skill.id, lvl, years_experience)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all',
                    level === lvl
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  )}
                >
                  {SKILL_LEVELS[lvl].labelFa}
                </button>
              ))}
            </div>
          </div>
        ))}

        {selectedSkills.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <p>هنوز مهارتی انتخاب نشده است</p>
            <p className="text-xs mt-1">از لیست بالا انتخاب کنید یا جستجو کنید</p>
          </div>
        )}
      </div>
    </div>
  );
}
