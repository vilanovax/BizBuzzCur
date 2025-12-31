'use client';

/**
 * Compliance Page Component
 *
 * Full compliance and transparency page for company admins.
 *
 * Design Principles:
 * - Text-first, calm layout
 * - Printable for procurement review
 * - Reassuring, non-defensive tone
 * - No alarming visual elements
 */

import { useRef } from 'react';
import { Printer, Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ComplianceSection } from './ComplianceSection';
import { cn } from '@/lib/utils/cn';
import {
  COMPLIANCE_COPY,
  COMPLIANCE_SECTION_ORDER,
} from '@/types/compliance';

interface CompliancePageProps {
  /** Company name for context */
  companyName?: string;
  /** Last updated date (ISO string) */
  lastUpdated?: string;
  /** Optional CSS class */
  className?: string;
}

/**
 * Format date for display
 */
function formatDate(isoDate?: string): string {
  if (!isoDate) return '---';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

/**
 * Main Compliance Page Component
 */
export function CompliancePage({
  companyName,
  lastUpdated = '2024-01-15',
  className,
}: CompliancePageProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{COMPLIANCE_COPY.pageTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {COMPLIANCE_COPY.pageSubtitle}
            </p>
          </div>
        </div>

        {/* Print button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="print:hidden"
        >
          <Printer className="w-4 h-4 ml-2" />
          {COMPLIANCE_COPY.printButton}
        </Button>
      </div>

      {/* Intro Card */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {COMPLIANCE_COPY.intro}
          </p>
        </CardContent>
      </Card>

      {/* Printable content */}
      <div ref={printRef} className="space-y-4 print:space-y-6">
        {/* Sections */}
        {COMPLIANCE_SECTION_ORDER.map((sectionId, index) => (
          <ComplianceSection
            key={sectionId}
            section={COMPLIANCE_COPY.sections[sectionId]}
            defaultExpanded={index < 2} // First two expanded by default
            className="print:border print:rounded-lg"
          />
        ))}
      </div>

      {/* Footer */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Design statement */}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {COMPLIANCE_COPY.footer.designedFor}
              </span>
            </div>

            {/* Last updated */}
            <div className="text-sm text-muted-foreground">
              {COMPLIANCE_COPY.footer.lastUpdated} {formatDate(lastUpdated)}
            </div>
          </div>

          {/* Contact support */}
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
            <span>{COMPLIANCE_COPY.footer.questions}</span>
            <a
              href="/support"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {COMPLIANCE_COPY.footer.contactSupport}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          /* Reset layout for print */
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide non-printable elements */
          nav,
          aside,
          header,
          footer,
          .print\\:hidden {
            display: none !important;
          }

          /* Expand all sections for print */
          [aria-expanded='false'] + div {
            display: block !important;
          }

          /* Page break handling */
          .page-break {
            page-break-before: always;
          }

          /* Ensure sections don't break mid-content */
          section {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Skeleton loader for CompliancePage
 */
export function CompliancePageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-muted" />
        <div>
          <div className="w-32 h-6 rounded bg-muted mb-2" />
          <div className="w-48 h-4 rounded bg-muted" />
        </div>
      </div>

      {/* Sections skeleton */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted" />
            <div className="w-40 h-5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default CompliancePage;
