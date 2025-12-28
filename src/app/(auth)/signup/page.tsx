'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    if (!formData.mobile && !formData.email) {
      setError('شماره موبایل یا ایمیل الزامی است');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup({
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile: formData.mobile || undefined,
        email: formData.email || undefined,
        password: formData.password,
      });

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'خطا در ثبت‌نام');
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
        <CardTitle>ثبت‌نام در بیزباز</CardTitle>
        <CardDescription>
          حساب کاربری خود را ایجاد کنید
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="نام"
              type="text"
              name="first_name"
              placeholder="علی"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
            <Input
              label="نام خانوادگی"
              type="text"
              name="last_name"
              placeholder="محمدی"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="شماره موبایل"
            type="tel"
            name="mobile"
            placeholder="09123456789"
            value={formData.mobile}
            onChange={handleChange}
            dir="ltr"
            className="text-left"
          />

          <Input
            label="ایمیل"
            type="email"
            name="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={handleChange}
            dir="ltr"
            className="text-left"
          />

          <p className="text-xs text-muted-foreground">
            حداقل یکی از شماره موبایل یا ایمیل الزامی است
          </p>

          <Input
            label="رمز عبور"
            type="password"
            name="password"
            placeholder="حداقل ۶ کاراکتر"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />

          <Input
            label="تکرار رمز عبور"
            type="password"
            name="confirmPassword"
            placeholder="تکرار رمز عبور"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </CardContent>

        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            ثبت‌نام
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link href="/login" className="text-primary hover:underline">
              وارد شوید
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
