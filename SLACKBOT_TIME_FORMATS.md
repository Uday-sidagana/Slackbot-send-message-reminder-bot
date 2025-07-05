# 🤖 Slackbot Deterministic Time Formats Reference

## 📋 Basic Format Structure

```
@Slackbot [TIME_SPEC] message thread: <thread-link>
```

**Key Components:**
- `@Slackbot` - Case-insensitive trigger
- `[TIME_SPEC]` - Time specification in brackets (see formats below)
- `message` - Your reminder message
- `thread: <thread-link>` - Link to the Plain thread

---

## ⏰ Supported TIME_SPEC Formats

### 1. 🕐 Relative Time (Minutes & Hours)

Perfect for your 10-minute scheduling preferences:

| Format | Example | Description |
|--------|---------|-------------|
| `[+10m]` | `@Slackbot [+10m] check API docs thread: <link>` | 10 minutes from now |
| `[+20m]` | `@Slackbot [+20m] follow up with client thread: <link>` | 20 minutes from now |
| `[+30m]` | `@Slackbot [+30m] review proposal thread: <link>` | 30 minutes from now |
| `[+1h]` | `@Slackbot [+1h] deployment check thread: <link>` | 1 hour from now |
| `[+2h]` | `@Slackbot [+2h] team meeting thread: <link>` | 2 hours from now |
| `[+2h30m]` | `@Slackbot [+2h30m] project review thread: <link>` | 2 hours 30 minutes from now |

### 2. 🌅 Today's Specific Time

Schedule for specific times today (or tomorrow if time has passed):

| Format | Example | Description |
|--------|---------|-------------|
| `[11:20PM]` | `@Slackbot [11:20PM] call the client thread: <link>` | 11:20 PM today/tomorrow |
| `[1:40AM]` | `@Slackbot [1:40AM] check credentials thread: <link>` | 1:40 AM today/tomorrow |
| `[9:30AM]` | `@Slackbot [9:30AM] morning standup thread: <link>` | 9:30 AM today/tomorrow |
| `[13:00]` | `@Slackbot [13:00] review docs thread: <link>` | 1:00 PM (24-hour format) |
| `[23:45]` | `@Slackbot [23:45] end of day summary thread: <link>` | 11:45 PM (24-hour format) |

### 3. 🌄 Tomorrow's Time

Explicitly schedule for tomorrow:

| Format | Example | Description |
|--------|---------|-------------|
| `[T+11:20PM]` | `@Slackbot [T+11:20PM] remind me tomorrow thread: <link>` | 11:20 PM tomorrow |
| `[T+1:40AM]` | `@Slackbot [T+1:40AM] early morning reminder thread: <link>` | 1:40 AM tomorrow |
| `[T+9:00AM]` | `@Slackbot [T+9:00AM] morning task thread: <link>` | 9:00 AM tomorrow |
| `[T+13:00]` | `@Slackbot [T+13:00] afternoon check thread: <link>` | 1:00 PM tomorrow (24-hour) |

### 4. 📅 Specific Date & Time

Schedule for any future date:

| Format | Example | Description |
|--------|---------|-------------|
| `[2025-07-08@13:00]` | `@Slackbot [2025-07-08@13:00] quarterly report thread: <link>` | July 8, 2025 at 1:00 PM |
| `[2025-07-08@1:20PM]` | `@Slackbot [2025-07-08@1:20PM] client meeting thread: <link>` | July 8, 2025 at 1:20 PM |
| `[2025-12-25@9:00AM]` | `@Slackbot [2025-12-25@9:00AM] Christmas reminder thread: <link>` | Christmas morning |
| `[2025-07-15@23:30]` | `@Slackbot [2025-07-15@23:30] late night task thread: <link>` | July 15, 2025 at 11:30 PM |

---

## 🎯 Your Preferred 10-Minute Scheduling Examples

Based on your scheduling preferences:

```
@Slackbot [+10m] check API documentation thread: <link>
@Slackbot [+20m] follow up with client thread: <link>
@Slackbot [11:00PM] call team member thread: <link>
@Slackbot [11:10PM] review proposal thread: <link>
@Slackbot [11:20PM] send status update thread: <link>
@Slackbot [11:30PM] check deployment thread: <link>
@Slackbot [11:40PM] backup reminder thread: <link>
@Slackbot [11:50PM] end of day tasks thread: <link>
@Slackbot [12:00AM] midnight check thread: <link>
@Slackbot [12:10AM] late night reminder thread: <link>
```

---

## 🚀 Benefits of Deterministic Format

### ✅ **100% Accuracy**
- No more NLP parsing failures
- Regex-based parsing for reliability
- Instant processing without AI delays

### ✅ **Performance Optimized**
- No OpenAI API calls needed
- 20x fewer database queries (10-min intervals vs 30-sec)
- Reduced server load and costs

### ✅ **Your Preferred Style**
- Perfect for 10-minute multiple scheduling
- Supports all your common time patterns
- Flexible enough for any scheduling need

### ✅ **Backward Compatible**
- Old natural language format still works
- Automatic fallback to OpenAI parsing
- No disruption to existing workflows

---

## 🔧 Technical Details

### **Parsing Priority:**
1. **Deterministic parsing** (new format) - 100% accuracy
2. **OpenAI fallback** (old format) - for backward compatibility

### **10-Minute Optimization:**
- Database scans every 10 minutes at :00, :10, :20, :30, :40, :50
- ±2 minute window for sending reminders
- Efficient resource usage

### **Timezone:**
- All times processed in **Asia/Kolkata (IST)**
- Automatic date adjustment for past times

---

## 📋 Quick Reference Card

**Copy-paste these examples and modify as needed:**

```
# Quick reminders
@Slackbot [+10m] your message here thread: <link>
@Slackbot [+20m] your message here thread: <link>

# Today's schedule
@Slackbot [11:20PM] your message here thread: <link>
@Slackbot [1:40AM] your message here thread: <link>

# Tomorrow's schedule
@Slackbot [T+11:20PM] your message here thread: <link>
@Slackbot [T+9:00AM] your message here thread: <link>

# Specific date (July 8, 2025 example)
@Slackbot [2025-07-08@13:00] your message here thread: <link>
@Slackbot [2025-07-08@1:20PM] your message here thread: <link>
```

---

## 🆘 Troubleshooting

### **Format not working?**
1. Ensure brackets `[]` are around the time spec
2. Check for typos in time format
3. Verify thread link is included
4. Falls back to OpenAI parsing if deterministic fails

### **Common Mistakes:**
- ❌ `@Slackbot +10m` (missing brackets)
- ❌ `@Slackbot [10m]` (missing + for relative time)
- ❌ `@Slackbot [11:20]` (missing AM/PM for 12-hour format)
- ✅ `@Slackbot [+10m]` (correct relative format)
- ✅ `@Slackbot [11:20PM]` (correct 12-hour format)

---

*Last updated: July 2025*
*System: SlackBot Scheduler v2.0 with Deterministic Parsing* 