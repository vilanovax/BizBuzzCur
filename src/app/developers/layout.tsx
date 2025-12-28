import Link from 'next/link';
import { Code, FileText, Key, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export default async function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold">BizBuzz</span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium">Developers</span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              href="/developers"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              داشبورد
            </Link>
            <Link
              href="/developers/applications"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              اپلیکیشن‌ها
            </Link>
            <Link
              href="/developers/docs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              مستندات
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                داشبورد
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:underline"
              >
                ورود
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1 sticky top-24">
              <Link
                href="/developers"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Code className="h-4 w-4" />
                داشبورد
              </Link>
              <Link
                href="/developers/applications"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Key className="h-4 w-4" />
                اپلیکیشن‌ها
              </Link>
              <Link
                href="/developers/docs"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                مستندات API
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
