import { documentSchemaVersion } from "./document.mjs";

function mapNodes(node, transform) {
  const transformed = transform(structuredClone(node));
  if (Array.isArray(transformed.content)) {
    transformed.content = transformed.content.map((child) => mapNodes(child, transform));
  }
  return transformed;
}

const migrations = new Map([
  [1, (portableDocument) => ({
    ...portableDocument,
    schemaVersion: 2,
    document: mapNodes(portableDocument.document, (node) => {
      if (node.type === "callout") {
        const { tone, ...rest } = node.attrs;
        node.attrs = { ...rest, variant: tone };
      }
      if (node.type === "mediaImage") {
        const { id, focalX, focalY, ...rest } = node.attrs;
        node.attrs = { ...rest, mediaId: id, focalPoint: { x: focalX, y: focalY } };
      }
      if (node.type === "gallery") {
        node.attrs = {
          ...node.attrs,
          layout: "grid",
          items: node.attrs.items.map(({ focalX, focalY, ...item }) => ({
            ...item,
            focalPoint: { x: focalX, y: focalY },
          })),
        };
      }
      return node;
    }),
  })],
  [2, (portableDocument) => ({
    ...portableDocument,
    schemaVersion: 3,
    document: mapNodes(portableDocument.document, (node) => {
      if (node.type === "mediaImage") {
        node.attrs.credit = { name: node.attrs.credit, url: null };
      }
      if (node.type === "gallery") {
        node.attrs.items = node.attrs.items.map((item) => ({
          ...item,
          credit: { name: item.credit, url: null },
        }));
      }
      return node;
    }),
  })],
]);

const knownNodes = new Set([
  "blockquote", "bulletList", "callout", "codeBlock", "doc", "editorialBlock",
  "embed", "gallery", "hardBreak", "heading", "horizontalRule", "listItem",
  "mediaImage", "orderedList", "paragraph", "pullQuote", "text",
]);

function findUnknownNodes(node, path = "document", findings = []) {
  if (!knownNodes.has(node.type)) findings.push({ path, type: node.type });
  for (const [index, child] of (node.content ?? []).entries()) {
    findUnknownNodes(child, `${path}.content[${index}]`, findings);
  }
  return findings;
}

export function inspectMigration(portableDocument, targetVersion = documentSchemaVersion) {
  const unknown = findUnknownNodes(portableDocument.document);
  const versions = [];
  for (let version = portableDocument.schemaVersion; version < targetVersion; version += 1) {
    if (!migrations.has(version)) throw new Error(`missing migration ${version} -> ${version + 1}`);
    versions.push(`${version}->${version + 1}`);
  }
  return {
    articleId: portableDocument.articleId,
    currentVersion: portableDocument.schemaVersion,
    targetVersion,
    versions,
    unknown,
    canMigrate: unknown.length === 0 && portableDocument.schemaVersion <= targetVersion,
  };
}

export function migratePortableDocument(portableDocument, targetVersion = documentSchemaVersion) {
  const inspection = inspectMigration(portableDocument, targetVersion);
  if (!inspection.canMigrate) {
    return { status: "quarantined", inspection, original: structuredClone(portableDocument) };
  }
  let migrated = structuredClone(portableDocument);
  const provenance = [...(migrated.migrationProvenance ?? [])];
  while (migrated.schemaVersion < targetVersion) {
    const from = migrated.schemaVersion;
    migrated = migrations.get(from)(migrated);
    provenance.push({ from, to: migrated.schemaVersion, migration: `task37-v${from}-to-v${migrated.schemaVersion}` });
  }
  migrated.migrationProvenance = provenance;
  return { status: "migrated", inspection, original: structuredClone(portableDocument), document: migrated };
}

export function migrateBatchAtomically(documents, { failAfter = Number.POSITIVE_INFINITY } = {}) {
  const originals = structuredClone(documents);
  const migrated = [];
  try {
    for (const [index, document] of documents.entries()) {
      if (index === failAfter) throw new Error("synthetic interrupted migration");
      const result = migratePortableDocument(document);
      if (result.status !== "migrated") throw new Error(`document ${document.articleId} requires quarantine`);
      migrated.push(result.document);
    }
    return { status: "committed", documents: migrated };
  } catch (error) {
    return { status: "rolled-back", documents: originals, error: error.message };
  }
}
