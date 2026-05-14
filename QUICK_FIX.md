# Quick Fix Summary

## What's Different Now

### 1. Database Schema MUST be Updated
```sql
-- Run this to add missing columns:
ALTER TABLE leads ADD COLUMN country VARCHAR(255) NULL;
ALTER TABLE leads ADD COLUMN location VARCHAR(255) NULL;
ALTER TABLE leads ADD COLUMN sender_ip VARCHAR(45) NULL;
ALTER TABLE leads ADD COLUMN source_page TEXT NULL;
ALTER TABLE leads ADD COLUMN submitted_at DATETIME NULL;

-- Or re-run the full schema:
mysql -u root -p ai_db < schema-leads.sql
```

### 2. Frontend MUST Send Country Field
**Old (Not Working):**
```json
{
  "name": "Testing",
  "email": "tushar.Varshney@tech2globe.net",
  "phone": "+918860916437",
  "company": "t2g",
  "aiProduct": "Hire OpenAI Developer",
  "message": "testing"
}
```

**New (Required):**
```json
{
  "name": "Testing",
  "email": "tushar.Varshney@tech2globe.net",
  "phone": "+918860916437",
  "company": "t2g",
  "aiProduct": "Hire OpenAI Developer",
  "country": "India",                    // ✅ ADD THIS
  "message": "testing",
  "source_page": "http://localhost:5173/ai-expert"  // ✅ Frontend should populate
}
```

### 3. What Gets Stored Now
- ✅ **Country** - Exact value from form
- ✅ **Location** - Country + enriched city/region from IP (no more "-, -, -")
- ✅ **Sender IP** - Resolved from proxy headers (X-Forwarded-For, X-Real-IP, etc.)
- ✅ **Source Page** - Full URL where form was submitted
- ✅ **Submitted At** - Server-generated timestamp in UTC

### 4. Email Template Now Shows
```
Contact Details
Name: ...
Email: ...
Phone: ...
Company: ...
AI Product: ...
Country: India                    ✅ NEW
Location: Mumbai, India           ✅ IMPROVED (no more "-,-,-")
Sender IP: 203.0.113.10          ✅ FIXED (real IP or ::1 for localhost)

Additional Information
Source Page: http://localhost:5173/ai-expert
Submitted At: 2026-05-14T17:09:11.000Z UTC
```

## Steps to Get Working

1. **Update database schema** (run the SQL migration)
2. **Update frontend** to send `country` field
3. **Test with curl or Postman**:
   ```bash
   POST /api/contact
   Content-Type: application/json
   
   {
     "name": "Test",
     "email": "test@example.com",
     "country": "United States",
     "message": "Hello"
   }
   ```
4. **Check server logs** for the debug output
5. **Check email** - should show Country and proper Location

## Why "-, -, -" Happened

Old code was formatting geolocation as:
```
"${city || "-"}, ${region || "-"}, ${country || "-"}"
```

When geolocation API returned empty values or wasn't called, all became "-".

**New code** only shows what's available:
```
Country is required from form → Never "-"
City/Region added only if available from geo IP
Format: "City, Region, Country" (skipping empty parts)
```

## Localhost IP is Correct!

**::1** = IPv6 loopback (like 127.0.0.1 for IPv4)

This is EXPECTED for local development. In production with real requests, you'll see actual IPs from visitors.
