import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function DocsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">مستندات API</h1>
        <p className="text-muted-foreground mt-2">
          راهنمای کامل استفاده از BizBuzz API
        </p>
      </div>

      {/* OAuth 2.0 */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth 2.0 Authorization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">1. Authorization Request</h4>
            <p className="text-sm text-muted-foreground mb-3">
              کاربر را به صفحه authorize هدایت کنید:
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`GET ${baseUrl}/oauth/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/callback
  &scope=profile:read openid
  &state=random_state_string
  &code_challenge=PKCE_CHALLENGE
  &code_challenge_method=S256`}</pre>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Token Exchange</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Authorization code را با access token تعویض کنید:
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`POST ${baseUrl}/api/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&redirect_uri=https://yourapp.com/callback
&client_id=YOUR_CLIENT_ID
&code_verifier=PKCE_VERIFIER`}</pre>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Response</h4>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "access_token": "bz_at_xxxxx...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "bz_rt_xxxxx...",
  "scope": "profile:read openid",
  "id_token": "eyJhbG..."
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scopes */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth Scopes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 pr-4">Scope</th>
                  <th className="text-right py-2">توضیحات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">profile:read</td>
                  <td className="py-2">خواندن اطلاعات پایه پروفایل</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">profile:business_card:read</td>
                  <td className="py-2">خواندن پروفایل کارت ویزیت</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">profile:resume:read</td>
                  <td className="py-2">خواندن پروفایل رزومه</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">contact:email</td>
                  <td className="py-2">دسترسی به ایمیل کاربر</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">contact:phone</td>
                  <td className="py-2">دسترسی به شماره تلفن کاربر</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">event:read</td>
                  <td className="py-2">مشاهده رویدادها</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">event:checkin</td>
                  <td className="py-2">چک‌این در رویدادها</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">meeting:create</td>
                  <td className="py-2">ایجاد جلسات</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">openid</td>
                  <td className="py-2">OpenID Connect - دریافت id_token</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">offline_access</td>
                  <td className="py-2">دریافت refresh_token</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Profile API */}
      <Card>
        <CardHeader>
          <CardTitle>Profile API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Get Profile by Context</h4>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs font-mono">GET</span>
              <span className="font-mono text-sm">/api/v1/profile/:context</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              دریافت پروفایل کاربر بر اساس نوع (business_card, resume, event)
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`GET ${baseUrl}/api/v1/profile/business_card
Authorization: Bearer ACCESS_TOKEN`}</pre>
            </div>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto mt-3">
              <pre>{`{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "ali-mohammadi",
    "title": "کارت ویزیت من",
    "profile_type": "business_card",
    "full_name": "علی محمدی",
    "headline": "توسعه‌دهنده نرم‌افزار",
    "job_title": "Senior Developer",
    "company": "شرکت نمونه",
    "photo_url": "https://...",
    "social_links": {
      "linkedin": "https://linkedin.com/in/ali"
    }
  },
  "meta": {
    "schema_version": "1.0.0",
    "context": "business_card"
  }
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Check-in */}
      <Card>
        <CardHeader>
          <CardTitle>Event Check-in API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Check-in Attendee</h4>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 rounded text-xs font-mono">POST</span>
              <span className="font-mono text-sm">/api/v1/event/:id/checkin</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              چک‌این شرکت‌کننده در رویداد با ticket_code یا attendee_id
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`POST ${baseUrl}/api/v1/event/EVENT_ID/checkin
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "ticket_code": "ABC123"
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting API */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Create Meeting</h4>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 rounded text-xs font-mono">POST</span>
              <span className="font-mono text-sm">/api/v1/meeting</span>
            </div>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`POST ${baseUrl}/api/v1/meeting
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "title": "جلسه هفتگی",
  "description": "بررسی پروژه‌ها",
  "start_date": "2025-01-15T10:00:00Z",
  "end_date": "2025-01-15T11:00:00Z",
  "location_type": "online",
  "online_link": "https://meet.google.com/xxx",
  "attendees": [
    {"email": "ali@example.com", "name": "علی محمدی"}
  ]
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle>Error Handling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            در صورت بروز خطا، پاسخ به شکل زیر خواهد بود:
          </p>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre>{`{
  "success": false,
  "error": {
    "code": "insufficient_scope",
    "message": "Required scope: profile:read"
  }
}`}</pre>
          </div>
          <div className="mt-4">
            <h4 className="font-medium mb-2">Error Codes</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li><code className="text-foreground">unauthorized</code> - توکن نامعتبر یا منقضی شده</li>
              <li><code className="text-foreground">insufficient_scope</code> - دسترسی کافی ندارید</li>
              <li><code className="text-foreground">not_found</code> - منبع یافت نشد</li>
              <li><code className="text-foreground">invalid_request</code> - درخواست نامعتبر</li>
              <li><code className="text-foreground">server_error</code> - خطای سرور</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
