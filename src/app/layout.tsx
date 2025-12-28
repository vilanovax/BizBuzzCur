import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import "vazirmatn/Vazirmatn-font-face.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizBuzz - پروفایل دیجیتال حرفه‌ای",
  description: "پلتفرم پروفایل دیجیتال، شبکه‌سازی حرفه‌ای و مدیریت رویدادها",
  keywords: ["پروفایل دیجیتال", "کارت ویزیت", "شبکه‌سازی", "رویداد", "بیزباز"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className="font-vazirmatn antialiased"
      >
        <AuthProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
