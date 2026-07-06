const TOPICS = ["Arrays & Hashing","Two Pointers","Sliding Window","Stack","Binary Search",
  "Linked List","Trees","Tries","Heap","Backtracking","Graphs","Advanced Graphs",
  "1D DP","2D DP","Greedy","Intervals","Math & Geometry","Bit Manipulation"];

// One-time setup: builds Topics + Queue tabs. Guard prevents rerun from wiping data.
function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (ss.getSheetByName("Topics") || ss.getSheetByName("Queue")) {
    throw new Error("Topics or Queue tab already exists. Delete them first if you want a rebuild.");
  }

  const t = ss.insertSheet("Topics");
  t.appendRow(["Topic","Rating","Consecutive Greens","Last Reviewed","Next Due","Notes"]);
  const today = new Date(); today.setHours(0,0,0,0);

  TOPICS.forEach((topic, i) => {
    const due = new Date(today);
    due.setDate(due.getDate() + 1 + Math.floor(i * 17 / TOPICS.length));
    t.appendRow([topic, "yellow", 0, "", due, ""]);
  });

  const ratingRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["red","yellow","green"], true).build();
  t.getRange(2, 2, TOPICS.length, 1).setDataValidation(ratingRule);

  const q = ss.insertSheet("Queue");
  q.appendRow(["Problem","Topic","Date Flagged","Visits"]);
  const topicRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(TOPICS, true).build();
  q.getRange(2, 2, 100, 1).setDataValidation(topicRule);

  Logger.log("Done. Edit the Rating column, then reorder Next Due dates.");
}

// Daily trigger (2-3am): picks up to 2 most overdue topics + up to 2 queue pulls,
// creates one calendar event. Topics with blank Next Due are skipped (not yet learned / green-dropped).
function scheduleMorningSession() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const topics = ss.getSheetByName("Topics");
  const queue = ss.getSheetByName("Queue");
  const calendar = CalendarApp.getCalendarsByName("Career")[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tData = topics.getDataRange().getValues(); // row 0 = headers

  const candidates = [];
  for (let i = 1; i < tData.length; i++) {
    const topic = tData[i][0];
    const nextDue = tData[i][4];
    if (!topic || !nextDue) continue;
    const due = new Date(nextDue);
    due.setHours(0, 0, 0, 0);
    const overdueDays = (today - due) / 86400000;
    if (overdueDays >= 0) candidates.push({ topic, row: i + 1, overdueDays });
  }
  if (!candidates.length) { Logger.log("No topic due today."); return; }
  candidates.sort((a, b) => b.overdueDays - a.overdueDays);
  const picks = candidates.slice(0, 2);

  const qData = queue.getDataRange().getValues();
  const pulled = [];
  for (let i = 1; i < qData.length && pulled.length < 2; i++) {
    if (qData[i][0]) pulled.push({ name: qData[i][0], topic: qData[i][1] });
  }

  const start = new Date(); start.setHours(4, 0, 0, 0);
  const end = new Date(); end.setHours(4, 45, 0, 0);

  const title = `LC Morning: ${picks.map(p => p.topic).join(" + ")}`;
  const desc = [
    picks.map(p => `Topic: ${p.topic}`).join("\n"),
    `Verbalize both patterns first.`,
    pulled.length ? `Queue pulls:\n${pulled.map(p => `- ${p.name} (${p.topic})`).join("\n")}` : "Queue empty.",
    `3-4 recall problems total, split across topics.`
  ].join("\n\n");

  calendar.createEvent(title, start, end, { description: desc });
  picks.forEach(p => topics.getRange(p.row, 4).setValue(today)); // stamp Last Reviewed
}

// Auto-fires on any cell edit. When Rating (col B) changes on Topics tab,
// writes Next Due (col E): red +3, yellow +7, green +14.
function onEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== "Topics") return;
  if (e.range.getColumn() !== 2 || e.range.getRow() < 2) return;

  const intervals = { red: 3, yellow: 7, green: 14 };
  const days = intervals[e.value];
  if (!days) return;

  const due = new Date();
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + days);
  sheet.getRange(e.range.getRow(), 5).setValue(due);
}
