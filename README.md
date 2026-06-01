# LeetCode Spaced Repetition Tracker

A Google Apps Script that automatically schedules LeetCode review sessions to your Google Calendar using a spaced repetition system — so you wake up every morning knowing exactly what to review.

## How It Works

After solving a problem, you log it in a Google Sheet and rate your confidence 1–3. The script calculates your next review date based on that rating and creates a calendar event at 4am so it's ready when you wake up.

| Rating | Meaning | Review Interval |
|--------|---------|----------------|
| 1 | Mastered | 14 days |
| 2 | Moderate | 7 days |
| 3 | Needs work | 2 days |

## Sheet Structure

| Col | Field | Notes |
|-----|-------|-------|
| B | Problem name | e.g. "Two Sum" |
| C | Difficulty | Easy / Medium / Hard |
| D | Rating (1–3) | Your confidence score |
| E | Last Reviewed | Date you last did the problem |
| F | Explain Runtime? | Yes / No |
| G | Notes | Optional notes |
| H | Last Scheduled | Auto-filled by script — do not edit |

> Row 2 is the header row. Data starts at row 3.

## Setup

### 1. Copy the sheet structure
Set up your Google Sheet with the columns above.

### 2. Add the script
1. In your sheet, go to **Extensions → Apps Script**
2. Delete any existing code and paste in `scheduleReviews.gs`
3. Save

### 3. Customize the script
Two lines need to match your setup:

**Line 2 — Calendar name:**
```js
const calendar = CalendarApp.getCalendarsByName("Career")[0];
```
Replace `"Career"` with the name of your Google Calendar exactly as it appears.

Example: if your calendar is called `"Coding"`:
```js
const calendar = CalendarApp.getCalendarsByName("Coding")[0];
```

**Lines 28–29 — Event time:**
```js
reviewStart.setHours(4, 0, 0, 0);
reviewEnd.setHours(4, 30, 0, 0);
```
Replace `4` with whatever hour you want the event to appear (24-hour format). The event is 30 minutes long by default.

Example: to schedule at 5am instead:
```js
reviewStart.setHours(5, 0, 0, 0);
reviewEnd.setHours(5, 30, 0, 0);
```

### 4. Create a Calendar
Create a Google Calendar with the name you set on line 2 above.

### 4. Set the trigger
1. In Apps Script, click the **clock icon** (Triggers) in the left sidebar
2. Click **+ Add Trigger**
3. Configure:
   - **Function:** `scheduleReviews`
   - **Event source:** Time-driven
   - **Type:** Day timer
   - **Time:** 3am to 4am

The script fires once daily in that window, creating calendar events for any problems due that day.

## Usage

1. Solve a problem → log it in the sheet with a rating and today's date in Last Reviewed
2. The script automatically creates a `LC Review: [Problem Name]` event at 4–4:30am on your review date
3. Wake up, check your calendar, do your reviews
4. After reviewing, update the rating and Last Reviewed date in the sheet — the next cycle starts automatically

## Duplicate Prevention

Column H stores the date an event was last scheduled for each problem. If the script runs multiple times in a day, it checks H before creating an event and skips it if one was already created today. When you re-review a problem and update Last Reviewed, H no longer matches the new review date so the next cycle schedules correctly.

## Notes

- Don't manually edit column H — it's managed by the script
- Make sure your Google Calendar is named exactly as specified in the script (`Career` by default)
- The trigger fires somewhere in the 3–4am window, so events are always ready before you wake up
