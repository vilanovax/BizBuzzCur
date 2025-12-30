'use client';

import Link from 'next/link';
import {
  Building2,
  Users,
  Briefcase,
  MapPin,
  ExternalLink,
  MoreVertical,
  Edit,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { CompanyWithStats, CompanyRole } from '@/types/company';
import { COMPANY_ROLE_LABELS } from '@/types/company';

interface CompanyCardProps {
  company: CompanyWithStats;
  onClick?: () => void;
}

const ROLE_COLORS: Record<CompanyRole, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-blue-100 text-blue-700',
  recruiter: 'bg-green-100 text-green-700',
  member: 'bg-gray-100 text-gray-700',
};

export function CompanyCard({ company, onClick }: CompanyCardProps) {
  return (
    <Link href={`/dashboard/companies/${company.id}`}>
      <Card
        className="group hover:shadow-md transition-all cursor-pointer h-full"
        onClick={onClick}
      >
        {/* Brand color bar */}
        <div
          className="h-1.5 w-full rounded-t-lg"
          style={{ backgroundColor: company.brand_color || '#2563eb' }}
        />

        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Logo */}
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-14 h-14 rounded-xl object-cover border"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: company.brand_color || '#2563eb' }}
              >
                <Building2 className="w-7 h-7" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{company.name}</h3>
              {company.tagline && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {company.tagline}
                </p>
              )}
              {company.industry && (
                <span className="inline-block mt-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {company.industry}
                </span>
              )}
            </div>

            {/* Role Badge */}
            {company.user_role && (
              <span
                className={cn(
                  'px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                  ROLE_COLORS[company.user_role]
                )}
              >
                {COMPANY_ROLE_LABELS[company.user_role]}
              </span>
            )}
          </div>

          {/* Location */}
          {(company.city || company.country) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {[company.city, company.country].filter(Boolean).join('، ')}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 pt-3 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{company.member_count || 0} عضو</span>
            </div>
            {company.active_jobs_count > 0 && (
              <div className="flex items-center gap-1.5 text-green-600">
                <Briefcase className="w-4 h-4" />
                <span>{company.active_jobs_count} فرصت شغلی</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
