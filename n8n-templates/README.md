# Appointment Reminder Workflow - Setup Guide

## 📋 Overview

This n8n workflow automatically creates appointment reminders when you add events to Google Calendar. When an admin creates a calendar event with a customer's email, the workflow:

1. ✅ Detects the new calendar event
2. 🔐 Authenticates with your messaging platform
3. 📧 Extracts customer email from event attendees
4. 📞 Fetches customer contact details (phone number)
5. 💬 Creates a personalized reminder message
6. ⏰ Schedules the reminder to be sent 1 day before the appointment at 10 AM

## 🎯 User Flow

### Admin Creates Event:

```
1. Open Google Calendar
2. Create new event (e.g., "Haircut Appointment")
3. Set date & time (e.g., Nov 20, 2025 at 2:00 PM)
4. Add customer as attendee (e.g., john@example.com)
5. Optional: Add location & description
6. Save event
```

### What Happens Automatically:

```
1. n8n detects the new event (within seconds)
2. Looks up john@example.com in your contacts
3. Finds John's phone number: +1234567890
4. Creates reminder message:
   "Hi John,

    This is a reminder about your appointment tomorrow:

    📅 Haircut Appointment
    🕒 Wednesday, November 20, 2025 at 2:00 PM
    📍 123 Main St, Salon

    See you there!"

5. Schedules SMS to be sent Nov 19, 2025 at 10:00 AM
```

### Customer Receives:

```
Nov 19, 2025 @ 10:00 AM - SMS reminder arrives
Nov 20, 2025 @ 2:00 PM - Customer arrives for appointment ✅
```

## 🚀 Setup Instructions

### Step 1: Import the Workflow into n8n

1. Open n8n at http://localhost:5678
2. Click **"Workflows"** → **"Import from File"**
3. Select `appointment-reminder-workflow.json`
4. Workflow will be imported

### Step 2: Connect Google Calendar

1. Click on the **"When a Calendar Event is Created"** node
2. Click **"Create New Credential"**
3. Follow Google OAuth flow to connect your calendar
4. Select which calendar to monitor (e.g., "Primary", "Appointments", etc.)
5. Configure trigger:
   - **Events to watch**: `Created`
   - **Poll interval**: `1 minute` (checks for new events every minute)

### Step 3: Set Up Environment Variables

In n8n, go to **Settings → Variables** and add:

```
MESSAGING_PLATFORM_EMAIL = your-admin@example.com
MESSAGING_PLATFORM_PASSWORD = your-password
MESSAGING_PLATFORM_COMPANY_ID = your-company-uuid
```

**To get your Company ID:**

```bash
# Login to your backend and check your user profile
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Get your user details (use the token from above)
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Test the Workflow

#### Option A: Manual Test

1. Click **"Execute Workflow"** button in n8n
2. Go create a test event in Google Calendar
3. Wait 1 minute for trigger to fire
4. Check execution log in n8n

#### Option B: Test with Sample Data

1. Click on **"When a Calendar Event is Created"** node
2. Click **"Listen for Test Event"**
3. Create event in Google Calendar
4. n8n will capture it and you can test the rest of the workflow

### Step 5: Activate the Workflow

1. Toggle the **"Active"** switch in top-right corner
2. Workflow is now running 24/7!

## 📝 How to Use

### Creating Appointments

**Method 1: Simple Event**

```
Event Title: Dental Checkup
Date/Time: Nov 25, 2025 @ 3:00 PM
Attendees: patient@example.com
```

**Method 2: Detailed Event**

```
Event Title: Hair Coloring Appointment
Date/Time: Nov 28, 2025 @ 11:00 AM
Location: Salon Suite 5, 456 Beauty Blvd
Description: Full head color + highlights
Attendees: sarah@example.com
```

**Method 3: Multiple Attendees**

```
Event Title: Team Meeting
Date/Time: Nov 30, 2025 @ 9:00 AM
Attendees:
  - alice@example.com (will get reminder)
  - bob@example.com
  - charlie@example.com
Note: Only the FIRST attendee gets the reminder
```

## 🔧 Customization Options

### Change Reminder Timing

Edit the **"Extract Event & Customer Data"** node:

```javascript
// Current: 1 day before at 10 AM
reminderDate.setDate(reminderDate.getDate() - 1);
reminderDate.setHours(10, 0, 0, 0);

// Options:
// 2 days before at 2 PM:
reminderDate.setDate(reminderDate.getDate() - 2);
reminderDate.setHours(14, 0, 0, 0);

// Same day at 8 AM:
reminderDate.setHours(8, 0, 0, 0);

// 3 hours before appointment:
reminderDate.setHours(reminderDate.getHours() - 3);
```

### Customize Message Template

Edit the **"Build Reminder Message"** node:

```javascript
// Add business branding
message = `Hi ${contactData.firstName},\\n\\n`;
message += `This is a friendly reminder from [Your Business Name]\\n\\n`;

// Add cancellation instructions
message += `\\n\\nNeed to reschedule? Reply CANCEL or call us at (555) 123-4567`;

// Add confirmation request
message += `\\n\\nPlease reply YES to confirm your attendance.`;

