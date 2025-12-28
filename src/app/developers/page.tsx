import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Plus, Key, FileText, Zap } from 'lucide-react';

export default async function DevelopersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/developers');
  }

  const features = [
    {
      icon: Key,
      title: 'OAuth 2.0',
      description: 'پیاده‌سازی "Login with BizBuzz" در اپلیکیشن خود',
    },
    {
      icon: Zap,
      title: 'REST API',
      description: 'دسترسی به پروفایل‌ها، رویدادها و جلسات از طریق API',
    },
    {
      icon: FileText,
      title: 'مستندات کامل',
      description: 'راهنمای جامع برای شروع سریع',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">پنل توسعه‌دهندگان</h1>
        <p className="text-muted-foreground mt-2">
          با API بیزباز، پروفایل‌های حرفه‌ای کاربران را در اپلیکیشن خود یکپارچه کنید
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>شروع سریع</CardTitle>
          <CardDescription>
            با چند قدم ساده، اپلیکیشن OAuth خود را ثبت کنید و شروع به استفاده از API کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg border">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-medium">اپلیکیشن OAuth ایجاد کنید</h4>
              <p className="text-sm text-muted-foreground">
                اپلیکیشن خود را ثبت کنید و Client ID و Secret دریافت کنید
              </p>
            </div>
            <Button asChild>
              <Link href="/developers/applications/new">
                <Plus className="h-4 w-4 ml-2" />
                ایجاد اپلیکیشن
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg border opacity-60">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-medium">OAuth Flow را پیاده‌سازی کنید</h4>
              <p className="text-sm text-muted-foreground">
                کاربران را به صفحه authorize هدایت کنید و توکن دریافت کنید
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg border opacity-60">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-medium">از API استفاده کنید</h4>
              <p className="text-sm text-muted-foreground">
                با توکن دریافتی، به پروفایل و اطلاعات کاربران دسترسی پیدا کنید
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Endpoints Preview */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>
            نمونه endpoint های موجود در API بیزباز
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs">GET</span>
                <span>/api/v1/profile/business_card</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs">GET</span>
                <span>/api/v1/profile/resume</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 rounded text-xs">POST</span>
                <span>/api/v1/event/:id/checkin</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 rounded text-xs">POST</span>
                <span>/api/v1/meeting</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs">GET</span>
                <span>/api/v1/oauth/userinfo</span>
              </div>
            </div>
          </div>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/developers/docs">مشاهده مستندات کامل</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
