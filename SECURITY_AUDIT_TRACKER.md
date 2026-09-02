# Frontend Security & Quality Audit Tracker

Progress is updated as each finding is fixed. Scope: all findings (Critical–Style). Auth approach: frontend-safe (no JWT in localStorage; staff HttpOnly cookie; coach token memory-only). API cookie redesign is documented at the bottom for a later backend pass.

## Progress

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| C1 | JWTs persisted to localStorage via redux-persist | Critical | Fixed |
| C2 | Staff JWT returned to browser / Redux | Critical | Fixed |
| C3 | Unsanitized inbox HTML | Critical | Fixed |
| C4 | Sent-mail body as raw HTML | Critical | Fixed |
| C5 | Radix Select category not in FormData | Critical | Fixed |
| C6 | Radix Select paymentMethod not in FormData | Critical | Fixed |
| C7 | isLoading stuck after successful dialog submit | Critical | Fixed |
| H1 | No middleware — client-only route guards | High | Fixed |
| H2 | RequireAuth trusts persisted Redux | High | Fixed |
| H3 | canAccessPage default-allows unknown paths | High | Fixed |
| H4 | Open /api/test-login | High | Fixed |
| H5 | Open /api/test-config | High | Fixed |
| H6 | Cookie SameSite=None + long maxAge | High | Fixed |
| H7 | RequireCoachAuth fabricates cookie_token | High | Fixed |
| H8 | No CSP / clickjacking headers | High | Fixed |
| H9 | Next.js below security line | High | Fixed |
| H10 | Build ignores TS/ESLint errors | High | Fixed |
| H11 | Tickets list swallows fetch errors | High | Fixed |
| H12 | Walk-in field errors never displayed | High | Fixed |
| M1 | 401 interceptor does not clear session | Medium | Fixed |
| M2 | Password echoed into login defaultValues | Medium | Fixed |
| M3 | Weak client password schema | Medium | Fixed |
| M4 | Socket.IO connects without auth token | Medium | Fixed |
| M5 | Incomplete cookie deletion | Medium | Fixed |
| M6 | No CSRF tokens on credentialed API calls | Medium | Documented |
| M7 | UI-only role/branch checks | Medium | Partial |
| M8 | Unvalidated phone in wa.me href | Medium | Fixed |
| M9 | Member register validation / a11y | Medium | Fixed |
| M10 | Badge used as clickable control | Medium | Fixed |
| M11 | Magic message length === 24 for user-id | Medium | Fixed |
| L1 | PII / flow logging in login paths | Low | Fixed |
| L2 | Dead duplicate walk-in dialog | Low | Fixed |
| L3 | Unused imports / dead state | Low | Fixed |
| L4 | Icon-only buttons missing accessible names | Low | Fixed |
| L5 | Empty DialogTitle in check-in selector | Low | Fixed |
| S1 | Inconsistent form stacks | Style | Documented |
| S2 | Widespread as any on action state | Style | Partial |
| S3 | Typo Attendnace in UI | Style | Fixed |

---

## Findings

### C1 JWTs persisted to localStorage via redux-persist
- **Severity / Category:** Critical / Security
- **Status:** Fixed
- **Where:** `src/lib/store/store.ts`
- **What:** `auth` and `coach` slices (including coach JWT) were whitelisted into redux-persist → `localStorage`.
- **Why it happened:** Persist was enabled for convenience so refresh kept sessions; tokens were not excluded.
- **How fixed:** Added `partialize` so `coach.token` is always written as `null` and any `token` field is stripped from `auth.user` before persist.

### C2 Staff JWT returned to browser and stored in Redux
- **Severity / Category:** Critical / Security
- **Status:** Fixed
- **Where:** `src/lib/data/auth.ts`, `src/lib/store/features/authSlice.ts`, `login-form.tsx`
- **What:** Login returned full payload including `token`; client dispatched it into Redux.
- **Why it happened:** Server action forwarded API login JSON unchanged after setting HttpOnly cookie.
- **How fixed:** `login()` still `setToken()`s HttpOnly cookie, then strips `token` for staff responses. Coach responses still include token for memory Bearer. `setCredentials` also strips `token` if present.

