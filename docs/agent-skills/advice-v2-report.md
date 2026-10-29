# Advice v2: scope gates on the two v1 unusable-advice cases

Coordinator record, 2026-10-29. A separate Codex reviewer ran `codex exec -s read-only` in an isolated folder that held only `advice-v2-brief.md`, `advice-v2-inputs.json` and the five revised skills (SKILL.md plus references). It could not read the v1 evaluation, labels, examples, tests or worklogs. Its full output is [advice-v2-review.json](advice-v2-review.json); all six review results pass `validateReviewResult`.

| PR   | Skill                             | v1 advice                         | v2 verdict     | v2 findings | v2 usefulness |
| ---- | --------------------------------- | --------------------------------- | -------------- | ----------- | ------------- |
| #130 | reader-frontend                   | usable                            | pass           | 2           | usable        |
| #130 | seo-distribution                  | unusable                          | not-applicable | 0           | unusable      |
| #130 | owner-publishing-ux               | usable                            | pass           | 1           | usable        |
| #130 | quality-reliability-observability | not selected in v1 (routing miss) | warn           | 2           | usable        |
| #128 | content-platform-backend          | usable                            | pass           | 2           | usable        |
| #128 | owner-publishing-ux               | unusable                          | not-applicable | 0           | unusable      |

Both v1 unusable-advice cases now stop at the scope gate. They return `not-applicable` with patch evidence for the absent scope, and no invented findings. The reviewer still marks them `unusable`, because an abstention gives no domain advice; it also calls both dispositions grounded, noting that they prevent an unwarranted audit. So the change removes invented advice; it does not create new advice where the skill's domain did not change. The other four assessments are usable: three that v1 also judged usable, plus quality-reliability-observability on #130, which v1 never selected (a routing miss fixed by #135). These are subjective, advisory judgments on two retrospective PRs, not a release gate or a generalization estimate. The original v1 counts and artifacts are unchanged.

Reviewer inputs (sha256):

- `.claude/skills/content-platform-backend/SKILL.md`: `69962ee5f01cb3aaa7b9be36baf5a65d18a7bcb885290431b8d5e7acc36462be`
- `.claude/skills/content-platform-backend/references/backend-map.md`: `a632fb595dd2ec676bb4dd96c3839ae32b9b5dcab5a725f800a04625c5f1d1e5`
- `.claude/skills/content-platform-backend/references/content-platform-backend-output-contract.md`: `6592a2806ddb485b98f0b982efcf7b0d6093bc56c86714810de52f39778c10d4`
- `.claude/skills/owner-publishing-ux/SKILL.md`: `c4232868906b0ef3a7c3895300be4220ebc4b14fb77a8d0b8704439abfdbec2f`
- `.claude/skills/owner-publishing-ux/references/owner-publishing-ux-output-contract.md`: `7599c1b4e2b6e47dbafabec48f8656b0f097937787842780a5a6ff8d0daae0d3`
- `.claude/skills/owner-publishing-ux/references/scope-abstention.md`: `8457184c9d8316b9fe0b8a634e33e3e48d49b49d1ad1218c87f5839c6dcb336f`
- `.claude/skills/quality-reliability-observability/SKILL.md`: `9ba0248b3bb94413c1747acb368ccde192fbfe1f1d8e9e2803a0c38b33911a74`
- `.claude/skills/quality-reliability-observability/references/quality-map.md`: `003b0dd0dcf36deb8a9387d72074a86286badcab702ac111dcc13c92d4c4b209`
- `.claude/skills/quality-reliability-observability/references/quality-reliability-observability-output-contract.md`: `a6706c76974db28d8e635b583e5c3a374514ed31bd52f54004cb46e66d11c4cc`
- `.claude/skills/reader-frontend/SKILL.md`: `2671eb13977d7b077c9d2544ff42b02926207c553f51a5149a0b5c3cff87c86e`
- `.claude/skills/reader-frontend/references/code-map.md`: `bdb8d92374b758b4ea965b2f590c0dc946aacf1706895ded7f4a85cbbf6e186b`
- `.claude/skills/reader-frontend/references/output-contract.md`: `685a48d0084c1868c417dcb04315b901da4ba93cbf28e7f2f04e0338be730412`
- `.claude/skills/seo-distribution/SKILL.md`: `4eefc7a9433b3780231dee8aebafcfdab5cb0daff233e746fe0bd3a78764d73f`
- `.claude/skills/seo-distribution/references/code-map.md`: `b152266855e36750b99eafd1fff136f6ab9af9cdb565a03596707ffede74a1d6`
- `.claude/skills/seo-distribution/references/output-contract.md`: `635626471f26b6396c5dca0ae94a63d3a2e0cb87e0917c1d57d3160685b7b328`
- `docs/agent-skills/advice-v2-brief.md`: `48b55a38dab1dc7efdb126dae84a7650a3e79abff5cadee640847500adf982a9`
- `docs/agent-skills/advice-v2-inputs.json`: `518248f809a7fa1b4bec0584b6123aa40151958fd00a0fbbfa85c118f00129b9`
