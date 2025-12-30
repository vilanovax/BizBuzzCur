'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  Globe,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import PersianCalendar from '@/components/ui/PersianCalendar';
import { ImageUpload, MultiFileUpload } from '@/components/ui/FileUpload';
import { cn } from '@/lib/utils/cn';
import type { EventType, LocationType, EventFeatures, CreateEventInput, EventAttachment } from '@/types/event';
import { EVENT_TYPE_CONFIG, FOCUSED_EVENT_FEATURES, NETWORKING_EVENT_FEATURES } from '@/types/event';

type Step = 'type' | 'basic' | 'location' | 'settings' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'type', label: 'نوع ایونت' },
  { id: 'basic', label: 'اطلاعات پایه' },
  { id: 'location', label: 'مکان و زمان' },
  { id: 'settings', label: 'تنظیمات' },
  { id: 'review', label: 'بررسی نهایی' },
];

const LOCATION_TYPES: { value: LocationType; label: string; icon: React.ReactNode }[] = [
  { value: 'in_person', label: 'حضوری', icon: <MapPin className="w-5 h-5" /> },
  { value: 'online', label: 'آنلاین', icon: <Video className="w-5 h-5" /> },
  { value: 'hybrid', label: 'ترکیبی', icon: <Globe className="w-5 h-5" /> },
];

const ONLINE_PLATFORMS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'skyroom', label: 'اسکای‌روم' },
  { value: 'other', label: 'سایر' },
];

interface EventFormProps {
  initialData?: Partial<CreateEventInput>;
  eventId?: string;
  mode?: 'create' | 'edit';
}