// Different tone
message = `Hey ${contactData.firstName}! 👋\\n\\n`;
message += `Don't forget - you've got ${eventData.eventTitle} coming up tomorrow!\\n`;
```

### Send Multiple Reminders

Clone the workflow and adjust timing:

- Workflow 1: 7 days before (early reminder)
- Workflow 2: 1 day before (day-before reminder)
- Workflow 3: 2 hours before (last-minute reminder)

### Filter by Calendar

In **"Check Event Has Attendees & DateTime"** node, add condition:

```javascript
// Only process events from specific calendar
{
  "value1": "={{ $json.calendarId }}",
  "operation": "equals",
  "value2": "your-calendar-id@group.calendar.google.com"
}
```

## 🎨 Advanced Use Cases

### 1. Service-Specific Messages

Add logic to customize message based on event title:

```javascript
let serviceType = eventData.eventTitle.toLowerCase();
let serviceEmoji = '📅';

if (serviceType.includes('haircut')) serviceEmoji = '✂️';
if (serviceType.includes('massage')) serviceEmoji = '💆';
if (serviceType.includes('dental')) serviceEmoji = '🦷';
if (serviceType.includes('doctor')) serviceEmoji = '🏥';

message = `${serviceEmoji} Hi ${contactData.firstName},\\n\\n`;
```

### 2. No-Show Prevention

Add a second workflow that:

- Triggers 2 hours after missed appointment
- Checks if customer confirmed
- Sends follow-up if they didn't show

### 3. Multi-Language Support

Check contact's language preference:

```javascript
const language = contactData.language || 'en';

const messages = {
  en: `Hi ${firstName}, this is a reminder...`,
  es: `Hola ${firstName}, este es un recordatorio...`,
  fr: `Bonjour ${firstName}, ceci est un rappel...`,
};

message = messages[language];
```

### 4. Attach Preparation Instructions

```javascript
if (eventTitle.includes('surgery') || eventTitle.includes('procedure')) {
  message += `\\n\\n⚠️ IMPORTANT: Do not eat or drink 8 hours before your appointment.`;
}

if (eventTitle.includes('lab work')) {
  message += `\\n\\n💉 Please bring your ID and insurance card.`;
}
```

## ⚠️ Important Notes

### Contact Requirements

- Customer **must exist** in your contacts database
- Customer **must have** a phone number
- Email in calendar **must match** email in contacts

### Error Handling

The workflow handles these scenarios:

- ✅ Event without attendees → Skipped (no reminder sent)
- ✅ Event without date/time → Skipped
- ✅ Contact not found → Logs error, no crash
- ✅ Contact without phone → Logs error, no crash

### Rate Limits

- Google Calendar polling: Every 1 minute
- If you create 10 events → 10 reminders scheduled
- Each reminder runs at its scheduled time

### Timezone Considerations

```javascript
// The workflow uses your server timezone
// Set in docker-compose.yaml:
GENERIC_TIMEZONE = America / New_York;

// Or in the code:
const eventDate = new Date(eventStart);
// Automatically uses the timezone from Google Calendar event
```

## 🐛 Troubleshooting

### "Contact not found"

- Check if email in calendar matches contact email exactly
- Case-sensitive: john@example.com ≠ John@Example.com
- Check company ID is correct

### "No phone number found"

- Verify contact has phoneNumber field populated
- Check database: `SELECT * FROM contacts WHERE email = 'customer@example.com'`

### "Login failed"

- Verify environment variables are set correctly
- Check if user account is active
- Test login manually with curl

### Reminder not sent

- Check if schedule was created (check backend logs)
- Verify scheduledAt time is in the future
- Check backend scheduler is running

### Workflow not triggering

- Verify Google Calendar connection is active
- Check if correct calendar is selected
- Ensure workflow is toggled "Active"
- Try creating event and wait 1-2 minutes

## 📊 Monitoring

View workflow executions:

1. Click on workflow name
2. Click "Executions" tab
3. See all runs with success/failure status

Check created schedules:

```bash
# Via API
curl http://localhost:3001/api/v1/companies/{companyId}/schedules \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎉 Success Metrics

After setup, you should see:

- ✅ New calendar events trigger workflow within 1 minute
- ✅ ~100% success rate for valid events with known contacts
- ✅ Reminders scheduled exactly 1 day before at 10 AM
- ✅ Customers receive SMS at scheduled time
- ✅ Reduced no-shows and improved appointment attendance

## 🔐 Security Best Practices

1. **Use dedicated service account** for n8n
2. **Don't share credentials** in workflow JSON
3. **Use environment variables** for all secrets
4. **Limit Google Calendar scope** to specific calendars
5. **Monitor execution logs** for suspicious activity
6. **Rotate passwords** regularly

## 📞 Support

If you need help:

1. Check n8n execution logs for error details
2. Test each node individually
3. Verify all credentials are correct
4. Check backend API is running and accessible
5. Review this guide's troubleshooting section

---

**Workflow Version**: 1.0  
**Last Updated**: November 16, 2025  
**Compatible with**: n8n v1.0+, Messaging Platform API v1
