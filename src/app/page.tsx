import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  QrCode,
  Users,
  Calendar,
  Briefcase,
  Shield,
  Zap,
  ArrowLeft,
} from 'lucide-react';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  const features = [
    {
      icon: QrCode,
      title: 'پروفایل دیجیتال',
      description: 'کارت ویزیت دیجیتال با QR Code که همیشه به‌روز است',
    },
    {
      icon: Users,
      title: 'شبکه‌سازی هوشمند',
      description: 'با افراد حرفه‌ای در حوزه کاری خود ارتباط برقرار کنید',
    },
    {
      icon: Calendar,
      title: 'مدیریت رویداد',
      description: 'رویدادها و جلسات را ایجاد و مدیریت کنید',
    },
    {
      icon: Briefcase,
      title: 'فرصت‌های شغلی',
      description: 'فرصت‌های شغلی مرتبط با تخصص خود را پیدا کنید',
    },
    {
      icon: Shield,
      title: 'حریم خصوصی',
      description: 'کنترل کامل بر اطلاعاتی که به اشتراک می‌گذارید',
    },
    {
      icon: Zap,
      title: 'API باز',
      description: 'با سایر سرویس‌ها و اپلیکیشن‌ها یکپارچه شوید',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold">BizBuzz</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              ورود
            </Link>
            <Button asChild>
              <Link href="/signup">ثبت‌نام رایگان</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            هویت دیجیتال حرفه‌ای
            <br />
            <span className="text-primary">در یک مکان</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            پروفایل‌های دیجیتال متعدد بسازید، با QR Code به اشتراک بگذارید، شبکه‌سازی کنید
            و فرصت‌های شغلی پیدا کنید. همه چیز در بیزباز!
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup" className="gap-2">
                شروع رایگان
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/developers">مستندات API</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            چرا بیزباز؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IDaaS Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Identity as a Service
            </div>
            <h2 className="text-3xl font-bold mb-6">
              Login with BizBuzz
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              مانند &quot;Sign in with Google&quot; ولی برای پروفایل حرفه‌ای.
              سایت‌های کاریابی، پلتفرم‌های رویداد، سیستم‌های HR و CRM ها
              می‌توانند از پروفایل بیزباز کاربران استفاده کنند.
            </p>
            <div className="bg-card rounded-xl p-6 border border-border text-left font-mono text-sm">
              <pre className="text-muted-foreground overflow-x-auto">
{`// OAuth 2.0 Integration
GET /api/v1/oauth/authorize
POST /api/v1/oauth/token
GET /api/v1/profile/{context}
POST /api/v1/event/checkin
POST /api/v1/meeting/create`}
              </pre>
            </div>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/developers">مستندات توسعه‌دهندگان</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            همین الان شروع کنید
          </h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
            ثبت‌نام رایگان و ایجاد پروفایل دیجیتال فقط چند دقیقه طول می‌کشد
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
          >
            <Link href="/signup" className="gap-2">
              ثبت‌نام رایگان
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">B</span>
              </div>
              <span className="font-bold">BizBuzz</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/developers" className="hover:text-foreground transition-colors">
                توسعه‌دهندگان
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                حریم خصوصی
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                قوانین
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © ۲۰۲۵ بیزباز. تمامی حقوق محفوظ است.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
