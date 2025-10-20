# CSV Import Formats Guide

## CSV Formatting Rules

**Important**: Use double quotes (`"`) around fields that contain:

- Commas (e.g., addresses, multiple values in a single field)
- Line breaks
- Special characters

Example: `"123 Main St, Apt 4"` or `"VIP,Staff,All"`

The parser is RFC 4180 compliant and handles quoted fields correctly.

---

## Contacts CSV

### Required Headers

```csv
firstName,lastName,phoneNumber,email,address,birthDate,note,groups
```

### Date Format Examples (birthDate)

The system accepts flexible date formats and automatically converts them:

| Input Format             | Example      | Notes                                                   |
| ------------------------ | ------------ | ------------------------------------------------------- |
| ISO format               | `1815-12-10` | Standard ISO date (YYYY-MM-DD)                          |
| Slash format             | `1815/12/10` | Also accepted (YYYY/MM/DD)                              |
| US format (2-digit year) | `12/10/15`   | Interpreted as MM/DD/YY (pivot: ≤30 = 20xx, >30 = 19xx) |
| US format (4-digit year) | `12/10/1815` | Interpreted as MM/DD/YYYY                               |
| Flexible US              | `6/23/1912`  | Single-digit month/day accepted (M/D/YYYY)              |

### Groups Format

Comma or semicolon-separated list:

- `VIP,Staff,All`
- `VIP; Staff; All`

Groups are automatically created if they don't exist.

### Example

```csv
firstName,lastName,phoneNumber,email,address,birthDate,note,groups
Ada,Lovelace,+1-555-0101,ada@example.com,"123 Computing St, London",1815-12-10,First computer programmer,VIP
Grace,Hopper,+1-555-0102,grace@example.com,"456 Navy Ave, NY",12/09/1906,Invented COBOL,"Staff,All"
Alan,Turing,+1-555-0103,alan@example.com,"789 Enigma Rd, Cambridge",6/23/1912,Father of computer science,VIP
```

---

## Schedules CSV

### Required Headers

```csv
name,scheduleType,content,recipientContacts,recipientGroups,scheduledAt,recurringDay,recurringDayOfMonth,recurringMonth,recurringDayOfYear
```

### Schedule Types

- `ONE_TIME` - Single scheduled message (requires `scheduledAt`)
- `WEEKLY` - Recurring weekly (requires `recurringDay`)
- `MONTHLY` - Recurring monthly (requires `recurringDayOfMonth`)
- `YEARLY` - Recurring yearly (requires `recurringMonth` and `recurringDayOfYear`)
- `BIRTHDAY` - Sends on contact birthdays (requires contacts with birthDate)

### DateTime Format Examples (scheduledAt for ONE_TIME)

All times are interpreted as UTC unless timezone is specified:

| Input Format               | Example                     | Notes                              |
| -------------------------- | --------------------------- | ---------------------------------- |
| Date and time with space   | `2025-12-01 10:00`          | Simple format (YYYY-MM-DD HH:mm)   |
| Date and time with seconds | `2025-12-01 10:00:00`       | With seconds (YYYY-MM-DD HH:mm:ss) |
| Slash separator            | `2025/12/01 10:00`          | Slash instead of dash              |
| US format                  | `12/01/2025 10:00`          | US date format (MM/DD/YYYY HH:mm)  |
| Full ISO with timezone     | `2025-12-01T10:00:00Z`      | Standard ISO 8601 format           |
| ISO with offset            | `2025-12-01T10:00:00-05:00` | With timezone offset               |

### Recipient Formats

**recipientContacts** - Full names separated by comma or semicolon:

- `Ada Lovelace, Grace Hopper`
- `Alan Turing; Grace Hopper`

Contacts must exist in the system before importing schedules.

**recipientGroups** - Group names separated by comma or semicolon:

- `VIP,Staff`
- `All; VIP`

Groups must exist in the system before importing schedules.

### Recurring Fields

| Field                 | Used For | Valid Values               | Example |
| --------------------- | -------- | -------------------------- | ------- |
| `recurringDay`        | WEEKLY   | MO, TU, WE, TH, FR, SA, SU | `FR`    |
| `recurringDayOfMonth` | MONTHLY  | 1-28                       | `15`    |
| `recurringMonth`      | YEARLY   | 1-12                       | `1`     |
| `recurringDayOfYear`  | YEARLY   | 1-31                       | `15`    |

All recurring schedules default to 09:00 local time.

### Content Placeholders

Use template variables in the content:

- `{{contact.firstName}}` - Contact's first name
- `{{contact.lastName}}` - Contact's last name
- `{{contact.email}}` - Contact's email
- `{{contact.phoneNumber}}` - Contact's phone number

### Example

```csv
name,scheduleType,content,recipientContacts,recipientGroups,scheduledAt,recurringDay,recurringDayOfMonth,recurringMonth,recurringDayOfYear
Weekly Newsletter,WEEKLY,"Hi {{contact.firstName}}! Check out this week's updates.",,"VIP,All",,FR,,
Monthly Reminder,MONTHLY,"Don't forget your monthly check-in, {{contact.firstName}}!",,"Staff",,,,15,
Birthday Greeting,BIRTHDAY,"Happy Birthday {{contact.firstName}}! 🎉 Have an amazing day!","Ada Lovelace,Grace Hopper",,,,,
Yearly Anniversary,YEARLY,"Happy anniversary! Thanks for being with us, {{contact.firstName}}.","Alan Turing",,,,,1,15
One-Time Launch,ONE_TIME,"Exciting news coming soon!",,"All",2025-12-01 10:00,,,
```

---

## Validation Rules

### Contacts

- `firstName`, `lastName`, `phoneNumber` are required (even if empty string in CSV)
- `birthDate` validation: rejects unparseable dates
- Maximum 20 groups per contact
- Group names max 100 characters
- Maximum 2000 rows per import

### Schedules

- `name`, `scheduleType`, `content` are required
- At least one recipient (contact or group) required
- Type-specific required fields must be present
- Contact names must match existing contacts exactly (case-insensitive)
- Group names must match existing groups exactly (case-insensitive)
- Maximum 500 rows per import

### Error Handling

- Imports process all rows
- Failed rows return error messages with row index
- Successful rows are created even if other rows fail
- Import summary shows: `createdCount`, `errorCount`, detailed error list
