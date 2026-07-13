export class DraftConflictError extends Error {
  constructor(local, remote) {
    super("This draft changed in another tab. Both versions are safe.");
    this.name = "DraftConflictError";
    this.local = structuredClone(local);
    this.remote = structuredClone(remote);
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super("Your session expired. Your work is safe on this device; sign in to continue saving.");
    this.name = "SessionExpiredError";
  }
}

export class InMemoryDraftStore {
  #drafts = new Map();
  #idempotency = new Map();
  #revisions = new Map();

  create(id, content) {
    const draft = { id, version: 1, content: structuredClone(content), status: "draft", updatedAt: 0 };
    this.#drafts.set(id, draft);
    this.#revisions.set(id, []);
    return structuredClone(draft);
  }

  read(id) {
    return structuredClone(this.#drafts.get(id));
  }

  save({ id, expectedVersion, content, idempotencyKey, acknowledgedAt, sessionValid = true }) {
    if (!sessionValid) throw new SessionExpiredError();
    const replay = this.#idempotency.get(idempotencyKey);
    if (replay) return structuredClone(replay);
    const remote = this.#drafts.get(id);
    const local = { id, expectedVersion, content };
    if (remote.version !== expectedVersion) throw new DraftConflictError(local, remote);
    const saved = {
      ...remote,
      version: remote.version + 1,
      content: structuredClone(content),
      updatedAt: acknowledgedAt,
    };
    this.#drafts.set(id, saved);
    this.#idempotency.set(idempotencyKey, saved);
    return structuredClone(saved);
  }

  publish({ id, expectedVersion, idempotencyKey, publishedAt }) {
    const replay = this.#idempotency.get(idempotencyKey);
    if (replay) return structuredClone(replay);
    const draft = this.#drafts.get(id);
    if (draft.version !== expectedVersion) {
      throw new DraftConflictError({ id, expectedVersion, content: draft.content }, draft);
    }
    const revision = {
      revisionId: `${id}-revision-${draft.version}`,
      content: structuredClone(draft.content),
      createdAt: publishedAt,
    };
    this.#revisions.get(id).push(revision);
    const published = { ...draft, status: "published", publishedAt };
    this.#drafts.set(id, published);
    const result = { draft: published, revision };
    this.#idempotency.set(idempotencyKey, result);
    return structuredClone(result);
  }

  revisions(id) {
    return structuredClone(this.#revisions.get(id));
  }
}

export class RecoveryBuffer {
  #entries = new Map();

  constructor({ maxBytes = 64_000, maxAgeMs = 86_400_000 } = {}) {
    this.maxBytes = maxBytes;
    this.maxAgeMs = maxAgeMs;
  }

  write(id, value, now) {
    const bytes = Buffer.byteLength(JSON.stringify(value));
    if (bytes > this.maxBytes) throw new Error("Recovery copy is too large; save media separately before continuing.");
    this.#entries.set(id, { value: structuredClone(value), bytes, writtenAt: now });
  }

  read(id, now) {
    const entry = this.#entries.get(id);
    if (!entry) return null;
    if (now - entry.writtenAt > this.maxAgeMs) {
      this.#entries.delete(id);
      return null;
    }
    return structuredClone(entry.value);
  }

  acknowledge(id) {
    this.#entries.delete(id);
  }
}

export function autosaveState({ localVersion, acknowledgedVersion, online, saving, error }) {
  if (error instanceof SessionExpiredError) return { label: error.message, safe: true, action: "sign-in" };
  if (error instanceof DraftConflictError) return { label: error.message, safe: true, action: "compare-versions" };
  if (!online) return { label: "Offline. Your latest changes are safe on this device.", safe: true, action: "wait" };
  if (saving || localVersion > acknowledgedVersion) return { label: "Saving…", safe: false, action: "wait" };
  return { label: "All changes saved", safe: true, action: null };
}
