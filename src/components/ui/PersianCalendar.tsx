'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PersianCalendarProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showTime?: boolean;
  minDate?: string;
  maxDate?: string;
}

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const PERSIAN_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Convert Gregorian to Persian
function gregorianToPersian(date: Date): { year: number; month: number; day: number } {
  let gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

  return { year: jy, month: jm, day: jd };
}

// Convert Persian to Gregorian
function persianToGregorian(jy: number, jm: number, jd: number): Date {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor((jy % 33 + 3) / 4) + 78 + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const gd = days + 1;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  let v = gd;
  for (gm = 0; gm < 13 && v > sal_a[gm]; gm++) v -= sal_a[gm];

  return new Date(gy, gm - 1, v);
}

// Get days in Persian month
function getDaysInPersianMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // Esfand - check leap year
  const isLeap = ((year - (year > 0 ? 474 : 473)) % 2820 + 474 + 38) * 682 % 2816 < 682;
  return isLeap ? 30 : 29;
}

// Get first day of month (0 = Saturday in Persian calendar)
function getFirstDayOfPersianMonth(year: number, month: number): number {
  const date = persianToGregorian(year, month, 1);
  return (date.getDay() + 1) % 7; // Convert to Persian week (Saturday = 0)
}

// Format Persian date
function formatPersianDate(year: number, month: number, day: number, showTime?: boolean, hour?: number, minute?: number): string {
  let result = `${day} ${PERSIAN_MONTHS[month - 1]} ${year}`;
  if (showTime && hour !== undefined && minute !== undefined) {
    result += ` - ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  return result;
}

// Convert to Persian number
function toPersianNumber(num: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

export default function PersianCalendar({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  disabled = false,
  className = '',
  showTime = false,
  minDate,
  maxDate,
}: PersianCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(1403);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize from value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const persian = gregorianToPersian(date);
        setSelectedDate(persian);
        setCurrentYear(persian.year);
        setCurrentMonth(persian.month);
        setSelectedHour(date.getHours());
        setSelectedMinute(date.getMinutes());
      }
    } else {
      // Set to current date
      const today = gregorianToPersian(new Date());
      setCurrentYear(today.year);
      setCurrentMonth(today.month);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const newDate = { year: currentYear, month: currentMonth, day };
    setSelectedDate(newDate);

    // Convert to ISO string
    const gregorian = persianToGregorian(newDate.year, newDate.month, newDate.day);
    gregorian.setHours(selectedHour, selectedMinute, 0, 0);

    if (!showTime) {
      onChange?.(gregorian.toISOString());
      setIsOpen(false);
    }
  };

  const handleTimeChange = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      const gregorian = persianToGregorian(selectedDate.year, selectedDate.month, selectedDate.day);
      gregorian.setHours(selectedHour, selectedMinute, 0, 0);
      onChange?.(gregorian.toISOString());
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange?.('');
    setIsOpen(false);
  };

  // Check if date is disabled
  const isDateDisabled = (year: number, month: number, day: number): boolean => {
    const date = persianToGregorian(year, month, day);
    if (minDate) {
      const min = new Date(minDate);
      if (date < min) return true;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) return true;
    }
    return false;
  };

  // Generate calendar days
  const renderCalendar = () => {
    const daysInMonth = getDaysInPersianMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfPersianMonth(currentYear, currentMonth);
    const today = gregorianToPersian(new Date());

    const days: React.ReactNode[] = [];

    // Empty cells for days before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate?.year === currentYear && selectedDate?.month === currentMonth && selectedDate?.day === day;
      const isToday = today.year === currentYear && today.month === currentMonth && today.day === day;
      const isDisabled = isDateDisabled(currentYear, currentMonth, day);

      days.push(
        <button
          key={day}
          onClick={() => !isDisabled && handleSelectDate(day)}
          disabled={isDisabled}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all',
            isSelected
              ? 'bg-primary text-primary-foreground font-bold'
              : isToday
              ? 'bg-primary/20 text-primary font-medium'
              : isDisabled
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'hover:bg-muted text-foreground'
          )}
        >
          {toPersianNumber(day)}
        </button>
      );
    }

    return days;
  };

  const displayValue = selectedDate
    ? formatPersianDate(selectedDate.year, selectedDate.month, selectedDate.day, showTime, selectedHour, selectedMinute)
    : '';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 rounded-xl border bg-background text-right flex items-center justify-between gap-2 transition-all',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 focus:ring-2 focus:ring-primary/20',
          isOpen && 'ring-2 ring-primary/20 border-primary/50'
        )}
      >
        <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
          {displayValue || placeholder}
        </span>
        <Calendar className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl border w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h3 className="font-bold text-lg">
                  {PERSIAN_MONTHS[currentMonth - 1]} {toPersianNumber(currentYear)}
                </h3>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 p-2 border-b">
              {PERSIAN_WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="w-10 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1 p-2">
              {renderCalendar()}
            </div>

            {/* Time picker */}
            {showTime && (
              <div className="p-4 border-t bg-muted/30">
                <div className="flex items-center justify-center gap-4">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedHour}
                      onChange={(e) => handleTimeChange(parseInt(e.target.value), selectedMinute)}
                      className="px-3 py-2 rounded-lg border bg-background text-center"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {toPersianNumber(i).padStart(2, '۰')}
                        </option>
                      ))}
                    </select>
                    <span className="text-lg font-bold">:</span>
                    <select
                      value={selectedMinute}
                      onChange={(e) => handleTimeChange(selectedHour, parseInt(e.target.value))}
                      className="px-3 py-2 rounded-lg border bg-background text-center"
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>
                          {toPersianNumber(i).padStart(2, '۰')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 p-4 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
              >
                انصراف
              </button>
              {selectedDate && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {(showTime || selectedDate) && (
                <button
                  onClick={handleConfirm}
                  disabled={!selectedDate}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  تایید
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
