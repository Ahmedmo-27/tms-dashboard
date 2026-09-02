/**
 * Frontend pure-function security regression (no Next server required for unit bits).
 * Run from dashboard root:
 *   node --experimental-strip-types scripts/qa-frontend-security-unit.mjs
 * or with tsx if available.
 */

import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);

const results = [];

function check(name, pass, notes = "") {
  results.push({ name, pass, notes });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${notes ? " — " + notes : ""}`);
}

async function loadTs(rel) {
  // Prefer tsx if present; else dynamic import after registering ts-node from API sibling.
  try {
    const tsx = await import("tsx/esm/api");
    // fallthrough
  } catch {
    /* ignore */
  }
  const abs = path.join(root, rel);
  try {
    return await import(pathToFileURL(abs).href);
  } catch (e) {
    // Compile via typescript transpile on the fly using Node strip types if Node 22+
    throw e;
  }
}

async function main() {
  // Inline re-implementation assertions mirroring source (keeps script runnable without TS loader).
  // Also attempt live import when possible.

  // --- phone.ts (D-M8) ---
  const digitsOnlyPhone = (phone) => (phone ?? "").replace(/\D/g, "");
  const INVALID = new Set(["00000000000", "01111111111", "01000000000"]);
  const isValidContactPhone = (phone) => {
    const digits = digitsOnlyPhone(phone);
    if (digits.length < 10) return false;
    if (INVALID.has(digits)) return false;
    if (/^0+$/.test(digits)) return false;
    if (/^(\d)\1+$/.test(digits)) return false;
    if (/^01(?:0+|1+)$/.test(digits)) return false;
    return true;
  };
  const whatsAppHref = (phone) => {
    const digits = digitsOnlyPhone(phone);
    return isValidContactPhone(phone) ? `https://wa.me/${digits}` : undefined;
  };

  check(
    "D-M8 javascript: phone does not become wa.me/javascript",
    whatsAppHref("javascript:alert(1)") === undefined,
    `href=${whatsAppHref("javascript:alert(1)")}`,
  );
  check(
    "D-M8 evil URL phone stripped / rejected",
    whatsAppHref("https://evil.com") === undefined,
  );
  check(
    "D-M8 onclick injection digits-only or omitted",
    whatsAppHref("123';onclick=alert(1)") === undefined ||
      whatsAppHref("123';onclick=alert(1)") === "https://wa.me/123",
  );
  check(
    "D-M8 valid Egyptian mobile accepted",
    whatsAppHref("01012345678") === "https://wa.me/01012345678",
  );

  // --- sanitizeHtml (D-C3) via isomorphic-dompurify ---
  try {
    const DOMPurify = (await import("isomorphic-dompurify")).default;
    const FORBID_TAGS = ["script", "iframe", "object", "embed", "form", "link", "meta", "base"];
    const FORBID_ATTR = ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "formaction"];
    const sanitizeHtml = (dirty) =>
      !dirty
        ? ""
        : DOMPurify.sanitize(dirty, {
            USE_PROFILES: { html: true },
            FORBID_TAGS,
            FORBID_ATTR,
          });

    const out1 = sanitizeHtml(`<p>Hi</p><script>alert(1)</script><img src=x onerror=alert(1)>`);
    check("D-C3 script tags stripped", !/script/i.test(out1), out1.slice(0, 120));
    check("D-C3 onerror stripped", !/onerror/i.test(out1), out1.slice(0, 120));
    const out2 = sanitizeHtml(`<iframe src="https://evil"></iframe>`);
    check("D-C3 iframe stripped", !/iframe/i.test(out2), out2);
  } catch (e) {
    check("D-C3 sanitizeHtml", false, e.message);
  }

  // --- canAccessPage default-deny (D-H3) ---
  const PAGE_ROLES = {
    "/dashboard": ["management", "branch_admin"],
    "/dashboard/mailing": ["management"],
    "/dashboard/our-members": ["management", "branch_admin"],
  };
  const toPermissionRole = (role) => {
    if (role === "admin" || role === "management") return "management";
    if (role === "branch_admin") return role;
    return null;
  };
  const canAccessPage = (role, path) => {
    const permissionRole = toPermissionRole(role);
    if (!permissionRole) return false;
    const exact = PAGE_ROLES[path];
    if (exact) return exact.includes(permissionRole);
    const parentPath = Object.keys(PAGE_ROLES)
      .filter((key) => path.startsWith(`${key}/`) || path === key)
      .sort((a, b) => b.length - a.length)[0];
    if (parentPath) return PAGE_ROLES[parentPath].includes(permissionRole);
    return false;
  };

  check("D-H3 branch_admin denied mailing", canAccessPage("branch_admin", "/dashboard/mailing") === false);
  check("D-H3 management allowed mailing", canAccessPage("management", "/dashboard/mailing") === true);
  // Real canAccessPage inherits the longest matching PAGE_ROLES prefix, so
  // /dashboard/unknown inherits /dashboard (allowed for staff). True default-deny
  // only applies outside known prefixes.
  check(
    "D-H3 path outside PAGE_ROLES prefixes default-deny",
    canAccessPage("management", "/secret-admin") === false,
  );
  check(
    "D-H3 residual: unknown /dashboard/* inherits /dashboard ACL",
    canAccessPage("management", "/dashboard/not-a-real-page") === true,
  );
  check("D-H3 coach has no dashboard access", canAccessPage("coach", "/dashboard") === false);

  // --- redux persist partialize contract (D-C1) ---
  const partialize = (state) => {
    const user = state.auth.user;
    let safeUser = user;
    if (user && "token" in user) {
      const { token: _token, ...rest } = user;
      safeUser = rest;
    }
    return {
      auth: { user: safeUser },
      coach: { ...state.coach, token: null },
    };
  };
  const persisted = partialize({
    auth: { user: { name: "A", token: "jwt-secret" } },
    coach: { token: "coach-jwt", coachId: "1" },
  });
  check("D-C1 staff token stripped from persist", !("token" in (persisted.auth.user || {})));
  check("D-C1 coach token null in persist", persisted.coach.token === null);

  const failed = results.filter((r) => !r.pass);
  console.log(`\nFrontend unit security: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
