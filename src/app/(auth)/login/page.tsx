'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(identifier, code);

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'خطا در ورود');
      }
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
          <svg
            className="h-6 w-6 text-primary-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <CardTitle>ورود به بیزباز</CardTitle>
        <CardDescription>
          شماره موبایل یا ایمیل خود را وارد کنید
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="شماره موبایل یا ایمیل"
            type="text"
            placeholder="09123456789 یا email@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            dir="ltr"
            className="text-left"
          />

          <Input
            label="کد تأیید"
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            dir="ltr"
            className="text-left"
          />

          <p className="text-xs text-muted-foreground">
            در حالت توسعه، کد تأیید <strong className="text-foreground">123456</strong> است
          </p>
        </CardContent>

        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            ورود
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            حساب کاربری ندارید؟{' '}
            <Link href="/signup" className="text-primary hover:underline">
              ثبت‌نام کنید
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
