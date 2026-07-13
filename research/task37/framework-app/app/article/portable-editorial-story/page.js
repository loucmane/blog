import source from "../../../../fixtures/article.v1.json" with { type: "json" };
import { renderPortableHtml } from "../../../../src/document.mjs";
import { migratePortableDocument } from "../../../../src/migrations.mjs";

export default function ArticlePage() {
  const migrated = migratePortableDocument(source);
  if (migrated.status !== "migrated") throw new Error("fixture migration failed");
  const html = renderPortableHtml(migrated.document);
  return <article>
    <h1>{migrated.document.title}</h1>
    <div dangerouslySetInnerHTML={{ __html: html }} />
  </article>;
}
