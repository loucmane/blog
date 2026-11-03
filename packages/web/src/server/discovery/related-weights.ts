/**
 * One editorial signal: something a candidate story shares with the story being read. It adds
 * `weight × min(shared, cap)` to the candidate's score, where `shared` counts the distinct items
 * both stories have.
 */
export interface SharedSignalWeight {
  /** The most shared items that count; more add nothing. A whole number, 1 or more. */
  readonly cap: number
  /** Added for each shared item up to the cap. 0 or more; 0 turns the signal off. */
  readonly weight: number
}

/**
 * Recency adds `weight × exp(-ageDays / decayDays)`. A candidate's age counts back from the newest
 * candidate's publication, not from the clock, so a selection depends on the stories alone.
 */
export interface RecencyWeight {
  /** Days for the recency term to fall to 1/e of its weight. More than 0. */
  readonly decayDays: number
  /** The newest candidate's recency term. 0 or more. */
  readonly weight: number
}

export interface RelatedStoryWeights {
  /** Each category or tag both stories are filed under. */
  readonly sharedTerm: SharedSignalWeight
  /** A section both stories are filed under. */
  readonly sharedSection: SharedSignalWeight
  /** An author both stories credit. */
  readonly sharedAuthor: SharedSignalWeight
  readonly recency: RecencyWeight
}

/**
 * The weights related-story selection ranks by: the owner's editorial preference (OQ-07). A shared
 * category or tag counts most, then a shared section, then a shared author, then recency. Change
 * the values here to change the ordering; no code needs to change.
 */
export const relatedStoryWeights: RelatedStoryWeights = {
  // 3.0 for each shared category or tag, counting at most three of them.
  sharedTerm: { cap: 3, weight: 3 },
  // 2.0 for sharing a section, however many sections both stories are filed under.
  sharedSection: { cap: 1, weight: 2 },
  // 1.0 for sharing an author, however many authors both stories credit.
  sharedAuthor: { cap: 1, weight: 1 },
  // 0.5 × exp(-ageDays / 45).
  recency: { decayDays: 45, weight: 0.5 },
}
