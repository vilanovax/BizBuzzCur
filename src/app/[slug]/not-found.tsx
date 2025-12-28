import Link from 'next/link';
import { FileQuestion, Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-12 h-12 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          پروفایل یافت نشد
        </h1>

        <p className="text-muted-foreground mb-8">
          این پروفایل وجود ندارد، حذف شده یا به حالت خصوصی تغییر کرده است.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 ml-2" />
              صفحه اصلی
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/signup">
              پروفایل خود را بسازید
              <ArrowRight className="w-4 h-4 mr-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
