import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { MAX_RICH_TEXT_NODES } from "src/common/books/book-limits";

const ALLOWED_NODE_TYPES = new Set(["doc", "paragraph", "text"]);
const ALLOWED_MARK_TYPES = new Set(["bold", "italic", "highlight", "link", "citation"]);
const SAFE_HREF_PATTERN = /^(https?:\/\/|\/)/;

/**
 * The single largest new attack surface in Phase C, per the approved plan
 * — a client can POST any JSON as `richText`, so this walk is the only
 * real gate (class-validator's `@IsObject()` on the DTO only checks
 * "is an object", nothing about its shape). Rejects anything outside the
 * locked-down schema: no font family/size/colour/margin/alignment marks
 * exist here at all — the schema itself, not this function's restraint,
 * is what makes those impossible, but this function is what makes sure a
 * hand-crafted payload can't sneak an unlisted node/mark/attribute past a
 * naive client into storage.
 */
export function assertValidRichTextDoc(value: unknown): void {
  if (!isPlainObject(value) || value.type !== "doc" || !Array.isArray(value.content)) {
    throw new BadRequestError("Invalid rich text document: expected { type: \"doc\", content: [...] }.");
  }

  let nodeCount = 0;
  function walk(node: unknown, path: string): void {
    nodeCount += 1;
    if (nodeCount > MAX_RICH_TEXT_NODES) {
      throw new BadRequestError(`Rich text document exceeds the ${MAX_RICH_TEXT_NODES}-node limit.`);
    }
    if (!isPlainObject(node)) {
      throw new BadRequestError(`Invalid rich text node at ${path}: expected an object.`);
    }
    if (typeof node.type !== "string" || !ALLOWED_NODE_TYPES.has(node.type)) {
      throw new BadRequestError(`Invalid rich text node type at ${path}: "${String(node.type)}".`, {
        allowed: [...ALLOWED_NODE_TYPES],
      });
    }

    if (node.type === "text") {
      if (typeof node.text !== "string") {
        throw new BadRequestError(`Text node at ${path} must have a string "text".`);
      }
      if (node.marks !== undefined) {
        assertValidMarks(node.marks, path);
      }
      const extraKeys = Object.keys(node).filter((key) => !["type", "text", "marks"].includes(key));
      if (extraKeys.length > 0) {
        throw new BadRequestError(`Text node at ${path} has disallowed keys: ${extraKeys.join(", ")}.`);
      }
      return;
    }

    // "paragraph" (or "doc")
    if (!Array.isArray(node.content)) {
      throw new BadRequestError(`Node at ${path} must have a "content" array.`);
    }
    const extraKeys = Object.keys(node).filter((key) => !["type", "content"].includes(key));
    if (extraKeys.length > 0) {
      throw new BadRequestError(`Node at ${path} has disallowed keys: ${extraKeys.join(", ")}.`);
    }
    node.content.forEach((child, index) => walk(child, `${path}.content[${index}]`));
  }

  function assertValidMarks(marks: unknown, path: string): void {
    if (!Array.isArray(marks)) {
      throw new BadRequestError(`"marks" at ${path} must be an array.`);
    }
    for (const mark of marks) {
      if (!isPlainObject(mark) || typeof mark.type !== "string" || !ALLOWED_MARK_TYPES.has(mark.type)) {
        throw new BadRequestError(`Invalid mark at ${path}: "${JSON.stringify(mark)}".`, { allowed: [...ALLOWED_MARK_TYPES] });
      }
      const extraKeys = Object.keys(mark).filter((key) => !["type", "attrs"].includes(key));
      if (extraKeys.length > 0) {
        throw new BadRequestError(`Mark at ${path} has disallowed keys: ${extraKeys.join(", ")}.`);
      }
      if (mark.attrs !== undefined) {
        assertValidMarkAttrs(mark.type, mark.attrs, path);
      }
    }
  }

  function assertValidMarkAttrs(markType: string, attrs: unknown, path: string): void {
    if (!isPlainObject(attrs)) {
      throw new BadRequestError(`"attrs" for mark "${markType}" at ${path} must be an object.`);
    }
    if (markType === "link") {
      const extraKeys = Object.keys(attrs).filter((key) => key !== "href");
      if (extraKeys.length > 0 || typeof attrs.href !== "string") {
        throw new BadRequestError(`Link mark at ${path} must have exactly one attr, "href" (a string).`);
      }
      if (!SAFE_HREF_PATTERN.test(attrs.href)) {
        throw new BadRequestError(`Link mark at ${path} has an unsafe href protocol: "${attrs.href}". Only http(s):// and relative paths are allowed.`);
      }
      return;
    }
    if (markType === "citation") {
      const extraKeys = Object.keys(attrs).filter((key) => key !== "referenceId");
      if (extraKeys.length > 0 || typeof attrs.referenceId !== "string") {
        throw new BadRequestError(`Citation mark at ${path} must have exactly one attr, "referenceId" (a string).`);
      }
      return;
    }
    throw new BadRequestError(`Mark "${markType}" at ${path} does not accept attrs.`);
  }

  value.content.forEach((child, index) => walk(child, `content[${index}]`));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
