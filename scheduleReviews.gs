function scheduleReviews() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const calendar = CalendarApp.getCalendarsByName("Career")[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const intervalMap = { 1: 14, 2: 7, 3: 2 };
  const lastRow = sheet.getLastRow();

  for (let row = 3; row <= lastRow; row++) {
    const problem = sheet.getRange(row, 2).getValue();
    const rating = sheet.getRange(row, 4).getValue();
    const lastReviewed = sheet.getRange(row, 5).getValue();

    if (!problem || !rating || !lastReviewed) continue;

    const interval = intervalMap[rating];
    if (!interval) continue;

    const reviewDate = new Date(lastReviewed);
    reviewDate.setHours(0, 0, 0, 0);
    reviewDate.setDate(reviewDate.getDate() + interval);

    if (reviewDate.getTime() !== today.getTime()) continue;

    const lastScheduled = sheet.getRange(row, 8).getValue();
    if (lastScheduled) {
      const lastScheduledDate = new Date(lastScheduled);
      lastScheduledDate.setHours(0, 0, 0, 0);
      if (lastScheduledDate.getTime() === today.getTime()) continue;
    }

    const reviewStart = new Date();
    reviewStart.setHours(4, 0, 0, 0);
    const reviewEnd = new Date();
    reviewEnd.setHours(4, 30, 0, 0);

    calendar.createEvent(`LC Review: ${problem}`, reviewStart, reviewEnd, {
      description: `Rating: ${rating} | Difficulty: ${sheet.getRange(row, 3).getValue()}`
    });

    sheet.getRange(row, 8).setValue(today);

    Logger.log(`Created event for: ${problem}`);
  }
}
