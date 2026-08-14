import DOMPurify from "isomorphic-dompurify";

const FORBID_TAGS = ["script", "iframe", "object", "embed", "form", "link", "meta", "base"];
const FORBID_ATTR = [
  "onerror",
  "onload",
  "onclick",
  "onmouseover",
  "onfocus",
  "onblur",
  "formaction",
];

/** Sanitize untrusted HTML (e.g. email bodies) before dangerouslySetInnerHTML. */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    FORBID_TAGS,
    FORBID_ATTR,
  });
}