### C3 Unsanitized email HTML via dangerouslySetInnerHTML
- **Severity / Category:** Critical / Security
- **Status:** Fixed
- **Where:** `src/app/dashboard/mailing/received/page.tsx`
- **What:** Inbox HTML rendered without sanitization.
- **Why it happened:** Mail preview assumed trusted HTML.
- **How fixed:** Added `isomorphic-dompurify` + `src/lib/utils/sanitize-html.ts`; inbox uses `sanitizeHtml()` before `dangerouslySetInnerHTML`.

### C4 Sent-mail body rendered as raw HTML
- **Severity / Category:** Critical / Security
- **Status:** Fixed
- **Where:** `src/app/dashboard/mailing/sent/page.tsx`
- **What:** Sent body treated as HTML though compose is plain text.
- **Why it happened:** Viewer reused HTML rendering path.
- **How fixed:** Render body as plain text with `whitespace-pre-wrap` (no `dangerouslySetInnerHTML`).

### C5 Radix Select category never reaches FormData
- **Severity / Category:** Critical / Quality
- **Status:** Fixed
- **Where:** `add-package.tsx`, `edit-package.tsx`
- **What:** `name="category"` on Radix Select does not submit.
- **Why it happened:** Radix Select is not a native form control.
- **How fixed:** Added `<input type="hidden" name="category" value={selectedCategory} />`.

### C6 Radix Select paymentMethod missing from FormData
- **Severity / Category:** Critical / Quality
- **Status:** Fixed
- **Where:** `payment-selector-dialog.tsx`
- **What:** Payment method never submitted with the form.
- **Why it happened:** Same Radix Select FormData gap.
- **How fixed:** Hidden input `name="paymentMethod"` bound to `selectedPaymentMethod`.

### C7 isLoading stuck true after successful submit
- **Severity / Category:** Critical / Quality
- **Status:** Fixed
- **Where:** `add-walk-in.tsx`, `payment-selector-dialog.tsx`
- **What:** Success path left `isLoading` true; Submit stayed disabled.
- **Why it happened:** `setIsLoading(true)` without reset on success/`finally`.
- **How fixed:** `try/finally` resets loading; dialog close also clears loading.

### H1 No Next.js middleware — client-only route guards
- **Severity / Category:** High / Security
- **Status:** Fixed
- **Where:** `middleware.ts` (new), `dashboard/layout.tsx`
- **What:** Auth only after JS hydrate for `/dashboard`.
- **Why it happened:** Relied on client `RequireAuth` only.
- **How fixed:** Added edge middleware redirecting unauthenticated `/dashboard/*` to `/login` when HttpOnly `token` cookie is missing. `/coach/*` still allowed through for memory-token coaches; client `RequireCoachAuth` remains. API authz still required.

### H2 RequireAuth trusts persisted Redux without re-verify
- **Severity / Category:** High / Security
- **Status:** Fixed
- **Where:** `src/components/require-auth.tsx`
- **What:** Staff user in Redux skipped `/auth/verifyToken`.
- **Why it happened:** Optimization to avoid extra round-trip.
- **How fixed:** Always calls `/auth/verifyToken`; clears Redux and redirects on failure.

### H3 canAccessPage default-allows unknown paths
- **Severity / Category:** High / Security
- **Status:** Fixed
- **Where:** `src/lib/config/roles.ts`
- **What:** Unknown paths returned `true`.
- **Why it happened:** Default-allow for convenience when adding routes.
- **How fixed:** Default-deny (`return false`). Explicitly listed `/dashboard`, `/dashboard/packages`, `/dashboard/classes` in `PAGE_ROLES`.

### H4 Open unauthenticated /api/test-login
- **Severity / Category:** High / Security
- **Status:** Fixed
- **Where:** `src/app/api/test-login/route.ts`
- **What:** Public login proxy returning full API response.
- **Why it happened:** Dev debugging route left in tree.
- **How fixed:** Returns 404 in production; strips `token` from any dev response.

