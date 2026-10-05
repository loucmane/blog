CREATE TABLE content_publication_state (
  id smallint PRIMARY KEY CHECK (id = 1),
  version bigint NOT NULL CHECK (version >= 0)
);

INSERT INTO content_publication_state (id, version) VALUES (1, 0);
