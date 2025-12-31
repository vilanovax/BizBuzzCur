'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SKILL_LEVELS, SKILL_CATEGORIES, type SkillLevel, type SkillCategory } from '@/types/professional';
import type { UserProfessionalProfile } from '@/types/professional';

interface CollapsibleDetailsSectionProps {
  profile: UserProfessionalProfile;
  onRemoveSkill?: (userSkillId: string) => void;
}

export function CollapsibleDetailsSection({
  profile,
  onRemoveSkill,
}: CollapsibleDetailsSectionProps) {
  const [isSpecsOpen, setIsSpecsOpen] = React.useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = React.useState(false);

  const specCount = profile.specializations?.length ?? 0;
  const skillCount = profile.skills?.length ?? 0;

  return (
    <div className="space-y-3">
      {/* Specializations - Collapsed by default */}
      <Card>
        <button
          onClick={() => setIsSpecsOpen(!isSpecsOpen)}
          className="w-full text-right"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                تخصص‌ها
                {specCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {specCount}
                  </span>
                )}
              </CardTitle>
              {isSpecsOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </button>

        {/* Summary when collapsed */}
        {!isSpecsOpen && specCount > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1.5">
              {profile.specializations?.slice(0, 4).map((spec) => (
                <span
                  key={spec.id}
                  className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  {spec.specialization?.name_fa}
                </span>
              ))}
              {specCount > 4 && (
                <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                  +{specCount - 4}
                </span>
              )}
            </div>
          </CardContent>
        )}

        {/* Full list when expanded */}
        {isSpecsOpen && (
          <CardContent className="pt-0">
            {specCount > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.specializations?.map((spec) => (
                  <span
                    key={spec.id}
                    className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    {spec.specialization?.name_fa}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">تخصصی انتخاب نشده</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Skills - Collapsed by default */}
      <Card>
        <button
          onClick={() => setIsSkillsOpen(!isSkillsOpen)}
          className="w-full text-right"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                مهارت‌ها
                {skillCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {skillCount}
                  </span>
                )}
              </CardTitle>
              {isSkillsOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </button>

        {/* Summary when collapsed */}
        {!isSkillsOpen && skillCount > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1.5">
              {profile.skills?.slice(0, 5).map((userSkill) => (
                <span
                  key={userSkill.id}
                  className="px-2.5 py-1 rounded-full bg-muted text-foreground text-xs font-medium"
                >
                  {userSkill.skill?.name_fa}
                </span>
              ))}
              {skillCount > 5 && (
                <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                  +{skillCount - 5}
                </span>
              )}
            </div>
          </CardContent>
        )}

        {/* Full list when expanded */}
        {isSkillsOpen && (
          <CardContent className="pt-0">
            {skillCount > 0 ? (
              <div className="space-y-2">
                {profile.skills?.map((userSkill) => (
                  <div
                    key={userSkill.id}
                    className="flex items-center justify-between p-3 rounded-xl border"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          'bg-muted text-muted-foreground'
                        )}
                      >
                        {SKILL_CATEGORIES[userSkill.skill?.category as SkillCategory]?.labelFa}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{userSkill.skill?.name_fa}</p>
                        <p className="text-xs text-muted-foreground">
                          {userSkill.skill?.name_en}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          'bg-primary/10 text-primary'
                        )}
                      >
                        {SKILL_LEVELS[userSkill.level as SkillLevel]?.labelFa}
                      </span>
                      {onRemoveSkill && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSkill(userSkill.id);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">مهارتی ثبت نشده</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
