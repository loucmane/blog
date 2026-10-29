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
  requireThat(blind?.labelsVisible === false, 'review must withhold expected labels')
  return scoreDecisions({ inputs, labels, evidence: blind, skillIds, assessAdvice: true })
}

// Revision measurements score routing only; they are not new blind reviews.
export function scoreRoutingEvaluation({ inputs, labels, predictions, skillIds }) {
  return scoreDecisions({ inputs, labels, evidence: predictions, skillIds, assessAdvice: false })
}

export function compareRoutingScores(before, after) {
  const b = before.metrics,
    a = after.metrics
  requireThat(
    JSON.stringify(before.cases.map(({ number, expected }) => [number, expected])) ===
      JSON.stringify(after.cases.map(({ number, expected }) => [number, expected])) &&
      JSON.stringify(before.perSkill.map(({ skill }) => skill)) ===
        JSON.stringify(after.perSkill.map(({ skill }) => skill)),
    'comparison requires identical cases, labels and skill denominator',
  )
  const accepted =
    [b.precision, a.precision, b.recall, a.recall].every(Number.isFinite) &&
    a.precision >= b.precision &&
    a.recall >= b.recall
  return {
    denominators: {
      prs: a.cases,
      skills: after.perSkill.length,
      decisions: a.decisions,
      expectedPositives: a.truePositives + a.falseNegatives,
      expectedNegatives: a.falsePositives + a.trueNegatives,
      selectedV2: b.truePositives + b.falsePositives,
      selectedV3: a.truePositives + a.falsePositives,
    },
    acceptance: {
      rule: 'Accept only if held-out recall and precision do not drop; undefined rates do not pass.',
      accepted,
      disposition: accepted ? 'keep revision' : 'revert live routes to v2; retain this report',
    },
  }
}

