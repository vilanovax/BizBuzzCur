'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  Calendar,
  User,
  Briefcase,
  Users,
  ChevronLeft,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { COMPANY_ROLE_LABELS, type CompanyRole } from '@/types/company';

interface Company {
  id: string;
  name: string;
  logo: string | null;
  slug: string;
  role: CompanyRole;
  activeJobs: number;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  venue?: string;
  attendeeCount?: number;
}

interface ActiveProfile {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
}

interface ActiveContextsWidgetProps {
  companies: Company[];
  upcomingEvents: Event[];
  organizedEvents: Event[];
  activeProfile: ActiveProfile | null;
}

export function ActiveContextsWidget({
  companies,
  upcomingEvents,
  organizedEvents,
  activeProfile,
}: ActiveContextsWidgetProps) {
  const hasContent = companies.length > 0 || upcomingEvents.length > 0 || organizedEvents.length > 0;

  if (!hasContent) {
    return null; // Don't show empty widget
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">فعالیت‌های جاری</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Companies */}
        {companies.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                شرکت‌ها
              </p>
              <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                <Link href="/dashboard/companies">همه</Link>
              </Button>
            </div>
            <div className="space-y-2">
              {companies.map((company) => (
                <Link key={company.id} href={`/dashboard/companies/${company.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{company.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{COMPANY_ROLE_LABELS[company.role]}</span>
                        {company.activeJobs > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Briefcase className="h-3 w-3" />
                            {company.activeJobs} آگهی فعال
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Organized Events */}
        {organizedEvents.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                رویدادهای شما
              </p>
              <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                <Link href="/dashboard/events">همه</Link>
              </Button>
            </div>
            <div className="space-y-2">
              {organizedEvents.map((event) => (
                <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {event.attendeeCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.attendeeCount} شرکت‌کننده
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              رویدادهای پیش رو
            </p>
            <div className="space-y-2">
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.startDate);
                const isToday = eventDate.toDateString() === new Date().toDateString();

                return (
                  <Link key={event.id} href={`/e/${event.slug}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                      <div className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center',
                        isToday
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      )}>
                        <Calendar className={cn(
                          'h-4 w-4',
                          isToday ? 'text-green-600' : 'text-blue-600'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {isToday ? 'امروز' : eventDate.toLocaleDateString('fa-IR')}
                          {event.venue && ` - ${event.venue}`}
                        </p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Profile Quick Link */}
        {activeProfile && (
          <div className="pt-2 border-t">
            <Link href={`/${activeProfile.slug}`}>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activeProfile.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeProfile.viewCount} بازدید
                  </p>
                </div>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
