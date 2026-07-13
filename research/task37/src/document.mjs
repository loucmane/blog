import { Node, getSchema } from "@tiptap/core";
import { renderToHTMLString, serializeChildrenToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import StarterKit from "@tiptap/starter-kit";

const CURRENT_SCHEMA_VERSION = 3;

const pullQuote = Node.create({
  name: "pullQuote",
  group: "block",
  content: "inline*",
  addAttributes() {
    return { attribution: { default: null } };
  },
  parseHTML() {
    return [{ tag: "figure[data-editorial-node='pull-quote']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["figure", { "data-editorial-node": "pull-quote", ...HTMLAttributes }, ["blockquote", 0]];
  },
});

const callout = Node.create({
  name: "callout",
  group: "block",
  content: "inline*",
  addAttributes() {
    return {
      variant: { default: "note" },
      label: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "aside[data-editorial-node='callout']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["aside", { "data-editorial-node": "callout", ...HTMLAttributes }, 0];
  },
});

const mediaImage = Node.create({
  name: "mediaImage",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      mediaId: { default: null },
      src: { default: null },
      alt: { default: "" },
      caption: { default: "" },
      credit: { default: null },
      focalPoint: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "figure[data-editorial-node='media-image']" }];
  },
  renderHTML() {
    return ["figure", { "data-editorial-node": "media-image" }];
  },
});

const gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      items: { default: [] },
      layout: { default: "grid" },
    };
  },
  parseHTML() {
    return [{ tag: "section[data-editorial-node='gallery']" }];
  },
  renderHTML() {
    return ["section", { "data-editorial-node": "gallery" }];
  },
});

const embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      provider: { default: null },
      url: { default: null },
      title: { default: null },
      fallback: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "figure[data-editorial-node='embed']" }];
  },
  renderHTML() {
    return ["figure", { "data-editorial-node": "embed" }];
  },
});