export function renderRoutingV3Report(result) {
  const { v2, v3, denominators: d, acceptance } = result.heldout
  const b = v2.metrics,
    a = v3.metrics,
    original = result.originalFive.v3.metrics
  const pct = (value) => (value === null ? 'undefined' : `${(100 * value).toFixed(1)}%`)
  const names = (values) => (values.length ? values.join(', ') : 'none')
  return [
    '# Routing v3: contextual shared paths',
    '',
    `**${acceptance.accepted ? 'Accepted' : 'Rejected'} by the predeclared held-out bar: ${acceptance.disposition}.** ${acceptance.rule}`,
    '',
    'Shared layout/page paths require affirmative metadata or distribution context for SEO review. The document validator requires domain context separately for backend data, block contracts and sanitization. Framework configuration requires security/privacy context for security review. Dedicated paths and standalone task-text matching retain their previous behavior. Multiple justified domains can still match.',
    '',
    `Held-out denominators: ${d.prs} PRs × ${d.skills} skills = ${d.decisions} binary decisions; ${d.expectedPositives} expected positives, ${d.expectedNegatives} expected negatives. Selected scopes: v2 ${d.selectedV2}, v3 ${d.selectedV3}.`,
    '',
    '| Measurement | Frozen v2 | Candidate v3 |',
    '| --- | --- | --- |',
    ...['truePositives', 'falsePositives', 'falseNegatives', 'trueNegatives'].map(
      (key) => `| ${key} | ${b[key]} | ${a[key]} |`,
    ),
    `| Precision: TP/(TP+FP) | ${b.truePositives}/${d.selectedV2} (${pct(b.precision)}) | ${a.truePositives}/${d.selectedV3} (${pct(a.precision)}) |`,
    `| Recall: TP/(TP+FN) | ${b.truePositives}/${d.expectedPositives} (${pct(b.recall)}) | ${a.truePositives}/${d.expectedPositives} (${pct(a.recall)}) |`,
    `| False-positive rate | ${b.falsePositives}/${d.expectedNegatives} (${pct(b.falsePositiveRate)}) | ${a.falsePositives}/${d.expectedNegatives} (${pct(a.falsePositiveRate)}) |`,
    `| False-negative rate | ${b.falseNegatives}/${d.expectedPositives} (${pct(b.falseNegativeRate)}) | ${a.falseNegatives}/${d.expectedPositives} (${pct(a.falseNegativeRate)}) |`,
    `| Exact-match PRs | ${b.exactMatches}/${d.prs} | ${a.exactMatches}/${d.prs} |`,
    '',
    '| PR | Expected | Selected v2 | Selected v3 | v3 FP | v3 FN |',
    '| --- | --- | --- | --- | --- | --- |',
    ...v3.cases.map((row) => {
      const before = v2.cases.find(({ number }) => number === row.number)
      return `| #${row.number} | ${names(row.expected)} | ${names(before.selected)} | ${names(row.selected)} | ${names(row.falsePositives)} | ${names(row.falseNegatives)} |`
    }),
    '',
    '## Original five PRs (reference only)',
    '',
    `These five PRs informed the revision and do not decide acceptance. Labels are unchanged. Across ${original.cases} PRs and ${original.decisions} decisions, v3 has ${original.truePositives} TP, ${original.falsePositives} FP, ${original.falseNegatives} FN and ${original.trueNegatives} TN. Precision ${original.truePositives}/${original.truePositives + original.falsePositives} (${pct(original.precision)}); recall ${original.truePositives}/${original.truePositives + original.falseNegatives} (${pct(original.recall)}).`,
    '',
    '| PR | Expected | Selected v3 | FP | FN |',
    '| --- | --- | --- | --- | --- |',
    ...result.originalFive.v3.cases.map(
      (row) =>
        `| #${row.number} | ${names(row.expected)} | ${names(row.selected)} | ${names(row.falsePositives)} | ${names(row.falseNegatives)} |`,
    ),
    '',
    '## Method and limits',
    '',
    'Eight real merged PRs were selected for diverse behavior from the coordinator-exported candidates, excluding the original five. Five have one expected skill. The same worker inspected their diffs and trigger contracts and sealed the expected labels before any routing. Labels were visible during implementation: this is a held-out prediction sample, not an independent blind review, random sample, or population accuracy estimate. No advice-usefulness review was performed.',
    '',
    `Label freeze: ${result.provenance.labelsFrozenAt}. Candidate freeze: ${result.provenance.candidateFrozenAt}. Both routers were measured once for the initial comparison. Subsequent --check executions only replay the sealed candidate and labels; no held-out-driven tuning or relabelling is permitted.`,
    '',
    `${a.falsePositives} held-out false positives and ${a.falseNegatives} false negatives remain. Context is inferred from title/body phrases, not parsed diffs: boilerplate, negation and historical mentions can still introduce noise. Dedicated broad reader/backend paths can still over-select on sanitization-only changes. The small sample does not exercise every conditional route; paired synthetic fixtures cover layout recovery/metadata and document sanitization/block-contract distinctions. Passing the non-regression bar does not establish that all overlap is justified. All selections remain advisory and non-blocking.`,
    '',
    '## Frozen evidence and replay',
    '',
    'The [v2 snapshot](baseline-v2/freeze.json) preserves the router, map, catalog and every historical report hash input. Original forward-* and routing-v2-* artifacts retain their bytes. The [held-out freeze](heldout-freeze.json) seals [inputs](heldout-inputs.json), [labels](heldout-labels.json) and [diff evidence](heldout-diff-evidence.json); its routersRun=false field records the time of freezing, not the current execution state.',
    '',
    'The [v3 freeze](routing-v3-freeze.json) seals exact copies of the candidate router/map/catalog plus the evaluator, scorer and paired fixtures before predictions. Keeping a candidate copy makes a rejected revision replayable after reverting live routes. The [v3 results](routing-v3-results.json) include both held-out per-skill counts and per-case match reasons, original-five reference results and SHA-256 provenance. --check also verifies that live router/map bytes agree with the keep/revert decision.',
    '',
    '- `node scripts/agent-skills/evaluate-forward.mjs --check` replays v1.',
    '- `node scripts/agent-skills/evaluate-forward.mjs --routing-v2 --check` replays frozen v2.',
    '- `node scripts/agent-skills/evaluate-forward.mjs --routing-v3 --check` replays this comparison.',
    '',
  ].join('\n')
}

function scoreDecisions({ inputs, labels, evidence, skillIds, assessAdvice }) {
  requireThat(
    [inputs, labels, evidence].every((value) => value?.schemaVersion === 1),
    'unsupported evaluation schema',
  )
  const known = new Set(skillIds)
  requireThat(
    known.size > 0 && known.size === skillIds.length,
    'skill IDs must be nonempty and unique',
  )
  const source = indexed(inputs.cases, 'inputs')
  const expected = indexed(labels.cases, 'labels')
  const reviews = indexed(evidence.cases, 'predictions')
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
    if (assessAdvice) {
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
      ...(assessAdvice ? { advice: review.advice } : {}),
    })
  }
  const sum = (key) => cases.reduce((total, row) => total + row[key].length, 0)
  const truePositives = sum('truePositives'),
    falsePositives = sum('falsePositives'),
    falseNegatives = sum('falseNegatives')
  const decisions = cases.length * known.size
  const trueNegatives = decisions - truePositives - falsePositives - falseNegatives
  const advice = assessAdvice ? cases.flatMap((row) => row.advice) : []
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
      ...(assessAdvice
        ? {
            assessedAdvice: advice.length,
            unusableAdvice: unusable.length,
            unusableAdviceFindings: unusable.reduce((total, row) => total + row.findings.length, 0),
            unusableAdviceRate: rate(unusable.length, advice.length),
          }
        : {}),
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

