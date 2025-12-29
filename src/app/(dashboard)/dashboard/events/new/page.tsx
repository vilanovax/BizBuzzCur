'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { EventForm } from '@/components/events/EventForm';

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/events"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">ایجاد ایونت جدید</h1>
          <p className="text-sm text-muted-foreground">
            جلسه، ورکشاپ یا رویداد شبکه‌سازی خود را بسازید
          </p>
        </div>
      </div>

      {/* Form */}
      <EventForm />
    </div>
  );
}