const editorialBlock = Node.create({
  name: "editorialBlock",
  group: "block",
  content: "block+",
  addAttributes() {
    return {
      blockId: { default: null },
      kind: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "section[data-editorial-node='reusable']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["section", { "data-editorial-node": "reusable", ...HTMLAttributes }, 0];
  },
});

export const extensions = [
  StarterKit.configure({
    link: {
      openOnClick: false,
      autolink: false,
      protocols: ["https", "http", "mailto"],
    },
  }),
  pullQuote,
  callout,
  mediaImage,
  gallery,
  embed,
  editorialBlock,
];

const nodeAttributes = {
  blockquote: [],
  bulletList: ["listType", "type"],
  callout: ["variant", "label"],
  codeBlock: ["language"],
  doc: [],
  editorialBlock: ["blockId", "kind"],
  embed: ["provider", "url", "title", "fallback"],
  gallery: ["items", "layout"],
  hardBreak: [],
  heading: ["level", "textAlign"],
  horizontalRule: [],
  listItem: ["color"],
  mediaImage: ["mediaId", "src", "alt", "caption", "credit", "focalPoint"],
  orderedList: ["start", "type"],
  paragraph: ["textAlign"],
  pullQuote: ["attribution"],
  text: [],
};

const markAttributes = {
  bold: [],
  code: [],
  italic: [],
  link: ["href", "target", "rel", "class", "title"],
  strike: [],
  underline: [],
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(value, allowed, path) {
  const unexpected = Object.keys(value ?? {}).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) {
    throw new Error(`${path} has unsupported attributes: ${unexpected.join(", ")}`);
  }
}

function requireSafeUrl(value, path, { embedProvider } = {}) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${path} must be an absolute URL`);
  }
  if (!["https:", "http:", "mailto:"].includes(url.protocol)) {
    throw new Error(`${path} uses a disallowed protocol`);
  }
  if (embedProvider) {
    const providers = {
      youtube: new Set(["youtube.com", "www.youtube.com", "youtu.be"]),
      vimeo: new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]),
    };
    if (url.protocol !== "https:" || !providers[embedProvider]?.has(url.hostname)) {
      throw new Error(`${path} is not allow-listed for ${embedProvider}`);
    }
  }
}

function validateCredit(credit, path) {
  if (!isObject(credit)) throw new Error(`${path} must be structured credit metadata`);
  assertExactKeys(credit, ["name", "url"], path);
  if (typeof credit.name !== "string" || credit.name.trim() === "") {
    throw new Error(`${path}.name is required`);
  }
  if (credit.url !== null) requireSafeUrl(credit.url, `${path}.url`);
}

function validateFocalPoint(point, path) {
  if (!isObject(point)) throw new Error(`${path} must be an object`);
  assertExactKeys(point, ["x", "y"], path);
  for (const axis of ["x", "y"]) {
    if (typeof point[axis] !== "number" || point[axis] < 0 || point[axis] > 1) {
      throw new Error(`${path}.${axis} must be between zero and one`);
    }
  }
}

function validateMediaItem(item, path) {
  if (!isObject(item)) throw new Error(`${path} must be an object`);
  assertExactKeys(item, ["mediaId", "src", "alt", "caption", "credit", "focalPoint"], path);
  for (const key of ["mediaId", "src", "alt", "caption"]) {
    if (typeof item[key] !== "string") throw new Error(`${path}.${key} must be a string`);
  }
  requireSafeUrl(item.src, `${path}.src`);
  validateCredit(item.credit, `${path}.credit`);
  validateFocalPoint(item.focalPoint, `${path}.focalPoint`);
}

function validateNode(node, path, unknown) {
  if (!isObject(node) || typeof node.type !== "string") {
    throw new Error(`${path} is not a valid document node`);
  }
  if (!(node.type in nodeAttributes)) {
    unknown.push({ path, type: node.type, node: structuredClone(node) });
    return;
  }
  assertExactKeys(node, ["type", "attrs", "content", "marks", "text"], path);
  assertExactKeys(node.attrs ?? {}, nodeAttributes[node.type], `${path}.attrs`);
  if (node.type === "text" && typeof node.text !== "string") {
    throw new Error(`${path}.text must be a string`);
  }
  for (const [index, mark] of (node.marks ?? []).entries()) {
    if (!isObject(mark) || !(mark.type in markAttributes)) {
      throw new Error(`${path}.marks[${index}] is unsupported`);
    }
    assertExactKeys(mark, ["type", "attrs"], `${path}.marks[${index}]`);
    assertExactKeys(mark.attrs ?? {}, markAttributes[mark.type], `${path}.marks[${index}].attrs`);
    if (mark.type === "link") requireSafeUrl(mark.attrs?.href, `${path}.marks[${index}].attrs.href`);
  }
  if (node.type === "mediaImage") validateMediaItem(node.attrs, `${path}.attrs`);
  if (node.type === "gallery") {
    if (!Array.isArray(node.attrs?.items) || node.attrs.items.length === 0) {
      throw new Error(`${path}.attrs.items must be a non-empty array`);
    }
    node.attrs.items.forEach((item, index) => validateMediaItem(item, `${path}.attrs.items[${index}]`));
    if (!["grid", "carousel", "diptych"].includes(node.attrs.layout)) {
      throw new Error(`${path}.attrs.layout is unsupported`);
    }
  }
  if (node.type === "embed") {
    if (!["youtube", "vimeo"].includes(node.attrs?.provider)) {
      throw new Error(`${path}.attrs.provider is unsupported`);
    }
    requireSafeUrl(node.attrs.url, `${path}.attrs.url`, { embedProvider: node.attrs.provider });
  }
  for (const [index, child] of (node.content ?? []).entries()) {
    validateNode(child, `${path}.content[${index}]`, unknown);
  }
}

export function validatePortableDocument(portableDocument) {
  if (!isObject(portableDocument)) throw new Error("document wrapper must be an object");
  assertExactKeys(portableDocument, ["articleId", "schemaVersion", "title", "document", "migrationProvenance"], "document");
  if (portableDocument.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`expected schema version ${CURRENT_SCHEMA_VERSION}`);
  }
  const unknown = [];
  validateNode(portableDocument.document, "document.document", unknown);
  if (unknown.length > 0) {
    return { valid: false, unknown };
  }
  getSchema(extensions).nodeFromJSON(portableDocument.document);
  return { valid: true, unknown: [] };
}

export function roundTripPortableDocument(portableDocument) {
  const validation = validatePortableDocument(portableDocument);
  if (!validation.valid) return { status: "quarantined", ...validation };
  const serialized = getSchema(extensions).nodeFromJSON(portableDocument.document).toJSON();
  return {
    status: "ok",
    document: structuredClone({ ...portableDocument, document: serialized }),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMedia(media) {
  const credit = media.credit.url
    ? `<a href="${escapeHtml(media.credit.url)}" rel="nofollow noopener">${escapeHtml(media.credit.name)}</a>`
    : escapeHtml(media.credit.name);
  return `<figure data-editorial-node="media-image" data-media-id="${escapeHtml(media.mediaId)}" style="--focal-x:${media.focalPoint.x};--focal-y:${media.focalPoint.y}"><img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt)}"><figcaption>${escapeHtml(media.caption)} <span data-credit>${credit}</span></figcaption></figure>`;
}

