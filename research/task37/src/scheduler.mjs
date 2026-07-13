import { Temporal } from "@js-temporal/polyfill";

export function ownerTimeToInstant({ localDateTime, timeZone, disambiguation = "reject" }) {
  return Temporal.ZonedDateTime.from(`${localDateTime}[${timeZone}]`, { disambiguation }).toInstant().toString();
}

export class PublicationScheduler {
  #articles = new Map();
  #jobs = new Map();
  #outbox = new Map();

  schedule({ articleId, instant, now, idempotencyKey }) {
    const previous = this.#articles.get(articleId);
    const article = {
      articleId,
      status: "scheduled",
      scheduledAt: instant,
      scheduleVersion: (previous?.scheduleVersion ?? 0) + 1,
      updatedAt: now,
    };
    this.#articles.set(articleId, article);
    for (const job of this.#jobs.values()) {
      if (job.articleId === articleId && ["pending", "claimed"].includes(job.status)) job.status = "cancelled";
    }
    const job = {
      id: `${articleId}:${article.scheduleVersion}`,
      articleId,
      scheduleVersion: article.scheduleVersion,
      runAt: instant,
      status: "pending",
      idempotencyKey,
      claimedBy: null,
      leaseUntil: null,
    };
    this.#jobs.set(job.id, job);
    return structuredClone({ article, job });
  }

  cancel(articleId, now) {
    const article = this.#articles.get(articleId);
    article.status = "draft";
    article.updatedAt = now;
    for (const job of this.#jobs.values()) {
      if (job.articleId === articleId && ["pending", "claimed"].includes(job.status)) job.status = "cancelled";
    }
    return structuredClone(article);
  }

  claimDue({ now, workerId, leaseMs }) {
    const current = Temporal.Instant.from(now);
    for (const job of this.#jobs.values()) {
      const expired = job.status === "claimed" && Temporal.Instant.compare(Temporal.Instant.from(job.leaseUntil), current) <= 0;
      if ((job.status === "pending" || expired) && Temporal.Instant.compare(Temporal.Instant.from(job.runAt), current) <= 0) {
        job.status = "claimed";
        job.claimedBy = workerId;
        job.leaseUntil = current.add({ milliseconds: leaseMs }).toString();
        return structuredClone(job);
      }
    }
    return null;
  }

  completePublication({ jobId, workerId, now }) {
    const job = this.#jobs.get(jobId);
    if (!job || job.status === "completed") return { duplicate: true, article: this.article(job?.articleId) };
    if (job.status !== "claimed" || job.claimedBy !== workerId) throw new Error("worker does not own the active lease");
    const article = this.#articles.get(job.articleId);
    if (article.scheduleVersion !== job.scheduleVersion || article.status !== "scheduled") {
      job.status = "superseded";
      return { duplicate: true, article: structuredClone(article) };
    }
    article.status = "published";
    article.publishedAt = now;
    article.scheduleDelayMs = Number(Temporal.Instant.from(now).epochMilliseconds - Temporal.Instant.from(article.scheduledAt).epochMilliseconds);
    job.status = "completed";
    for (const effect of ["cache", "search", "feed", "social-card", "email"]) {
      const id = `${article.articleId}:${article.scheduleVersion}:${effect}`;
      if (!this.#outbox.has(id)) this.#outbox.set(id, { id, effect, status: "pending", attempts: 0 });
    }
    return { duplicate: false, article: structuredClone(article), outbox: this.outbox(article.articleId) };
  }

  completeEffect(id, { fail = false } = {}) {
    const effect = this.#outbox.get(id);
    effect.attempts += 1;
    effect.status = fail ? "failed" : "completed";
    return structuredClone(effect);
  }

  article(articleId) {
    const article = this.#articles.get(articleId);
    return article ? structuredClone(article) : null;
  }

  jobs(articleId) {
    return [...this.#jobs.values()]
      .filter((job) => job.articleId === articleId)
      .map((job) => structuredClone(job));
  }

  outbox(articleId) {
    return [...this.#outbox.values()]
      .filter(({ id }) => id.startsWith(`${articleId}:`))
      .map((entry) => structuredClone(entry));
  }
}
