# Planning Rubrics

Use these rubrics when a plan is being prepared for autonomous `work`.

They are not a second workflow. They are feedforward checks that stop predictable drift before implementation starts.

Pair this file with [`autonomous-planning-standard.md`](./autonomous-planning-standard.md).

## UI And UX Planning Rubric

Use this when the task changes layout, hierarchy, interaction, navigation, or a room-facing / participant-facing / facilitator-facing surface.

The plan should answer all of these:

| Check | What "good" looks like |
| --- | --- |
| Surface job | The plan names the dominant question the screen must answer |
| User state | The plan states what the user should understand or do after landing |
| References | Positive examples or local patterns are named |
| Anti-references | The plan names what would feel wrong or off-system |
| Mobile behavior | The plan says what must still work on small screens |
| Action hierarchy | The primary action and supporting actions are explicit |
| Read vs edit mode | The plan says what belongs on the default canvas versus an editor or sheet |
| Proof slice | One representative screen or section is chosen first |
| Rejection criteria | The plan says what would make the result fail even if it looks polished |
| Preview artifact | The plan requires a mockup, HTML preview, or structural preview before implementation |

Reject the plan for autonomous UI work if it still sounds like:

- "clean it up"
- "make it nicer"
- "modernize the page"
- "make it feel premium"

Those are goals only after they are translated into observable behavior and anti-goals.

## Czech Editorial And Copy-Quality Planning Rubric

Use this for participant-facing, presenter-facing, public-facing, or facilitation-facing copy.

The plan should answer all of these:

| Check | What "good" looks like |
| --- | --- |
| Audience | The plan names who will read or hear the copy |
| Job of the text | The plan says what the text must help the audience understand or do |
| Voice | The plan points to the expected voice, not just "good Czech" |
| Anti-voice | The plan names phrases, tones, or habits that would feel translated, generic, or too corporate |
| Spoken-readability | The plan requires a read-aloud or cold-read check where relevant |
| Source material | The plan says whether to rewrite from stronger source material rather than polish weak copy |
| Dominant idea | Each key scene or block has one central point |
| Rejection criteria | The plan says what makes the copy fail: vague, overproduced, translated, blended voice, or facilitator-only jargon |
| Proof slice | One pack, screen, or section is chosen first |
| Review gate | A copy critic or editorial pass is explicitly required |

Reject the plan for autonomous editorial work if it still relies on:

- "make it sound better"
- "polish the wording"
- "make it more natural"

Those are review comments, not planning contracts.

## Public / Private Boundary Planning Rubric

Use this when the task touches auth, facilitator operations, participant access, workshop instance data, release notes, or anything that could leak event-specific state.

The plan should answer all of these:

| Check | What "good" looks like |
| --- | --- |
| Data classification | The plan states what is public-safe, private runtime, or facilitator-only |
| Auth path | The plan names which route or actor is allowed to see or mutate the new behavior |
| Exposure surfaces | The plan says where the change is visible and where it must not appear |
| Sample/demo safety | The plan states how demo data differs from real runtime data |
| Docs to update | The plan names ADRs, boundary docs, or runbooks that must change with behavior |
| Verification | The plan names the tests or tracer bullets that prove the boundary still holds |
| Release sensitivity | The plan says whether rollout needs extra checks or staging discipline |
| Rejection criteria | The plan says what would count as leakage, coupling, or ambiguous ownership |

Reject the plan if privacy or auth assumptions are still implicit.

## Release And Handoff Planning Checklist

Use this checklist before a plan is treated as ready for autonomous `work`:

- [ ] The rollout unit is explicit: proof slice first or broad propagation
- [ ] The verification commands or checks are named
- [ ] The docs, ADRs, or runbooks that must stay aligned are named
- [ ] The reviewer expectation is clear for subjective or boundary-sensitive work
- [ ] The next safe move is obvious if the work stops mid-stream
- [ ] The user-facing risk of partial completion is understood
- [ ] The release note or handoff impact is known if behavior changes materially

## Examples

Use these alongside the rubrics:

- [`autonomous-planning-examples.md`](./autonomous-planning-examples.md)
- [`autonomous-planning-proving-ground.md`](./autonomous-planning-proving-ground.md)