export function renderPortableHtml(portableDocument) {
  const validation = validatePortableDocument(portableDocument);
  if (!validation.valid) throw new Error("unknown nodes must be migrated before rendering");
  return renderToHTMLString({
    content: portableDocument.document,
    extensions,
    options: {
      nodeMapping: {
        pullQuote: ({ node, children }) => `<figure data-editorial-node="pull-quote"><blockquote>${serializeChildrenToHTMLString(children)}</blockquote><figcaption>${escapeHtml(node.attrs.attribution)}</figcaption></figure>`,
        callout: ({ node, children }) => `<aside data-editorial-node="callout" data-variant="${escapeHtml(node.attrs.variant)}"><strong>${escapeHtml(node.attrs.label)}</strong>${serializeChildrenToHTMLString(children)}</aside>`,
        mediaImage: ({ node }) => renderMedia(node.attrs),
        gallery: ({ node }) => `<section data-editorial-node="gallery" data-layout="${escapeHtml(node.attrs.layout)}">${node.attrs.items.map(renderMedia).join("")}</section>`,
        embed: ({ node }) => `<figure data-editorial-node="embed" data-provider="${escapeHtml(node.attrs.provider)}"><a href="${escapeHtml(node.attrs.url)}" rel="nofollow noopener">${escapeHtml(node.attrs.title)}</a><figcaption>${escapeHtml(node.attrs.fallback)}</figcaption></figure>`,
        editorialBlock: ({ node, children }) => `<section data-editorial-node="reusable" data-block-id="${escapeHtml(node.attrs.blockId)}" data-kind="${escapeHtml(node.attrs.kind)}">${serializeChildrenToHTMLString(children)}</section>`,
      },
      unhandledNode: ({ node }) => {
        throw new Error(`unhandled node ${node.type.name}`);
      },
      unhandledMark: ({ mark }) => {
        throw new Error(`unhandled mark ${mark.type.name}`);
      },
    },
  });
}

function collectText(node, parts) {
  if (typeof node.text === "string") parts.push(node.text);
  if (node.type === "mediaImage") parts.push(node.attrs.alt, node.attrs.caption, node.attrs.credit.name);
  if (node.type === "gallery") {
    for (const item of node.attrs.items) parts.push(item.alt, item.caption, item.credit.name);
  }
  if (node.type === "embed") parts.push(node.attrs.title, node.attrs.fallback);
  for (const child of node.content ?? []) collectText(child, parts);
}

export function extractPortableText(portableDocument) {
  const validation = validatePortableDocument(portableDocument);
  if (!validation.valid) throw new Error("unknown nodes must be migrated before text extraction");
  const parts = [];
  collectText(portableDocument.document, parts);
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function markdownNode(node, depth = 0) {
  const children = (node.content ?? []).map((child) => markdownNode(child, depth + 1)).join("");
  switch (node.type) {
    case "doc": return children;
    case "heading": return `${"#".repeat(node.attrs.level)} ${children}\n\n`;
    case "paragraph": return `${children}\n\n`;
    case "text": return node.text;
    case "blockquote": return `> ${children.trim()}\n\n`;
    case "pullQuote": return `> ${children.trim()}\n> — ${node.attrs.attribution}\n\n`;
    case "callout": return `> **${node.attrs.label}:** ${children.trim()}\n\n`;
    case "bulletList": return `${(node.content ?? []).map((item) => `- ${markdownNode(item, depth).trim()}\n`).join("")}\n`;
    case "orderedList": return `${(node.content ?? []).map((item, index) => `${index + (node.attrs.start ?? 1)}. ${markdownNode(item, depth).trim()}\n`).join("")}\n`;
    case "listItem": return children;
    case "mediaImage": return `![${node.attrs.alt}](${node.attrs.src})\n*${node.attrs.caption} — ${node.attrs.credit.name}*\n\n`;
    case "gallery": return `${node.attrs.items.map((item) => `![${item.alt}](${item.src})`).join("\n")}\n\n`;
    case "embed": return `[${node.attrs.title}](${node.attrs.url}) — ${node.attrs.fallback}\n\n`;
    case "editorialBlock": return `**${node.attrs.kind}:**\n\n${children}`;
    default: return children;
  }
}

export function renderConvenienceMarkdown(portableDocument) {
  const validation = validatePortableDocument(portableDocument);
  if (!validation.valid) throw new Error("unknown nodes must be migrated before Markdown export");
  return markdownNode(portableDocument.document).trim();
}

export const documentSchemaVersion = CURRENT_SCHEMA_VERSION;