### H5 Open /api/test-config leaks env
- **Severity / Category:** High / Security
- **Status:** Fixed
- **Where:** `src/app/api/test-config/route.ts`
- **What:** Unauthenticated config dump.
- **Why it happened:** Dev debugging route left in tree.
- **How fixed:** Returns 404 in production; only exposes `hasApiUrl` boolean in development.

### H6 Cookie SameSite=None + long maxAge
- **Severity / Category:** High / Security
- **Status:** Fixed
- **Where:** `src/lib/cookie.ts`
- **What:** Cross-site cookie + 30-day lifetime.
- **Why it happened:** Chosen for cross-origin API/dashboard setups.
- **How fixed:** `sameSite: "lax"`, `maxAge` 7 days, shared options object for set/delete.

### H7 RequireCoachAuth fabricates Bearer cookie_token
- **Severity / Category:** High / Security
- **Status:** Fixed
- **Where:** `src/components/coach/RequireCoachAuth.tsx`, `coachSlice.ts`
- **What:** Stored fake token after cookie verify.
- **Why it happened:** Needed a truthy token to pass client guards.
- **How fixed:** Cookie verify sets `token: null` + real `coachId`. Guard accepts `token || coachId`. `setCoachCredentials` allows optional/null token.

### H8 No CSP / clickjacking headers
- **Severity / Category:** High / Security
- **Status:** Fixed
- **Where:** `next.config.ts`
- **What:** Missing frame and CSP headers.
- **Why it happened:** Defaults never customized.
- **How fixed:** Added `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.

### H9 Next.js 15.2.8 below latest security line
- **Severity / Category:** High / Security
- **Status:** Fixed
- **Where:** `package.json`
- **What:** Known CVEs on older 15.2.x.
- **Why it happened:** Pin not refreshed after advisories.
- **How fixed:** Upgraded `next` and `eslint-config-next` to `15.5.16`.

### H10 Build ignores TypeScript and ESLint errors
- **Severity / Category:** High / Quality
- **Status:** Fixed
- **Where:** `next.config.ts`
- **What:** `ignoreBuildErrors` / `ignoreDuringBuilds`.
- **Why it happened:** Shortcut to ship despite type/lint debt.
- **How fixed:** Removed both ignore flags so builds fail on type/lint errors. Fixed Next 15.5 `searchParams: Promise<…>` page props and related pre-existing type errors so `tsc --noEmit` passes.

### H11 Tickets list swallows fetch failures
- **Severity / Category:** High / Quality
- **Status:** Fixed
- **Where:** `src/components/ui/tickets/tickets-container.tsx`
- **What:** Errors look like empty list.
- **Why it happened:** Catch cleared data without UI feedback.
- **How fixed:** Toast + `fetchError` banner; still clears list but surfaces failure.

### H12 Walk-in field errors never displayed
- **Severity / Category:** High / Quality
- **Status:** Fixed
- **Where:** `src/components/ui/dialogs/scans/add-walk-in.tsx`
- **What:** Zod field errors not shown.
- **Why it happened:** Local error state cleared; never set from result.
- **How fixed:** Render `state.errors` field messages (`name`, `phoneNumber`, `message`).

### M1 401 interceptor does not clear session
- **Severity / Category:** Medium / Security
- **Status:** Fixed
- **Where:** `src/lib/tms-api.ts`
- **What:** Unauthorized only logged.
- **Why it happened:** Incomplete logout wiring (`deleteToken` unused).
- **How fixed:** On `UnauthorizedError`, clear persist storage + redirect to `/login` (client); delete cookie on server.

### M2 Password echoed into login defaultValues
- **Severity / Category:** Medium / Security
- **Status:** Fixed
- **Where:** `auth-actions.ts`, `login-form.tsx`
- **What:** Password returned into DOM after errors.
- **Why it happened:** Round-tripped all form fields for UX.
- **How fixed:** Only `phoneNumber` in defaultValues; password input has no `defaultValue`.

### M3 Weak client password schema
- **Severity / Category:** Medium / Security
- **Status:** Fixed
- **Where:** `credentialsSchema.ts`, `newUserSchema.ts`
- **What:** Password only `z.string().trim()`.
- **Why it happened:** Minimal login schema.
- **How fixed:** Min length 6 on login credentials and new-user password (server must still enforce).

### M4 Socket.IO connects without auth token
- **Severity / Category:** Medium / Security
- **Status:** Fixed
- **Where:** `src/lib/socket.ts`, coach shell/scans
- **What:** No handshake auth.
- **Why it happened:** Socket helper had no session wiring.
- **How fixed:** `createTmsSocket(authToken?)` passes `auth: { token }` when available; coach components pass memory token. Full cookie handshake still needs API (see below).

### M5 Incomplete cookie deletion
- **Severity / Category:** Medium / Security
- **Status:** Fixed
- **Where:** `src/lib/cookie.ts`
- **What:** Delete without matching set attributes.
- **Why it happened:** Used bare `cookies().delete`.
- **How fixed:** Clear via `set(..., maxAge: 0)` with same options, then `delete`.

### M6 No CSRF tokens on credentialed API calls
- **Severity / Category:** Medium / Security
- **Status:** Documented
- **Where:** `src/lib/tms-api.ts`
- **What:** `withCredentials` without CSRF pattern.
- **Why it happened:** Relied on Bearer/cookie without synchronizer.
- **How fixed:** Not implementable safely without API CSRF endpoint. Documented in API redesign section. Interim: staff JWT not in browser; coach uses memory Bearer (lower CSRF risk for pure Bearer).

### M7 UI-only role/branch checks
- **Severity / Category:** Medium / Security
- **Status:** Partial
- **Where:** `require-page-access.tsx`, `roles.ts`
- **What:** ACL is frontend-only; `locationId` from query.
- **Why it happened:** Authorization deferred to API.
- **How fixed:** Frontend default-deny ACL. **API must enforce role + branch on every request** (see checklist). Cannot fully fix in this frontend-only pass.

### M8 Unvalidated phone in wa.me href
- **Severity / Category:** Medium / Security
- **Status:** Fixed
- **Where:** `check-in-selector.tsx`, `booked-members-container.tsx`
- **What:** Raw phone in WhatsApp URL.
- **Why it happened:** Direct interpolation.
- **How fixed:** `whatsAppHref()` / `digitsOnlyPhone()` in `src/lib/utils/phone.ts`.

### M9 Member register lacks client validation / a11y
- **Severity / Category:** Medium / Quality
- **Status:** Fixed
- **Where:** `register-member.tsx`
- **What:** Weak types/labels; server-only zod.
- **Why it happened:** Uncontrolled FormData pattern.
- **How fixed:** Proper `htmlFor`/`id`, `type="text"|"tel"`, named inputs; server `newUserSchema` still validates (password min length).

### M10 Badge used as clickable control
- **Severity / Category:** Medium / Quality
- **Status:** Fixed
- **Where:** `payment-selector-dialog.tsx`
- **What:** Non-button click target.
- **Why it happened:** Visual Badge reused as trigger.
- **How fixed:** Replaced with accessible `Button`.

### M11 Magic message length === 24 for user-id
- **Severity / Category:** Medium / Quality
- **Status:** Fixed
- **Where:** `add-walk-in.tsx`
- **What:** Treated 24-char error as Mongo id.
- **Why it happened:** Backend returned id in message string.
- **How fixed:** Prefer structured `usrId`/`userId`; fall back only if message matches `/^[a-fA-F0-9]{24}$/`.

### L1 PII / flow logging in login paths
- **Severity / Category:** Low / Security
- **Status:** Fixed
- **Where:** auth-actions, auth.ts, login/page.tsx, tms-api
- **What:** Phone / API URL logged.
- **Why it happened:** Debug logging left in.
- **How fixed:** Removed login phone/API URL console logs and noisy tms-api boot log.

### L2 Dead duplicate walk-in dialog
- **Severity / Category:** Low / Quality
- **Status:** Fixed
- **Where:** `check-in-dialog.tsx`
- **What:** Unused duplicate component.
- **Why it happened:** Refactor left old file.
- **How fixed:** Deleted `src/components/ui/dialogs/scans/check-in-dialog.tsx`.

### L3 Unused imports / dead state
- **Severity / Category:** Low / Quality
- **Status:** Fixed
- **Where:** add-walk-in, payment-selector-dialog
- **What:** Dead imports/state.
- **Why it happened:** Incomplete cleanup.
- **How fixed:** Removed unused router/Currency/usrId navigation helpers while rewriting those dialogs.

### L4 Icon-only buttons missing accessible names
- **Severity / Category:** Low / Quality
- **Status:** Fixed
- **Where:** check-in-selector, register-member, PackageDetail, booked-members
- **What:** No aria-label on icon controls.
- **Why it happened:** Tooltips used instead of accessible names.
- **How fixed:** Added `aria-label` on copy/WhatsApp/back controls.

### L5 Empty DialogTitle in check-in selector
- **Severity / Category:** Low / Quality
- **Status:** Fixed
- **Where:** `check-in-selector.tsx`
- **What:** Empty dialog title.
- **Why it happened:** Placeholder left empty.
- **How fixed:** `DialogTitle`: “Check in guests”.

### S1 Inconsistent form stacks
- **Severity / Category:** Style / Quality
- **Status:** Documented
- **Where:** refunds vs catalog/scans vs tickets
- **What:** Mixed RHF+zod, FormData, toast-only.
- **Why it happened:** Features added over time with different patterns.
- **How fixed:** Full unification deferred. Prefer RHF+zod for money/auth going forward; existing refunds/coach login already use that pattern.

### S2 Widespread as any on action state
- **Severity / Category:** Style / Quality
- **Status:** Partial
- **Where:** register-member, schedule dialogs, etc.
- **What:** Loose typing on action state.
- **Why it happened:** Rapid FormData/`useActionState` adoption.
- **How fixed:** Tightened types on walk-in/payment selector and login paths; remaining `as any` can be cleaned incrementally now that build ignores are off.

### S3 Typo Attendnace in UI
- **Severity / Category:** Style / Quality
- **Status:** Fixed
- **Where:** `payment-selector-dialog.tsx`
- **What:** Misspelling.
- **Why it happened:** Typo.
- **How fixed:** Renamed to “Confirm Guest Attendance”.

---

## API requirements for future HttpOnly cookie redesign

Use this when the backend is ready to own sessions. Frontend today: staff HttpOnly cookie on the **Next** origin + coach JWT in **memory** only.

### Backend must
1. **Login (staff + coach):** `Set-Cookie` with `HttpOnly`, `Secure`, `SameSite=Lax` (or `None` only if true cross-site + CSRF), explicit `Path`/`Domain`, short access TTL + refresh if needed.
2. **Stop returning JWT in JSON** for browser clients (or return only non-secret profile fields).
3. **Logout:** invalidate server session + `Set-Cookie` clear with matching attributes.
4. **CORS:** allowlist dashboard origin(s); `Access-Control-Allow-Credentials: true`; never `*` with credentials.
5. **CSRF:** synchronizer or double-submit token on mutating cookie-authenticated requests; expose a read endpoint or cookie for the frontend to send as header.
6. **Socket.IO:** authenticate handshake from session cookie (or short-lived socket ticket); never trust client-supplied `coachId` alone for room joins.
7. **Authorization:** enforce role + branch (`locationId`) on every API; do not trust UI ACL.
8. **Rotate / revoke** on password change and logout.
9. **Walk-in “user exists”:** return structured `{ code: "USER_EXISTS", userId }` instead of burying ObjectId in `message`.

### Frontend follow-ups after API is ready
- Remove coach memory Bearer; rely on cookies + `withCredentials`.
- Drop Next-side `setToken` duplication if API sets the session cookie directly.
- Wire CSRF header on all `tms` / coach mutating calls (closes M6).
- Pass authenticated socket handshake; remove placeholder auth paths.
- Purge any remaining token fields from Redux entirely.
- Tighten middleware to also gate `/coach/*` once coach cookies exist.

### Interim frontend posture (this remediation)
- Staff: HttpOnly cookie via Next `setToken`; no JWT in Redux/localStorage.
- Coach: JWT in Redux **memory only** (not persisted); Bearer still used until API cookies exist.
- CSRF full fix deferred until API cookie sessions exist (M6).
- Page ACL is default-deny in UI; API must remain source of truth (M7).
