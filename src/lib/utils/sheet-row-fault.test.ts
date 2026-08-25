import assert from "node:assert/strict";
import { explainSheetRowFault } from "./sheet-row-fault";

const row = {
  name: "Daniella Tinawi",
  memberLabel: "ST App member",
  purpose: "",
};

const mismatch = explainSheetRowFault(
  row,
  'This member has an active package, but it does not include "Mat Pilates 9 am".',
  "PACKAGE_DOES_NOT_OPEN_CLASS",
);
assert.equal(
  mismatch.includes("catalog package"),
  false,
  "class mismatch must not be explained as a catalog purpose mismatch",
);
assert.match(mismatch, /does not include this class/i);

const legacyGeneric = explainSheetRowFault(row, "No active packages found");
assert.equal(
  legacyGeneric.includes("catalog package"),
  false,
  "legacy 'No active packages found' must not be explained as a catalog purpose mismatch",
);

const catalog = explainSheetRowFault(
  { name: "Hana", purpose: "10 Studio" },
  'Could not match a catalog package for "10 Studio"',
  "PACKAGE_NOT_MATCHED",
);
assert.match(catalog, /10 Studio/);
assert.match(catalog, /catalog package/);

const session = explainSheetRowFault(
  row,
  "This class row is missing its session",
  "SESSION_MISSING",
);
assert.match(session, /scheduled class/);

const retail = explainSheetRowFault(
  { name: "Shop", purpose: "Weleda" },
  "Product sale, not a check-in",
  "INVALID_ROW",
);
assert.match(retail, /Retail product sales/i);

const willPay = explainSheetRowFault(
  { name: "Hana", memberLabel: "will pay" },
  "Skipped — will pay / will renew (kept in Notes)",
  "UNMAPPED_MEMBERSHIP",
);
assert.match(willPay, /will pay/i);

console.log("sheet-row-fault tests passed");
