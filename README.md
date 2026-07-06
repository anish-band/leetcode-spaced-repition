# LeetCode Topic-Based Spaced Repetition Tracker

A Google Apps Script that schedules topic-level review sessions to Google Calendar. Wake up to one calendar event telling you exactly which patterns to review.

## Why v2 Exists

v1 scheduled reviews **per problem**: every solved problem entered a review queue with its own interval. This works early, but the queue grows linearly with problems solved — by ~80 problems it demanded 6+ reviews/day on top of new problems, which is not sustainable and not useful. Worse, repeatedly re-solving the same problems trains recall of *those solutions*, not the underlying patterns. Ratings inflated ("mastered" problems whose pattern I couldn't apply to anything unseen).

v2 changes the unit of review from **problem** to **pattern**:

- ~18 topics rotate through morning sessions instead of hundreds of problems
- Sessions are recall-based: verbalize the pattern cold (recognition cues, template, variations), then 3–4 recall problems — at least one unseen
- A small FIFO queue catches recent failures so they get reviewed within a day or two instead of waiting for their topic's turn
- Tracking is ~18 rows + a queue that should rarely exceed 4 items, instead of one row per problem forever

## How It Works

**Daily (automated):** A trigger fires at 2–3am. The script picks the 2 most overdue topics, pulls up to 2 queued problems, and creates one `LC Morning: [Topic A] + [Topic B]` calendar event.

**Morning (you):** Do the session. Rate each topic red / yellow / green via dropdown — an `onEdit` trigger auto-computes the next review date:

| Rating | Meaning | Next review |
|--------|---------|-------------|
| red | Couldn't produce the pattern cold | +3 days |
| yellow | Partial — verbalization or unseen problem shaky | +7 days |
| green | Cold verbalization complete AND handled an unseen problem | +14 days |

**Evening (you):** New problems as usual. If a problem required outside help to reach working code, add one row to the Queue tab. It appears in a morning event automatically.

## Sheet Structure

Two tabs, both created by `setupSystem()`:

**Topics**
| Col | Field | Notes |
|-----|-------|-------|
| A | Topic | e.g. "Sliding Window" |
| B | Rating | red / yellow / green dropdown — triggers auto-scheduling |
| C | Consecutive Greens | Manual counter |
| D | Last Reviewed | Auto-stamped by the script |
| E | Next Due | Auto-set on rating change. **Blank = out of rotation** (topic not yet learned, or parked) |
| F | Notes | e.g. which problems were historical struggles |

**Queue**
| Col | Field | Notes |
|-----|-------|-------|
| A | Problem | Name of the failed problem |
| B | Topic | Dropdown |
| C | Date Flagged | When it was failed |
| D | Visits | 0 on entry. After a failed revisit: set to 1, move row to bottom. After a second fail: delete the row and rate the topic red instead — three fails is a pattern gap, not a problem gap |

> Row 1 is headers. Topics you haven't learned yet keep a blank Next Due until they enter rotation (set Rating to red once learned — the +3 date seeds automatically).

## Setup

1. **Add the script:** Extensions → Apps Script, paste in the full script file, save.
2. **Match the calendar name:** in `scheduleMorningSession`, `getCalendarsByName("Career")` must exactly match your calendar's name.
3. **Match the event time:** the two `setHours` lines in `scheduleMorningSession` (default 4:00–4:45am, 24-hour format).
4. **Run `setupSystem` once** (select it in the function dropdown → Run). Creates both tabs, all topics, dropdowns, and staggered starting dates. It refuses to run if the tabs already exist, so it can't wipe real data.
5. **Adjust the Topics tab:** set honest initial ratings, blank out Next Due for topics not yet learned, and reorder starting dates so weak topics come first (max 2 topics per date).
6. **Set the trigger:** Triggers (clock icon) → Add Trigger → `scheduleMorningSession` → Time-driven → Day timer → 2–3am. `onEdit` needs no trigger — it runs automatically.

## Usage

1. Morning: open the calendar event, verbalize both patterns cold, do 3–4 recall problems (queue pulls count against that), rate each topic via dropdown
2. Queue pulls: recalled fine → delete the row; failed → Visits = 1, move to bottom
3. Evening: new problems. Genuine fail (needed the solution, or knew the approach but couldn't implement) → one Queue row
4. Newly finished topic → set its Rating to red to enter it into rotation

## Scheduling Behavior

- The script only reads **Next Due** — Rating is a label, the date is the schedule (which is why `onEdit` links them)
- More than 2 topics due on one day: the script takes the 2 most overdue; the rest win automatically on following mornings. Occasional overflow self-drains
- A **persistently growing** overdue list means demand exceeds 2 sessions/day — loosen the yellow interval, not red
- The same topic re-rating red repeatedly means morning recall isn't enough for it — it needs a dedicated evening session

## Notes

- Column D (Topics) and event creation are script-managed; everything else is manual by design — the script can't know how a session went
- Running `onEdit` manually from the editor throws an error (`e` is undefined) — this is meaningless, it only works on real edits
- Trigger config lives in the Apps Script UI, not the code — it must be re-created if the script is copied to a new sheet
