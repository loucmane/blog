// Scoring is separate from prediction: this module never selects a skill.
const requireThat = (condition, message) => {
  if (!condition) throw new Error(message)
}
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0
const rate = (numerator, denominator) => (denominator === 0 ? null : numerator / denominator)

function indexed(rows, label) {
  requireThat(Array.isArray(rows), `${label}: cases must be an array`)
  const result = new Map()
  for (const row of rows) {
    requireThat(
      Number.isSafeInteger(row?.number) && row.number > 0 && !result.has(row.number),
      `${label}: invalid or duplicate PR number`,
    )
    result.set(row.number, row)
  }
  return result
}

function skillSet(values, known, label) {
  requireThat(
    Array.isArray(values) && values.every((id) => known.has(id)),
    `${label}: unknown skill`,
  )
  requireThat(new Set(values).size === values.length, `${label}: duplicate skills`)
  return new Set(values)
}

export function scoreEvaluation({ inputs, labels, blind, skillIds }) {
  requireThat(
    [inputs, labels, blind].every((value) => value?.schemaVersion === 1),
    'unsupported evaluation schema',
  )
  requireThat(blind.labelsVisible === false, 'review must withhold expected labels')
  const known = new Set(skillIds)
  requireThat(
    known.size > 0 && known.size === skillIds.length,
    'skill IDs must be nonempty and unique',
  )
  const source = indexed(inputs.cases, 'inputs')
  const expected = indexed(labels.cases, 'labels')
  const reviews = indexed(blind.cases, 'blind review')
  requireThat(
    source.size > 0 && source.size === expected.size && source.size === reviews.size,
    'case counts differ',
  )
  const cases = []
  for (const [number, input] of source) {
    const label = expected.get(number),
      review = reviews.get(number)
    requireThat(label && review, `PR ${number}: missing evidence`)
    requireThat(
      /^[a-f0-9]{40}$/.test(input.merge) && review.merge === input.merge,
      `PR ${number}: merge mismatch`,
    )
    requireThat(
      nonempty(label.selectionReason) &&
        Array.isArray(label.expected) &&
        label.expected.every((item) => nonempty(item.rationale)),
      `PR ${number}: missing label rationale`,
    )
    const wanted = skillSet(
      label.expected.map(({ skill }) => skill),
      known,
      'expected',
    )
    requireThat(
      review.routing?.mode === 'advisory' && review.routing.blocking === false,
      'routing must remain advisory',
    )
    const selected = skillSet(review.routing.skills, known, 'selected')
    requireThat(Array.isArray(review.advice), 'advice must be an array')
    const assessed = skillSet(
      review.advice.map(({ skill }) => skill),
      known,
      'advice',
    )
    requireThat(
      assessed.size === selected.size && [...selected].every((id) => assessed.has(id)),
      'advice coverage must exactly match selected skills',
    )
    for (const advice of review.advice) {
      requireThat(
        typeof advice.usable === 'boolean' &&
          nonempty(advice.recommendation) &&
          Array.isArray(advice.evidence) &&
          advice.evidence.length > 0 &&
          advice.evidence.every(nonempty),
        'advice needs a usable classification, recommendation and evidence',
      )
      requireThat(
        Array.isArray(advice.findings) && (advice.usable || advice.findings.length > 0),
        'unusable advice needs findings',
      )
      for (const finding of advice.findings) {
        requireThat(
          finding.subjective === true &&
            finding.blocking === false &&
            nonempty(finding.category) &&
            nonempty(finding.message) &&
            Array.isArray(finding.evidence) &&
            finding.evidence.length > 0 &&
            finding.evidence.every(nonempty),
          'advice findings must be evidenced, subjective and non-blocking',
        )
      }
    }
    cases.push({
      number,
      title: input.title,
      merge: input.merge,
      selectionReason: label.selectionReason,
      expected: [...wanted].sort(),
      selected: [...selected].sort(),
      truePositives: [...wanted].filter((id) => selected.has(id)).sort(),
      falsePositives: [...selected].filter((id) => !wanted.has(id)).sort(),
      falseNegatives: [...wanted].filter((id) => !selected.has(id)).sort(),
      advice: review.advice,
    })
  }
  const sum = (key) => cases.reduce((total, row) => total + row[key].length, 0)
  const truePositives = sum('truePositives'),
    falsePositives = sum('falsePositives'),
    falseNegatives = sum('falseNegatives')
  const decisions = cases.length * known.size
  const trueNegatives = decisions - truePositives - falsePositives - falseNegatives
  const advice = cases.flatMap((row) => row.advice)
  const unusable = advice.filter((item) => !item.usable)
  return {
    schemaVersion: 1,
    mode: 'advisory',
    blocking: false,
    metrics: {
      cases: cases.length,
      decisions,
      truePositives,
      falsePositives,
      falseNegatives,
      trueNegatives,
      precision: rate(truePositives, truePositives + falsePositives),
      recall: rate(truePositives, truePositives + falseNegatives),
      falsePositiveRate: rate(falsePositives, falsePositives + trueNegatives),
      falseNegativeRate: rate(falseNegatives, truePositives + falseNegatives),
      exactMatches: cases.filter(
        (row) => row.falsePositives.length + row.falseNegatives.length === 0,
      ).length,
      missedRoutingCases: cases.filter((row) => row.falseNegatives.length > 0).length,
      whollyMissedCases: cases.filter((row) => row.expected.length > 0 && row.selected.length === 0)
        .length,
      assessedAdvice: advice.length,
      unusableAdvice: unusable.length,
      unusableAdviceFindings: unusable.reduce((total, row) => total + row.findings.length, 0),
      unusableAdviceRate: rate(unusable.length, advice.length),
    },
    perSkill: [...known].sort().map((skill) => ({
      skill,
      expected: cases.filter((row) => row.expected.includes(skill)).length,
      selected: cases.filter((row) => row.selected.includes(skill)).length,
      falsePositives: cases.filter((row) => row.falsePositives.includes(skill)).length,
      falseNegatives: cases.filter((row) => row.falseNegatives.includes(skill)).length,
    })),
    cases,
  }
}

