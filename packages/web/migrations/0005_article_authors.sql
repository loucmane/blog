CREATE TABLE article_authors (
  article_id text NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
  position integer NOT NULL CHECK (position >= 0),
  PRIMARY KEY (article_id, author_id),
  UNIQUE (article_id, position)
);

CREATE INDEX article_authors_author_id_idx ON article_authors (author_id);
