import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

import {
  extractPortableText,
  extensions,
  renderConvenienceMarkdown,
  renderPortableHtml,
  roundTripPortableDocument,
  validatePortableDocument,
} from "../src/document.mjs";
import { migratePortableDocument } from "../src/migrations.mjs";

const source = JSON.parse(fs.readFileSync(new URL("../fixtures/article.v1.json", import.meta.url), "utf8"));

function currentDocument() {
  const result = migratePortableDocument(source);
  assert.equal(result.status, "migrated");
  return result.document;
}

test("round-trips the versioned JSON document without semantic loss", () => {
  const first = roundTripPortableDocument(currentDocument());
  assert.equal(first.status, "ok");
  const exported = JSON.stringify(first.document);
  const second = roundTripPortableDocument(JSON.parse(exported));
  assert.equal(second.status, "ok");
  assert.deepEqual(second.document, first.document);
  assert.equal(first.document.schemaVersion, 3);
  assert.equal(first.document.migrationProvenance.length, 2);
});

test("server-renders safe HTML without creating a browser editor", () => {
  const html = renderPortableHtml(currentDocument());
  assert.match(html, /data-editorial-node="pull-quote"/);
  assert.match(html, /data-editorial-node="media-image"/);
  assert.match(html, /data-editorial-node="gallery"/);
  assert.match(html, /data-editorial-node="embed"/);
  assert.match(html, /alt="Abstract blue and gold editorial shapes"/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /javascript:/i);
});

test("extracts deterministic search text and readable lossy Markdown", () => {
  const portableDocument = currentDocument();
  const text = extractPortableText(portableDocument);
  const markdown = renderConvenienceMarkdown(portableDocument);
  assert.match(text, /A Portable Editorial Story/);
  assert.match(text, /Abstract blue and gold editorial shapes/);
  assert.match(text, /Video unavailable/);
  assert.match(markdown, /^# A Portable Editorial Story/m);
  assert.match(markdown, /Editor note/);
  assert.match(markdown, /Synthetic editorial video/);
});

test("quarantines unknown nodes instead of silently dropping them", () => {
  const portableDocument = currentDocument();
  portableDocument.document.content.splice(1, 0, {
    type: "futureInteractiveMap",
    attrs: { payload: "must-survive-for-forward-repair" },
  });
  const validation = validatePortableDocument(portableDocument);
  assert.equal(validation.valid, false);
  assert.deepEqual(validation.unknown.map(({ type }) => type), ["futureInteractiveMap"]);
  const result = roundTripPortableDocument(portableDocument);
  assert.equal(result.status, "quarantined");
  assert.equal(result.unknown[0].node.attrs.payload, "must-survive-for-forward-repair");
});

test("rejects scripts, unsupported attributes, and unsafe embed hosts", () => {
  const script = currentDocument();
  script.document.content[0].attrs.onclick = "alert(1)";
  assert.throws(() => validatePortableDocument(script), /unsupported attributes/);

  const embed = currentDocument();
  const embedNode = embed.document.content.find(({ type }) => type === "embed");
  embedNode.attrs.url = "https://attacker.invalid/watch?v=task37fixture";
  assert.throws(() => validatePortableDocument(embed), /not allow-listed/);

  const link = currentDocument();
  link.document.content[1].content[1].marks[0].attrs.href = "javascript:alert(1)";
  assert.throws(() => validatePortableDocument(link), /disallowed protocol/);

  const hostileText = currentDocument();
  const image = hostileText.document.content.find(({ type }) => type === "mediaImage");
  image.attrs.caption = '</figcaption><script data-task37="escaped">alert(1)</script>';
  const html = renderPortableHtml(hostileText);
  assert.doesNotMatch(html, /<script/i);
  assert.match(html, /&lt;\/figcaption&gt;&lt;script/);
});

test("supports keyboard-command editing and passes deterministic JSDOM axe rules", async () => {
  const dom = new JSDOM(`<!doctype html><html lang="en"><head><title>Task 37 editor</title></head><body><main><div role="toolbar" aria-label="Formatting"><button type="button" aria-label="Bold">Bold</button><button type="button" aria-label="Undo">Undo</button></div><div id="editor"></div><p role="status" aria-live="polite">All changes saved</p></main></body></html>`, {
    pretendToBeVisual: true,
    url: "https://task37.example.invalid/editor",
  });
  const globals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    Node: dom.window.Node,
    HTMLElement: dom.window.HTMLElement,
    KeyboardEvent: dom.window.KeyboardEvent,
    MutationObserver: dom.window.MutationObserver,
  };
  const previous = Object.fromEntries(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  try {
    const [{ Editor }, axe] = await Promise.all([import("@tiptap/core"), import("axe-core")]);
    const editor = new Editor({
      element: dom.window.document.querySelector("#editor"),
      extensions,
      content: currentDocument().document,
      editorProps: {
        attributes: {
          "aria-label": "Article body",
          "aria-multiline": "true",
          role: "textbox",
        },
      },
    });
    editor.commands.setTextSelection({ from: 1, to: 5 });
    assert.equal(editor.commands.keyboardShortcut("Mod-b"), true);
    const formatted = editor.getJSON().content[0].content[0];
    assert.equal(formatted.marks.some(({ type }) => type === "bold"), true);
    assert.equal(editor.commands.keyboardShortcut("Mod-z"), true);
    assert.equal(editor.getJSON().content[0].content[0].marks, undefined);
    const result = await axe.default.run(dom.window.document.documentElement, {
      rules: { "color-contrast": { enabled: false } },
    });
    assert.deepEqual(result.violations, []);
    editor.destroy();
  } finally {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    dom.window.close();
  }
});