export function renderReport(result) {
  const m = result.metrics
  const usefulExtras = result.cases.reduce(
    (count, row) =>
      count +
      row.advice.filter((item) => item.usable && row.falsePositives.includes(item.skill)).length,
    0,
  )
  const pct = (value) => (value === null ? 'not assessed' : `${(100 * value).toFixed(1)}%`)
  const names = (values) => (values.length ? values.join(', ') : 'none')
  return [
    '# Five-PR skill routing evaluation',
    '',
    'This offline replay uses five real merged PRs selected to span reader accessibility, portability, sanitization, skill infrastructure and font performance. Expected scopes were labelled before the shared router ran on these PRs. A separate agent received the PR inputs and frozen router, without labels or scorer results, and applied each selected skill to the local diff. This is retrospective dogfood, not a prospective or statistically representative estimate of future accuracy.',
    '',
    `Across ${m.cases} PRs and ${m.decisions} binary PR/skill decisions: **${m.truePositives} true positives, ${m.falsePositives} false positives, ${m.falseNegatives} false negatives, ${m.trueNegatives} true negatives**. Precision ${pct(m.precision)}; recall ${pct(m.recall)}. False-positive rate ${pct(m.falsePositiveRate)}; false-negative rate ${pct(m.falseNegativeRate)}.`,
    '',
    `Exact matches: ${m.exactMatches}/${m.cases}. Missed routing (at least one expected skill absent): ${m.missedRoutingCases}/${m.cases}; wholly missed (no skill selected): ${m.whollyMissedCases}/${m.cases}. Unusable advice: ${m.unusableAdvice}/${m.assessedAdvice} selected-skill assessments (${pct(m.unusableAdviceRate)}), with ${m.unusableAdviceFindings} findings. Advice usefulness is the blind reviewer's subjective assessment, not a deterministic correctness guarantee.`,
    '',
    '| PR | Expected | Selected | False positives | False negatives |',
    '| --- | --- | --- | --- | --- |',
    ...result.cases.map(
      (row) =>
        `| #${row.number} | ${names(row.expected)} | ${names(row.selected)} | ${names(row.falsePositives)} | ${names(row.falseNegatives)} |`,
    ),
    '',
    '## Advice findings',
    '',
    ...result.cases.flatMap((row) =>
      row.advice
        .filter((item) => !item.usable)
        .map(
          (item) =>
            `- PR #${row.number}, ${item.skill}: ${item.findings.map((finding) => finding.message).join(' ')} Evidence: ${item.evidence.map((path) => `\`${path}\``).join(', ')}.`,
        ),
    ),
    '',
    '## Interpretation and limits',
    '',
    `The fixed labels and blind reviewer use distinct judgments: ${usefulExtras} of ${m.falsePositives} selections outside the expected set still yielded usable adjacent-scope advice. Those remain false positives under the original labels; they are not relabelled after seeing output. The reviewer also recorded possible missing scopes separately in the blind artifact. This disagreement makes label scope a follow-up discussion, not evidence that all extra advice is wrong.`,
    '',
    'Path routes intentionally preserve overlaps; broad paths can select a skill whose domain did not change. Task-text matching uses existing trigger vocabulary over the title and full body, so verification boilerplate, historical references and whole-text exclusions can introduce noise or hide relevant scopes. The frozen routes were not tuned to these outcomes. Treat misses and unusable guidance as revision candidates; rerun a new labelled evaluation after any routing change.',
    '',
    'All findings remain advisory and non-blocking. Skill selection grants no execution, merge or deployment authority. Only independently verified deterministic checks in the catalog allowlist are blocking-eligible; a subjective review score never becomes a gate.',
    '',
    'Precision = TP/(TP+FP); recall = TP/(TP+FN); false-positive rate = FP/(FP+TN); false-negative rate = FN/(TP+FN). The denominator is the full registered skill set for each PR, not only selected skills. Unusable-advice rate counts unusable selected-skill assessments; the finding count is reported separately. Zero denominators are null in JSON, never invented zero measurements.',
    '',
    'Evidence: [fixed labels](forward-labels.json), [PR inputs](forward-inputs.json), [freeze digests](forward-freeze.json), [blind advice and routing](forward-blind-review.json), [machine-readable results](forward-results.json). Per-skill counts in the results expose skills absent from this small sample. No model provider comparison or exhaustive security, accessibility, browser or performance audit was performed.',
    '',
    'Reproduce offline with `node scripts/agent-skills/evaluate-forward.mjs --check`; omit `--check` to regenerate the results and this report. Hash checks refuse changed inputs, labels or routing rules. Human advice is preserved as recorded evidence, not regenerated by the deterministic scorer.',
    '',
  ].join('\n')
}