export function renderRoutingRevisionReport(result) {
  const m = result.metrics,
    b = result.comparison.baseline,
    d = result.comparison.delta
  const counts = result.comparison.denominators
  const pct = (value) => (value === null ? 'not assessed' : `${(100 * value).toFixed(1)}%`)
  const names = (values) => (values.length ? values.join(', ') : 'none')
  const signed = (value) => (value > 0 ? `+${value}` : String(value))
  return [
    '# Routing v2: recovery and font verification',
    '',
    'The live quality route now includes recovery coverage, Suspense retry regression, font digest and URL contracts, framework cache contracts, direction browser tests and the shared cold-font browser spec. Other routes and task-text matching are unchanged. Presentation-only negatives are labelled separately in the routing fixtures.',
    '',
    '**The same five PRs informed this revision. This is not an independent sample or a generalization estimate.** Their original expected labels are unchanged; the author knew the v1 misses. Fixture labels were written before executing the revised router. This is a routing-only comparison: no new blind review or advice-usefulness assessment was performed.',
    '',
    `Denominators: ${counts.prs} PRs × ${counts.skills} registered skills = ${counts.decisions} binary decisions; ${counts.expectedPositives} expected positives and ${counts.expectedNegatives} expected negatives. Selected scopes: v1 ${counts.selectedV1}, v2 ${counts.selectedV2}.`,
    '',
    '| Measurement | v1 | v2 | Change (v2 − v1) |',
    '| --- | --- | --- | --- |',
    ...['truePositives', 'falsePositives', 'falseNegatives', 'trueNegatives'].map(
      (key) => `| ${key} | ${b[key]} | ${m[key]} | ${signed(d[key])} |`,
    ),
    `| Precision: TP/(TP+FP) | ${b.truePositives}/${counts.selectedV1} (${pct(b.precision)}) | ${m.truePositives}/${counts.selectedV2} (${pct(m.precision)}) | ${signed(Number((100 * d.precision).toFixed(1)))} percentage points |`,
    `| Recall: TP/(TP+FN) | ${b.truePositives}/${counts.expectedPositives} (${pct(b.recall)}) | ${m.truePositives}/${counts.expectedPositives} (${pct(m.recall)}) | ${signed(Number((100 * d.recall).toFixed(1)))} percentage points |`,
    `| False-positive rate: FP/(FP+TN) | ${b.falsePositives}/${counts.expectedNegatives} (${pct(b.falsePositiveRate)}) | ${m.falsePositives}/${counts.expectedNegatives} (${pct(m.falsePositiveRate)}) | ${signed(Number((100 * d.falsePositiveRate).toFixed(1)))} percentage points |`,
    `| False-negative rate: FN/(TP+FN) | ${b.falseNegatives}/${counts.expectedPositives} (${pct(b.falseNegativeRate)}) | ${m.falseNegatives}/${counts.expectedPositives} (${pct(m.falseNegativeRate)}) | ${signed(Number((100 * d.falseNegativeRate).toFixed(1)))} percentage points |`,
    `| PRs missing an expected scope | ${b.missedRoutingCases}/${counts.prs} | ${m.missedRoutingCases}/${counts.prs} | ${signed(d.missedRoutingCases)} |`,
    `| Exact-match PRs | ${b.exactMatches}/${counts.prs} | ${m.exactMatches}/${counts.prs} | ${signed(d.exactMatches)} |`,
    '',
    '| PR | Expected | Selected in v2 | Added | Removed | False positives | False negatives |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...result.cases.map(
      (row) =>
        `| #${row.number} | ${names(row.expected)} | ${names(row.selected)} | ${names(row.added)} | ${names(row.removed)} | ${names(row.falsePositives)} | ${names(row.falseNegatives)} |`,
    ),
    '',
    'The two quality misses are corrected without dropping any previously selected scope. The nine existing false positives remain; broader route precision and task-text noise are separate gaps. Additional unseen cases are required to measure generalization. All selections remain advisory and non-blocking.',
    '',
    '## Frozen evidence and reproduction',
    '',
    'The [v2 JSON](routing-v2-results.json) freezes SHA-256 digests for the live router, map, catalog, evaluator, scorer, labelled fixtures and original evaluation evidence. It includes per-skill counts and exact routing reasons. `--check` recomputes these digests and all results and rejects drift; omit it only when intentionally publishing a new reviewed measurement.',
    '',
    'The [v1 freeze](forward-freeze.json), [inputs](forward-inputs.json), [labels](forward-labels.json), [blind review](forward-blind-review.json), [results](forward-results.json) and [report](forward-report.md) retain their original bytes. v1 now loads the exact original [router](baseline-v1/routing.mjs), [map](baseline-v1/review-map.yaml) and [catalog](baseline-v1/catalog.yaml), verified against the original freeze keys; historical provenance still uses those original keys.',
    '',
    '- `node scripts/agent-skills/evaluate-forward.mjs --check` reproduces v1.',
    '- `node scripts/agent-skills/evaluate-forward.mjs --routing-v2 --check` reproduces this comparison.',
    '- `node scripts/agent-skills/check-v1-completion.mjs --check` verifies the completion contract, including the frozen replay.',
    '',
  ].join('\n')
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
