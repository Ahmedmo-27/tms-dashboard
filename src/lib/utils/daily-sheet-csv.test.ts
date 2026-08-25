import assert from "node:assert/strict";
import {
  parseDailySheetCsv,
  parseSheetCsvFilenameDate,
  serializeDailySheetCsv,
  dailySheetCsvFilename,
  buildUncompressedZip,
  sheetCsvHeaderDateToIso,
} from "./daily-sheet-csv";

const SAMPLE = `Daily Check In 30/7,Name,Member,Payment,Payment Method,Purpose,Number,iD,On Sheet,On App,,,,SPACE/PT,Name,Member,Payment,Payment Method,Purpose,Number,ID,On Sheet,On App
Strength 7:30 Am,Hana Khaled,,,,,,,,,,,,1,Nermeen Iskandar,Space membership,,,,,,,
1,Radwa Rostom,,450,Cash,Drop in,,,,Done,,,,2,hamza ahmed,Space membership,,,,,,,
2,Mohamed Sallam,,450,Visa,Drop in,,,,Done,,,,3,hala ahmed,Space membership,,,,,,,
3,Markos,Ft App member,,,,,,,,,,,4,Ahmed Abdelhamid,,400,Visa,Drop in Space,,,,Done
4,,,,,,,,,,,,,,,
Mat Pilates 9 am,Randa,,,,,,,,,,,,10,Ahmed Ezzat,FOC,,,,,,,
1,Daniella Tinawi,ST App member,,,,,,,,Maram,1147151790,,11,Rana Gabr,Pre/Post with Dana,,,,,,,
`;

const parsed = parseDailySheetCsv(SAMPLE);

assert.equal(parsed.headerDate, "30/7");
assert.equal(parsed.classes.length, 2);
assert.equal(parsed.classes[0].title, "Strength 7:30 Am");
assert.equal(parsed.classes[0].coachName, "Hana Khaled");
assert.equal(parsed.classes[0].rows.length, 3);
assert.equal(parsed.classes[0].rows[0].name, "Radwa Rostom");
assert.equal(parsed.classes[0].rows[0].amount, 450);
assert.equal(parsed.classes[0].rows[0].paymentMethod, "Cash");
assert.equal(parsed.classes[0].rows[0].purpose, "Drop in");
assert.equal(parsed.classes[0].rows[2].memberLabel, "Ft App member");
assert.equal(parsed.classes[1].title, "Mat Pilates 9 am");
assert.equal(parsed.classes[1].rows[0].name, "Daniella Tinawi");
assert.equal(parsed.classes[1].rows[0].memberLabel, "ST App member");

assert.ok(parsed.spacePt.length >= 5);
assert.equal(parsed.spacePt[0].name, "Nermeen Iskandar");
assert.equal(parsed.spacePt[0].memberLabel, "Space membership");
const dropInSpace = parsed.spacePt.find((p) => p.name === "Ahmed Abdelhamid");
assert.ok(dropInSpace);
assert.equal(dropInSpace!.amount, 400);
assert.equal(dropInSpace!.purpose, "Drop in Space");

const csv = serializeDailySheetCsv({
  date: "2026-07-30",
  classes: parsed.classes,
  spacePt: parsed.spacePt,
});
const roundTrip = parseDailySheetCsv(csv);
assert.equal(roundTrip.classes[0].title, "Strength 7:30 Am");
assert.equal(roundTrip.classes[0].coachName, "Hana Khaled");
assert.equal(roundTrip.classes[0].rows[0].name, "Radwa Rostom");
assert.equal(roundTrip.spacePt[0].name, "Nermeen Iskandar");
assert.match(csv, /Daily Check In 30\/7/);
assert.match(csv, /SPACE\/PT/);

assert.equal(
  parseSheetCsvFilenameDate("DAILY CHECK INS - July 2026 - Thu 30_7.csv"),
  "2026-07-30"
);
assert.match(
  dailySheetCsvFilename("2026-07-30", "New Cairo"),
  /DAILY CHECK INS - July 2026 - Thu 30_7 - New Cairo\.csv/
);

const zip = buildUncompressedZip([
  { name: "a.csv", content: "name\n" },
  { name: "b.csv", content: "name\n" },
]);
assert.ok(zip.size > 30);

const julyLike = `Daily Check In 1/7,Name,Member,Payment,Payment Method,Purpose,Number,iD,On Sheet,On App,,,,SPACE/PT,Name,Member,Payment,Payment Method,Purpose,Number,ID,On Sheet,On App
Conditioning 7:30,Coach,,,,,,,,,,,,1,Guest,Inv From Ali,,,,,,,
1,Nadine,,450 (10%),Visa,Drop in,,,,will pay next time,,,,2,Shop,,350,Cash,Weleda,,,,
Ladies Workout 11,Coach,,,,,,,,,,,,
1,Phone Member,1000727794.0,,,,,,,,,,,
2,Split,,1925+325,Cash,10 FT,,,,,,,,
`;

const julyParsed = parseDailySheetCsv(julyLike);
assert.ok(julyParsed.classes.some((block) => block.title === "Conditioning 7:30"));
assert.ok(julyParsed.classes.some((block) => block.title === "Ladies Workout 11"));
const nadine = julyParsed.classes[0].rows.find((row) => row.name === "Nadine");
assert.ok(nadine);
assert.equal(nadine!.amount, 450);
assert.equal(nadine!.note, "will pay next time");
const phoneRow = julyParsed.classes
  .flatMap((block) => block.rows)
  .find((row) => row.name === "Phone Member");
assert.ok(phoneRow);
assert.equal(phoneRow!.memberLabel, "");
assert.equal(phoneRow!.phone, "01000727794");
const split = julyParsed.classes
  .flatMap((block) => block.rows)
  .find((row) => row.name === "Split");
assert.ok(split);
assert.equal(split!.amount, null);
assert.equal(split!.amountText, "1925+325");
const invite = julyParsed.spacePt.find((row) => row.name === "Guest");
assert.ok(invite);
assert.equal(invite!.note, "Inv From Ali");

const abbreviated = `Daily Check In 30/7,Name,Member,Payment,Payment Method,Purpose,Number,iD,On Sheet,On App,,,,SPACE/PT,Name,Member,Payment,Payment Method,Purpose,Number,ID,On Sheet,On App
FT 7:30,Coach,,,,,,,,,,,,
1,Mona,Ft App member,,,,,,,,,,,
Cond 11,Coach,,,,,,,,,,,,
1,Salma,,450,Cash,Drop in,,,,,,,,
RF 8,Coach,,,,,,,,,,,,
1,Yara,St App member,,,,,,,,,,,
`;

const abbreviatedParsed = parseDailySheetCsv(abbreviated);
assert.deepEqual(
  abbreviatedParsed.classes.map((block) => block.title),
  ["FT 7:30", "Cond 11", "RF 8"]
);
assert.equal(abbreviatedParsed.classes[1].rows[0].name, "Salma");

assert.equal(abbreviatedParsed.headerDate, "30/7");
assert.equal(sheetCsvHeaderDateToIso("30/7", 2026), "2026-07-30");
assert.equal(sheetCsvHeaderDateToIso("1/7", 2026), "2026-07-01");
assert.equal(sheetCsvHeaderDateToIso(undefined, 2026), undefined);
assert.equal(sheetCsvHeaderDateToIso("30/13", 2026), undefined);

console.log("daily-sheet-csv tests passed");