export function EventForm({ initialData, eventId, mode = 'create' }: EventFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(initialData?.event_type ? 'basic' : 'type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse welcome_attachments if it's a string (from database JSONB)
  const parseAttachments = (attachments: unknown): EventAttachment[] => {
    if (!attachments) return [];
    if (typeof attachments === 'string') {
      try {
        return JSON.parse(attachments);
      } catch {
        return [];
      }
    }
    if (Array.isArray(attachments)) return attachments;
    return [];
  };

  // Form state
  const [formData, setFormData] = useState<CreateEventInput>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    event_type: initialData?.event_type || 'focused_event',
    category: initialData?.category || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    timezone: initialData?.timezone || 'Asia/Tehran',
    location_type: initialData?.location_type || 'in_person',
    venue_name: initialData?.venue_name || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    online_link: initialData?.online_link || '',
    online_platform: initialData?.online_platform || '',
    max_attendees: initialData?.max_attendees || undefined,
    is_free: initialData?.is_free ?? true,
    price: initialData?.price || 0,
    currency: initialData?.currency || 'IRR',
    visibility: initialData?.visibility || 'public',
    is_invite_only: initialData?.is_invite_only || false,
    features: initialData?.features || {},
    theme_color: initialData?.theme_color || '#2563eb',
    welcome_message: initialData?.welcome_message || '',
    banner_url: initialData?.banner_url || '',
    welcome_attachments: parseAttachments(initialData?.welcome_attachments),
  });

  const [features, setFeatures] = useState<EventFeatures>(
    formData.event_type === 'focused_event' ? FOCUSED_EVENT_FEATURES : NETWORKING_EVENT_FEATURES
  );

  const updateFormData = (updates: Partial<CreateEventInput>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const selectEventType = (type: EventType) => {
    updateFormData({ event_type: type });
    setFeatures(type === 'focused_event' ? FOCUSED_EVENT_FEATURES : NETWORKING_EVENT_FEATURES);
    setCurrentStep('basic');
  };

  const nextStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleSubmit = async (status: 'draft' | 'published' = 'draft') => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        features,
        status,
      };

      const url = mode === 'edit' ? `/api/events/${eventId}` : '/api/events';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/dashboard/events/${data.data.id}`);
      } else {
        setError(data.error || 'خطا در ذخیره ایونت');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      {currentStep !== 'type' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.slice(1).map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    currentStepIndex > index + 1
                      ? 'bg-primary text-primary-foreground'
                      : currentStepIndex === index + 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {currentStepIndex > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < STEPS.length - 2 && (
                  <div
                    className={cn(
                      'w-16 sm:w-24 h-1 mx-2',
                      currentStepIndex > index + 1 ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.slice(1).map((step) => (
              <span key={step.id}>{step.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      {currentStep === 'type' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">چه نوع ایونتی می‌سازی؟</h1>
            <p className="text-muted-foreground">نوع ایونت را انتخاب کنید</p>
          </div>

          <div className="grid gap-4">
            {/* Focused Event */}
            <button
              onClick={() => selectEventType('focused_event')}
              className="group p-6 rounded-2xl border-2 border-transparent bg-card hover:border-primary text-right transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: EVENT_TYPE_CONFIG.focused_event.color }}
                >
                  <Target className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                    {EVENT_TYPE_CONFIG.focused_event.label}
                    <span className="text-xs font-normal text-muted-foreground">
                      {EVENT_TYPE_CONFIG.focused_event.labelEn}
                    </span>
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {EVENT_TYPE_CONFIG.focused_event.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPE_CONFIG.focused_event.examples.map((example) => (
                      <span
                        key={example}
                        className="px-2 py-1 bg-muted rounded text-xs"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>

            {/* Networking Event */}
            <button
              onClick={() => selectEventType('networking_event')}
              className="group p-6 rounded-2xl border-2 border-transparent bg-card hover:border-primary text-right transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: EVENT_TYPE_CONFIG.networking_event.color }}
                >
                  <Globe className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                    {EVENT_TYPE_CONFIG.networking_event.label}
                    <span className="text-xs font-normal text-muted-foreground">
                      {EVENT_TYPE_CONFIG.networking_event.labelEn}
                    </span>
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {EVENT_TYPE_CONFIG.networking_event.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPE_CONFIG.networking_event.examples.map((example) => (
                      <span
                        key={example}
                        className="px-2 py-1 bg-muted rounded text-xs"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          </div>
        </div>
      )}

      {currentStep === 'basic' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{
                  backgroundColor: EVENT_TYPE_CONFIG[formData.event_type].color,
                }}
              >
                {formData.event_type === 'focused_event' ? (
                  <Target className="w-5 h-5" />
                ) : (
                  <Globe className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium">{EVENT_TYPE_CONFIG[formData.event_type].label}</p>
                <button
                  onClick={() => setCurrentStep('type')}
                  className="text-xs text-primary hover:underline"
                >
                  تغییر نوع
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان ایونت *</label>
              <input
                type="text"
                placeholder="مثال: جلسه معرفی محصول جدید"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات</label>
              <textarea
                placeholder="توضیحات ایونت خود را بنویسید..."
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Theme Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium">رنگ تم</label>
              <div className="flex gap-3">
                {['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#0891b2'].map(
                  (color) => (
                    <button
                      key={color}
                      onClick={() => updateFormData({ theme_color: color })}
                      className={cn(
                        'w-10 h-10 rounded-full transition-all',
                        formData.theme_color === color
                          ? 'ring-2 ring-offset-2 ring-primary scale-110'
                          : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Banner Image */}
            <div className="space-y-2">
              <ImageUpload
                value={formData.banner_url}
                onChange={(url) => updateFormData({ banner_url: url || '' })}
                label="تصویر بنر ایونت"
                aspectRatio="banner"
                maxSize={5}
              />
              <p className="text-xs text-muted-foreground">
                این تصویر در صفحه ایونت و لینک اشتراک‌گذاری نمایش داده می‌شود
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                <ArrowRight className="w-4 h-4 ml-2" />
                قبلی
              </Button>
              <Button onClick={nextStep} disabled={!formData.title}>
                بعدی
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'location' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Location Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium">نوع مکان</label>
              <div className="grid grid-cols-3 gap-3">
                {LOCATION_TYPES.map((loc) => (
                  <button
                    key={loc.value}
                    onClick={() => updateFormData({ location_type: loc.value })}
                    className={cn(
                      'p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all',
                      formData.location_type === loc.value
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted hover:border-primary/30'
                    )}
                  >
                    {loc.icon}
                    <span className="text-sm">{loc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In-person fields */}
            {(formData.location_type === 'in_person' ||
              formData.location_type === 'hybrid') && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                <h4 className="font-medium text-sm">اطلاعات مکان حضوری</h4>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">نام محل</label>
                    <input
                      type="text"
                      placeholder="مثال: سالن همایش‌های رازی"
                      value={formData.venue_name}
                      onChange={(e) => updateFormData({ venue_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">آدرس</label>
                    <input
                      type="text"
                      placeholder="آدرس کامل"
                      value={formData.address}
                      onChange={(e) => updateFormData({ address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">شهر</label>
                    <input
                      type="text"
                      placeholder="مثال: تهران"
                      value={formData.city}
                      onChange={(e) => updateFormData({ city: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Online fields */}
            {(formData.location_type === 'online' ||
              formData.location_type === 'hybrid') && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                <h4 className="font-medium text-sm">اطلاعات آنلاین</h4>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">پلتفرم</label>
                    <select
                      value={formData.online_platform}
                      onChange={(e) => updateFormData({ online_platform: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">انتخاب کنید</option>
                      {ONLINE_PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">لینک جلسه</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.online_link}
                      onChange={(e) => updateFormData({ online_link: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                تاریخ و زمان
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">تاریخ و ساعت شروع *</label>
                  <PersianCalendar
                    value={formData.start_date}
                    onChange={(date) => updateFormData({ start_date: date })}
                    placeholder="انتخاب تاریخ و ساعت شروع"
                    showTime={true}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">تاریخ و ساعت پایان</label>
                  <PersianCalendar
                    value={formData.end_date}
                    onChange={(date) => updateFormData({ end_date: date })}
                    placeholder="انتخاب تاریخ و ساعت پایان"
                    showTime={true}
                    minDate={formData.start_date}
                  />
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                <ArrowRight className="w-4 h-4 ml-2" />
                قبلی
              </Button>
              <Button onClick={nextStep} disabled={!formData.start_date}>
                بعدی
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'settings' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Capacity */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                ظرفیت
              </h4>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">حداکثر تعداد شرکت‌کنندگان</label>
                <input
                  type="number"
                  placeholder="بدون محدودیت"
                  value={formData.max_attendees || ''}
                  onChange={(e) =>
                    updateFormData({
                      max_attendees: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  min={1}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                هزینه ثبت‌نام
              </h4>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.is_free}
                    onChange={() => updateFormData({ is_free: true, price: 0 })}
                    className="w-4 h-4 text-primary"
                  />
                  <span>رایگان</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.is_free}
                    onChange={() => updateFormData({ is_free: false })}
                    className="w-4 h-4 text-primary"
                  />
                  <span>پولی</span>
                </label>
              </div>
              {!formData.is_free && (
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="مبلغ"
                    value={formData.price || ''}
                    onChange={(e) => updateFormData({ price: parseInt(e.target.value) || 0 })}
                    className="flex-1 px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    min={0}
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => updateFormData({ currency: e.target.value })}
                    className="px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="IRR">تومان</option>
                    <option value="USD">دلار</option>
                    <option value="EUR">یورو</option>
                  </select>
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">دسترسی و نمایش</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">ایونت عمومی</p>
                    <p className="text-xs text-muted-foreground">
                      همه می‌توانند ایونت را ببینند و ثبت‌نام کنند
                    </p>
                  </div>
                  <input
                    type="radio"
                    checked={formData.visibility === 'public'}
                    onChange={() => updateFormData({ visibility: 'public' })}
                    className="w-4 h-4 text-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">فقط با لینک</p>
                    <p className="text-xs text-muted-foreground">
                      فقط کسانی که لینک دارند می‌توانند ببینند
                    </p>
                  </div>
                  <input
                    type="radio"
                    checked={formData.visibility === 'unlisted'}
                    onChange={() => updateFormData({ visibility: 'unlisted' })}
                    className="w-4 h-4 text-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">خصوصی</p>
                    <p className="text-xs text-muted-foreground">
                      فقط دعوت‌شدگان می‌توانند ببینند
                    </p>
                  </div>
                  <input
                    type="radio"
                    checked={formData.visibility === 'private'}
                    onChange={() => updateFormData({ visibility: 'private' })}
                    className="w-4 h-4 text-primary"
                  />
                </label>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">پیام خوش‌آمدگویی</label>
              <textarea
                placeholder="پیامی که بعد از ثبت‌نام به شرکت‌کنندگان نمایش داده می‌شود..."
                value={formData.welcome_message}
                onChange={(e) => updateFormData({ welcome_message: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Welcome Attachments */}
            <div className="space-y-2">
              <MultiFileUpload
                values={(formData.welcome_attachments || []).map(att => ({
                  url: att.url,
                  name: att.name,
                  type: att.type === 'file' ? 'application/octet-stream' : 'link',
                  size: att.size,
                }))}
                onChange={(files) => updateFormData({
                  welcome_attachments: files.map(f => ({
                    type: 'file' as const,
                    url: f.url,
                    name: f.name,
                    size: f.size,
                  }))
                })}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                maxSize={10}
                maxFiles={5}
                label="فایل‌های ضمیمه (اختیاری)"
              />
              <p className="text-xs text-muted-foreground">
                فایل‌هایی که همراه پیام خوش‌آمدگویی برای شرکت‌کنندگان ارسال می‌شود
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                <ArrowRight className="w-4 h-4 ml-2" />
                قبلی
              </Button>
              <Button onClick={nextStep}>
                بعدی
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'review' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">بررسی نهایی</h2>

            {/* Summary */}
            <div className="space-y-4">
              {/* Event Type */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: EVENT_TYPE_CONFIG[formData.event_type].color }}
                >
                  {formData.event_type === 'focused_event' ? (
                    <Target className="w-6 h-6" />
                  ) : (
                    <Globe className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{formData.title || 'بدون عنوان'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {EVENT_TYPE_CONFIG[formData.event_type].label}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="grid gap-3 text-sm">
                {formData.start_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {new Date(formData.start_date).toLocaleDateString('fa-IR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {formData.location_type === 'online'
                      ? 'آنلاین'
                      : formData.location_type === 'hybrid'
                      ? 'ترکیبی'
                      : formData.venue_name || formData.city || 'حضوری'}
                  </span>
                </div>
                {formData.max_attendees && (
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>حداکثر {formData.max_attendees} نفر</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>{formData.is_free ? 'رایگان' : `${formData.price?.toLocaleString()} تومان`}</span>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                <ArrowRight className="w-4 h-4 ml-2" />
                ویرایش
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="flex-1"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ذخیره پیش‌نویس'}
              </Button>
              <Button
                onClick={() => handleSubmit('published')}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 ml-2" />
                    انتشار ایونت
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
