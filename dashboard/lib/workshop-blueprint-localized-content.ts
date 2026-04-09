export const workshopBlueprintLocalizedContent = {
  en: {
    meta: {
      sampleDayLabel: "Sample workshop day",
      templateAddressLine: "Address or waypoint",
      templateLocationDetails: "Add the concrete venue, room, and logistics notes for this event.",
    },
    inventory: {
      briefs: [
        {
          id: "devtoolbox-cli",
          title: "DevToolbox CLI",
          problem:
            "Developers lose time on repeated small utilities that are scattered across wiki pages, shell history, and private notes.",
          userStories: [
            "As a developer, I want to turn a log or JSON blob into a readable format with one command.",
            "As a developer, I want a fast way to list the last problematic commits or branches.",
            "As a team, I want the commands documented clearly so another team can continue after the handoff.",
          ],
          architectureNotes: [
            "The CLI can be written in any language, but commands must stay easy to discover.",
            "AGENTS.md must explain the build and test flow and the expected output style.",
            "A handoff runbook matters more than a wide feature set.",
          ],
          acceptanceCriteria: [
            "There are at least 3 useful commands.",
            "README and AGENTS.md explain how to run the tool locally.",
            "A new team can add or fix another command within 10 minutes.",
          ],
          firstAgentPrompt:
            "Design a minimal CLI architecture that survives handoff. Start with AGENTS.md, then a plan, and only then implementation.",
        },
        {
          id: "standup-bot",
          title: "Standup Bot",
          problem:
            "Daily standups in chat often become long, inconsistent, and hard to review later.",
          userStories: [
            "As a team lead, I want standup replies collected into one overview.",
            "As a developer, I want blockers and dependencies visible in one place.",
            "As the next team after rotation, I want to understand the data flow and integration points quickly.",
          ],
          architectureNotes: [
            "Prefer a clear data model over a complicated integration.",
            "Mock data is fine if the workflow still feels realistic.",
            "Prompts and runbooks must be part of the solution, not a side note.",
          ],
          acceptanceCriteria: [
            "The bot can ingest at least seed data and produce a summary.",
            "The repo explains how to extend the solution to a real chat channel.",
            "After rotation, another team can continue without verbal explanation.",
          ],
          firstAgentPrompt:
            "Split the work into ingest, summarization, and context for the next team. Before implementation, create the documentation the next team should open first.",
        },
        {
          id: "code-review-helper",
          title: "Code Review Helper",
          problem:
            "Code review is often inconsistent, and some changes pass without a checklist or a clear view of risk.",
          userStories: [
            "As a reviewer, I want a checklist of risks and questions extracted from a diff.",
            "As the author of a change, I want to see what I should test before I ask for review.",
            "As the inheriting team, I want to continue from the heuristics the first team discovered.",
          ],
          architectureNotes: [
            "This can be a CLI, a web tool, or a simple script. The key is the diff-to-checklist flow.",
            "State clearly which inputs the tool expects.",
            "Add an examples folder or a seed diff for local testing.",
          ],
          acceptanceCriteria: [
            "The tool produces a review checklist from a seed diff.",
            "It explains what is heuristic and what is certain.",
            "Another team can add a new rule without a long onboarding call.",
          ],
          firstAgentPrompt:
            "Do not start by generating code. First define the review rules, the input flow, and what a good checklist actually means.",
        },
        {
          id: "metrics-dashboard",
          title: "Metrics Dashboard",
          problem:
            "Teams have data but struggle to turn it into a shared view that actually supports decisions.",
          userStories: [
            "As a team, I want several metrics on one screen.",
            "As a facilitator, I want to change seed data without touching UI logic.",
            "As the next team after rotation, I want to understand the screen and data structure within minutes.",
          ],
          architectureNotes: [
            "Separate seed data from UI from the first commit.",
            "Mobile-first is a plus, but projected desktop view still needs to stay readable.",
            "Monitoring and README should explain what already works and what does not.",
          ],
          acceptanceCriteria: [
            "The dashboard shows at least 3 metrics and one trend.",
            "The repo describes both data sources and mock fallbacks.",
            "A new team can add another metric without breaking the layout.",
          ],
          firstAgentPrompt:
            "Design a dashboard that survives handoff. First describe the data model, components, and done criteria, and only then write the UI.",
        },
      ],
      challenges: [
        {
          id: "agents-md",
          title: "Create AGENTS.md as a map",
          category: "Context Engineering",
          phaseHint: "before-lunch",
          description: "Write down the goal, build and test flow, durable rules, and where the next team should look first.",
          completedBy: ["t1", "t3"],
        },
        {
          id: "review-skill",
          title: "Write a code review skill",
          category: "Context Engineering",
          phaseHint: "before-lunch",
          description:
            "At least one repeatable review routine must live in the repo as a skill or runbook, not only in a prompt.",
          completedBy: [],
        },
        {
          id: "plan-first",
          title: "Use /plan before coding",
          category: "Workflow",
          phaseHint: "before-lunch",
          description:
            "Let the agent plan the work first, show what the plan was based on, and record the next safe move.",
          completedBy: ["t2"],
        },
        {
          id: "smallest-verification",
          title: "Add the smallest useful verification",
          category: "Workflow",
          phaseHint: "before-lunch",
          description:
            "Create a RED test, tracer bullet, or simple browser check before you give the agent more autonomy.",
          completedBy: [],
        },
        {
          id: "parallel-agents",
          title: "Run 2 parallel Codex sessions",
          category: "Advanced",
          phaseHint: "after-rotation",
          description:
            "Split the problem into two independent streams and compare what actually worked.",
          completedBy: [],
        },
        {
          id: "done-when",
          title: "Add 'Done When' to every task",
          category: "Meta",
          phaseHint: "anytime",
          description:
            "Every important task needs an explicit completion criterion and a link to verification.",
          completedBy: ["t4"],
        },
      ],
      ticker: [
        { id: "tick-1", label: "Team 3 just added its first custom skill.", tone: "highlight" },
        { id: "tick-2", label: "Team 1 has made 6 commits in the last 30 minutes.", tone: "signal" },
        {
          id: "tick-3",
          label: "Intermezzo in 12 minutes: write what changed, what verifies it, and what the next team should read first.",
          tone: "info",
        },
      ],
      setupPaths: [
        {
          id: "cli",
          label: "Codex CLI",
          audience: "macOS / Linux",
          summary: "The fastest path for people who want to work directly in the repo and terminal.",
        },
        {
          id: "app",
          label: "Codex App",
          audience: "Windows / macOS",
          summary: "A safe fallback for participants who do not want to solve CLI setup first thing in the morning.",
        },
        {
          id: "web",
          label: "Web fallback",
          audience: "when setup gets blocked",
          summary: "Use this when installation or authentication is blocking you.",
        },
      ],
    },
    phases: {
      opening: {
        label: "Opening and orientation",
        goal:
          "Set the tone for the day and make the operating constraint unmistakable: the work has to stay legible, verifiable, and ready for the next move, not just look good in the moment.",
        roomSummary:
          "The room should understand, early and without ambiguity, that this is not a prompting contest. The job today is to build a repo, workflow, and instruction set that still holds without improvised explanation.",
        facilitatorPrompts: [
          "Today is not about being the fastest. It is about making the work legible, verifiable, and ready for the next move.",
          "If an important rule lives only in table talk, it does not exist yet.",
          "Later blocks will test whether the repo can carry the work without spoken rescue.",
        ],
        watchFors: [
          "Someone frames the day as a prompting contest or a feature race.",
          "Teams wait for a tool demo instead of understanding the working discipline.",
          "The facilitator talks only about output and never makes the legibility constraint explicit.",
        ],
        checkpointQuestions: [
          "Where would the next team find this without you?",
          "What is actually verified here?",
          "What is the next safe move for a new person or agent?",
        ],
        sourceRefs: [{ label: "Facilitation guide: Opening and welcome", path: "content/facilitation/master-guide.md" }],
        scenes: {
          "opening-framing": {
            label: "Opening framing",
            title: "Today we are building a working system, not prompt theatre",
            body:
              "The goal today is not one impressive answer. The goal is a repo, workflow, and instruction set that still makes sense to an agent or a new team without your running commentary.",
            facilitatorNotes: [
              "Start calm, but sharp. The key beat is that the work must stay legible without improvised rescue.",
              "Do not drift into tool marketing. Frame the working discipline: what is not written into the repo will not survive the next move.",
              "After the quote, pause briefly and let the line land before you move into the room contract.",
            ],
            sourceRefs: [{ label: "Facilitation guide: Opening and welcome", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "opening-hero": {
                eyebrow: "Harness Lab",
                title: "Today we are building a working system, not prompt theatre",
                body:
                  "Harness engineering means shaping instructions, context, verification, and workflow so the agent and the next team can continue safely. That is the system we are building today.",
              },
              "opening-quote": {
                quote:
                  "We are not learning to prompt better. We are learning to build a working system that carries the next move without table-side explanation.",
                attribution: "Talk: Context is King",
              },
              "opening-framing-callout": {
                title: "What we are really testing today",
                body:
                  "Not speed and not showmanship. We are testing whether the repo makes the intent, boundaries, verification, and next safe move legible.",
              },
            },
          },
          "opening-handoff-loop": {
            label: "What the working system has to hold",
            title: "A good harness keeps four things connected",
            body: "A strong workshop repo is not a pile of prompts. It is a working map where the goal, context, verification, and next step stay readable together.",
            facilitatorNotes: [
              "Use this as a working map, not as abstract theory. Give one tight sentence to each element.",
              "Do not get lost in tooling detail. The point is that intent, repo context, verification, and the next safe move must stay connected.",
              "Close with the line that harness engineering is about making the right next move readable and verifiable.",
            ],
            sourceRefs: [
              { label: "Facilitation guide: Opening and welcome", path: "content/facilitation/master-guide.md" },
              { label: "Talk: Context is King", path: "content/talks/context-is-king.md" },
            ],
            blocks: {
              "opening-loop-steps": {
                title: "Four things that should be readable immediately",
                items: [
                  {
                    title: "Clear goal",
                    body: "What exactly are you building today, for whom, and why this matters right now.",
                  },
                  {
                    title: "Repo-native map",
                    body: "README, AGENTS.md, a plan, a runbook, or a skill. Not just chat, memory, and table talk.",
                  },
                  {
                    title: "Explicit verification",
                    body: "A test, tracer bullet, or another executable check that keeps reality stronger than enthusiasm.",
                  },
                  {
                    title: "Next safe move",
                    body: "Another person or agent knows where to continue without improvised rescue.",
                  },
                ],
              },
              "opening-loop-callout": {
                title: "Harness engineering in one sentence",
                body: "Do not patch one more instruction onto one more instruction. Build a working environment where the correct next move is legible and verifiable.",
              },
            },
          },
          "opening-room-contract": {
            label: "Contract for today",
            title: "What should be visible before lunch",
            body:
              "After the first block, a team should not leave behind hype. It should leave behind the working foundation that keeps direction clear and reduces improvisation.",
            facilitatorNotes: [
              "This is not a motivational slide. It is the operating contract you return to all morning.",
              "If a line item is missing, do not replace it with verbal coaching. Help the team create the smallest useful version of the artifact.",
            ],
            sourceRefs: [{ label: "Facilitation guide: Build Phase 1", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "opening-contract-checklist": {
                title: "Before lunch, you should be able to see",
                items: [
                  "A repo and README that make sense to a new reader.",
                  "An AGENTS.md that is a map, not a warehouse dump.",
                  "A plan that makes the next safe move legible.",
                  "The smallest useful check before more generation.",
                ],
              },
              "opening-contract-callout": {
                title: "One practical rule",
                body:
                  "If verification is missing, another prompt will not save the team. Push the smallest test or tracer bullet that puts the work back on the ground.",
              },
            },
          },
          "opening-participant-view": {
            label: "Participant welcome board",
            title: "How to read the start of the day",
            body:
              "At the start of the day, the participant view should answer three things cleanly: what is happening now, what comes next, and why the important rules have to live in the repo.",
            facilitatorNotes: [
              "Use this scene when you want to show the room that the participant layer is not a promo banner, but working orientation.",
              "Name the three things participants should get in one glance: what is live now, what comes next, and what has to exist in the repo.",
            ],
            sourceRefs: [{ label: "Facilitation guide: Opening and welcome", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "opening-participant-hero": {
                eyebrow: "Harness Lab",
                title: "Today is not prompt theatre",
                body:
                  "From the first minute, the participant view should carry the same discipline as the facilitator view: the live phase, the next step, and the rule that if it is not in the repo, it is not reliable yet.",
              },
              "opening-participant-preview": {
                body:
                  "The start of the day should read in one glance: what is live now, what comes next, and why durable context belongs in files instead of side conversations.",
              },
              "opening-participant-callout": {
                title: "What should land even without a facilitator",
                body:
                  "Repo-native context is part of the work. The next step should be safe and traceable. The afternoon continuation will test what actually survives handoff.",
              },
            },
          },
        },
      },
      talk: {
        goal:
          "Show that harness engineering is the work of shaping instructions, context, and workflow so a model becomes a reliable collaborator instead of a roulette wheel.",
        roomSummary:
          "By the end of the talk, the room should see AGENTS.md, skills, runbooks, and checks as working infrastructure rather than optional polish.",
        facilitatorPrompts: [
          "We are not learning to prompt better. We are learning to build a repo and workflow where an agent and another team can continue safely.",
          "If it is not in the repo, it does not exist.",
          "When the agent does more, you need to verify better.",
        ],
        watchFors: [
          "The talk turns into a tool feature tour.",
          "Teams hear prompting tips instead of workflow discipline.",
          "There is no link to the afternoon continuation.",
        ],
        checkpointQuestions: [
          "What will you move from your head or from chat into the repo today?",
          "Which repo signal would help another team continue?",
          "Which explicit check will be your trust boundary today?",
        ],
        sourceRefs: [{ label: "Talk: Context is King", path: "content/talks/context-is-king.md" }],
        scenes: {
          "talk-framing": {
            label: "Core line",
            title: "Context is leverage, not cosmetics",
            body:
              "Harness engineering is not a trick for a better prompt. It is the discipline of shaping context, instructions, and workflow so the model and the next team can continue predictably.",
            facilitatorNotes: [
              "Use the reframing sentence and explicitly contrast a better prompt with a better working system.",
              "After the callout, briefly remind the room that a team lead does not spend the day feeding one developer another instruction every thirty seconds.",
            ],
            sourceRefs: [{ label: "Talk: Core line", path: "content/talks/context-is-king.md" }],
            blocks: {
              "talk-hero": {
                eyebrow: "Context is King",
                title: "We are not learning to prompt better",
                body:
                  "We are learning to build a repo and workflow where the model and the next team can continue safely without folklore and without verbal rescue.",
              },
              "talk-reframe": {
                title: "A team lead does not stand behind the model",
                body:
                  "Just as you do not guide a developer by drip-feeding one sentence every thirty seconds, you do not get durability from endless prompt patching. You build a system people can work inside.",
              },
              "talk-adopt": {
                title: "What to adopt today",
                items: [
                  "Before generating the next feature, make the repo a place people can actually navigate.",
                  "When the agent does more, you need to verify better.",
                  "Handoff is a design condition throughout the day, not an ending.",
                ],
              },
            },
          },
          "talk-micro-exercise": {
            label: "Micro-exercise",
            title: "Prompt blob vs. repo-native context",
            body:
              "Run the same small task twice: once with a prompt blob, once with a short brief and four elements in AGENTS.md. The point is not to crown the better prompt. The point is to show which setup produces reusable work.",
            facilitatorNotes: [
              "Do not let this drift into a debate about which model is smarter. The point is transferring intent and boundaries.",
            ],
            sourceRefs: [{ label: "Talk: Micro-exercise", path: "content/talks/context-is-king.md" }],
            blocks: {
              "talk-steps": {
                title: "How to show it",
                items: [
                  { title: "The same task for everyone", body: "Short, clear, and free of unnecessary scenario." },
                  { title: "Variant A: prompt blob", body: "No structure, no repo-native context." },
                  { title: "Variant B: 4 context elements", body: "Goal, Context, Constraints, Done When." },
                ],
              },
              "talk-callout": {
                title: "The point",
                body:
                  "The winning move is not prettier wording. It is a way of working that carries intent, constraints, and done criteria into the next turn.",
              },
            },
          },
          "talk-participant-view": {
            label: "Participant walkthrough",
            title: "Participant surface walkthrough",
            body:
              "Show the participant view as a real working surface for the team: live moment, nearest next step, room-wide notes, and confidence that the room and the repo still describe the same reality.",
            ctaLabel: "Open the workshop skill reference",
            facilitatorNotes: [
              "Use this briefly. It is the bridge into the idea that the participant layer and facilitator dashboard both need to stay consistent.",
            ],
            sourceRefs: [{ label: "Talk: Opening move", path: "content/talks/context-is-king.md" }],
            blocks: {
              "talk-participant-hero": {
                eyebrow: "Participant surface",
                title: "What the team should see without facilitator noise",
                body:
                  "The participant view should not be decoration. In one screen it should give the team the live phase, the next step, room-wide notes, and confidence that the control room is not telling a different story.",
              },
              "talk-participant-cues": {
                title: "What to point out to the room",
                items: [
                  "The live phase and the nearest next step.",
                  "Shared room notes that help every table equally.",
                  "The same workshop moment on the participant layer and in the control room.",
                ],
              },
              "talk-participant-preview": {
                body:
                  "The participant layer should show only what the team needs right now: the live moment, the next step, and shared notes from the room.",
              },
              "talk-participant-bridge": {
                title: "Bridge into the day",
                body:
                  "This is the participant-side equivalent of the facilitator pack. Important workshop moments should stay legible from both sides without drifting into two separate realities.",
              },
            },
          },
        },
      },
      demo: {
        goal:
          "Use one compact story to show a real working line: context, planning, implementation, review, and explicit fallback moves when something goes wrong.",
        roomSummary:
          "The room should see quality rise as context, planning, and review enter the flow. The point is not magic output, model mystique, or a feature parade.",
        facilitatorPrompts: [
          "One story-driven example, not a feature list.",
          "The tool alone is not enough. The working system around it is what matters.",
          "Review is not an emergency brake at the end. It is part of the workflow.",
        ],
        watchFors: [
          "The demo runs long and waits on generation.",
          "It shows five modes of work instead of one clear line.",
          "There are no explicit closure points after AGENTS.md, /plan, and /review.",
        ],
        checkpointQuestions: [
          "What in this flow carries intent and constraints?",
          "Where can you see that review is part of the process?",
          "What from this do you need to be able to build in your own repo?",
        ],
        sourceRefs: [{ label: "Talk: Codex Demo Script", path: "content/talks/codex-demo-script.md" }],
        scenes: {
          "demo-story": {
            label: "Demo story",
            title: "Not another prompt. A working system.",
            body:
              "The demo story is intentionally ordinary: a developer gets a small task and chooses not to keep nudging the model blindly, but to build a system that will support the next iteration too.",
            facilitatorNotes: [
              "Stay with one line. After 15 minutes, the audience should understand the workflow, not the tool menu.",
            ],
            sourceRefs: [{ label: "Codex Demo Script: Story", path: "content/talks/codex-demo-script.md" }],
            blocks: {
              "demo-hero": {
                eyebrow: "Codex demo",
                title: "Not another prompt. A working system.",
                body: "One compact story where you can watch context, planning, implementation, and review reinforce each other.",
              },
              "demo-story-quote": {
                quote: "The tool alone is not enough. The working system around it is what matters.",
                attribution: "Harness Lab demo framing",
              },
            },
          },
          "demo-workflow": {
            label: "Workflow steps",
            title: "From AGENTS.md to review",
            body:
              "The sequence should be simple enough for every table to repeat: without context it drifts, with AGENTS.md, /plan, and /review it becomes a working system instead of another prompt.",
            facilitatorNotes: [
              "Have snapshots ready as fallbacks. Do not wait on generation for long.",
              "Do not drift into a feature tour or five different modalities.",
              "After the callout, say the room-level point explicitly: quality rises fast when you add context, planning, and review.",
            ],
            sourceRefs: [{ label: "Codex Demo Script: Flow", path: "content/talks/codex-demo-script.md" }],
            blocks: {
              "demo-steps": {
                title: "The workflow you want people to repeat",
                items: [
                  { title: "Without context the agent drifts", body: "Briefly show a weak start without guardrails." },
                  { title: "AGENTS.md with 4 elements", body: "Goal, Context, Constraints, Done When." },
                  { title: "Let the agent plan", body: "/plan turns one vague task into bounded moves." },
                  { title: "Small implementation slice + review", body: "Review belongs inside the workflow, not as panic recovery at the end." },
                ],
              },
              "demo-point": {
                title: "Point for the room",
                body:
                  "The point is not a magical result. The point is how fast quality rises once you add context, planning, and review.",
              },
              "demo-fallbacks": {
                title: "Fallbacks",
                items: [
                  { label: "CLI is not working", href: "https://github.com/ondrej-svec/harness-lab/blob/main/workshop-skill/install.md", description: "Switch to the Codex App." },
                  { label: "The app is not working", href: "https://github.com/ondrej-svec/harness-lab/blob/main/README.md", description: "Use the web fallback." },
                  { label: "The demo is slow", href: "https://github.com/ondrej-svec/harness-lab/blob/main/docs/agent-ui-testing.md", description: "Have a repo snapshot after each step." },
                ],
              },
            },
          },
          "demo-participant-view": {
            label: "Participant demo board",
            title: "Treat the demo as workflow, not a feature tour",
            body:
              "During the demo, the participant view should hold one clean story line: where context came from, where planning happened, what got checked, and how trust was restored.",
            facilitatorNotes: [
              "Use this when you want to remind the audience that the demo also needs learner-facing logic and a clear working line.",
            ],
            sourceRefs: [{ label: "Talk: Codex Demo Script", path: "content/talks/codex-demo-script.md" }],
            blocks: {
              "demo-participant-hero": {
                eyebrow: "Codex demo",
                title: "Watch the working system, not only the output",
                body:
                  "During the demo, keep your eye on the invisible scaffolding: where context came from, where the plan appeared, what got verified, and how review turned output into something safer to trust.",
              },
              "demo-participant-steps": {
                title: "Pay attention to",
                items: [
                  { title: "Where context comes from", body: "AGENTS.md and the brief, not only a prompt blob." },
                  { title: "Where planning happens", body: "Before implementation starts." },
                  { title: "Where verification happens", body: "Review and checks are part of the workflow, not an extra." },
                ],
              },
              "demo-participant-preview": {
                body: "During the demo, the participant layer should show a workflow cue, not a feature checklist.",
              },
            },
          },
        },
      },
      "build-1": {
        goal:
          "Get every table to a real before-lunch baseline: a navigable repo, AGENTS.md, a plan, one explicit check, and a first reviewed slice of work.",
        roomSummary:
          "The facilitator should keep the milestone board visible, coach through questions, and keep pushing teams away from unbounded generation and toward explicit verification.",
        facilitatorPrompts: [
          "Coach first, mentor second, teach only as a last resort.",
          "If the team has no verification at all, push for the smallest useful test or tracer bullet.",
          "Return learner-facing artifacts to participants, not the whole backstage of Harness Lab.",
        ],
        watchFors: [
          "The team keeps generating text, but verifies nothing.",
          "AGENTS.md grows into a warehouse for everything.",
          "It is unclear what is done, what is in progress, and what is only a hypothesis.",
        ],
        checkpointQuestions: [
          "Does the team have one shared understanding of the goal?",
          "Is context accumulating in the repo, or staying in heads and chat?",
          "Could another team find the first safe move in five minutes?",
        ],
        sourceRefs: [{ label: "Facilitation guide: Build Phase 1", path: "content/facilitation/master-guide.md" }],
        scenes: {
          "build-1-milestones": {
            label: "Milestone board",
            title: "What should be visible before lunch",
            body: "By lunch, the room should be able to point at five things: repo, AGENTS.md, plan, one executable check, and a first reviewed output.",
            facilitatorNotes: ["This is the main room cue for Build Phase 1. Keep it on the projector often."],
            sourceRefs: [
              { label: "Facilitation guide: Visible milestone board", path: "content/facilitation/master-guide.md" },
            ],
            blocks: {
              "build-1-checklist": {
                title: "Milestones",
                items: [
                  "By 10:50, a repo exists.",
                  "By 11:15, AGENTS.md exists.",
                  "By 11:30, a plan exists.",
                  "By 11:45, a build/test command or tracer bullet exists.",
                  "By 12:00, a first reviewed output exists.",
                ],
              },
              "build-1-callout": {
                title: "Watch out",
                body: "When the agent gets more autonomy, the team has to raise the quality of verification.",
              },
            },
          },
          "build-1-coaching": {
            label: "When a team gets stuck",
            title: "When a team gets stuck, return to the system",
            body:
              "First aid is not a long explanation. It is a return to the goal, the repo artifacts, and the smallest check that anchors the work back in reality.",
            facilitatorNotes: [
              "Good help is not a verbal handoff. It is returning the team to the repo, checks, and the next safe move.",
              "Keep the order coach -> mentor -> teacher. If you explain for too long, return the team to work quickly.",
            ],
            sourceRefs: [{ label: "Facilitation guide: What to look for while circulating", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "build-1-roles": {
                title: "Before you reach for another prompt",
                items: [
                  { title: "Clarify the goal", body: "Make sure it is clear what the team is trying to do and how they will know they moved forward." },
                  { title: "Find the missing artifact", body: "Is the problem in the README, AGENTS.md, plan, runbook, or repo structure?" },
                  { title: "Add the smallest check", body: "A test, tracer bullet, or another executable signal moves the work from guessing back to evidence." },
                ],
              },
              "build-1-watch": {
                title: "What another team must be able to read",
                items: [
                  "The team has one shared understanding of the goal.",
                  "Context grows in the repo, not only in conversation.",
                  "A test, tracer bullet, or another explicit check exists.",
                  "From the repo, you can tell what is done and what the next safe move is.",
                ],
              },
              "build-1-rescue": {
                title: "Another instruction is not always help",
                body:
                  "If the team gets the answer without artifacts and without a check, the problem only goes underground. Return the work to the repo and to a verifiable next move.",
              },
            },
          },
          "build-1-participant-view": {
            label: "Participant board",
            title: "Build Phase 1 for the team",
            body:
              "During Build Phase 1, the participant view should not dump the whole backstage. It should hold the live moment, the next step, and the room-wide signal so the team can keep moving without noise.",
            ctaLabel: "Open the install flow",
            facilitatorNotes: [
              "Use this when you want to return a learner-facing view to the team instead of facilitator backstage.",
            ],
            sourceRefs: [{ label: "Facilitation guide: Build Phase 1", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "build-1-participant-hero": {
                eyebrow: "Build Phase 1",
                title: "What the team should keep visible before lunch",
                body:
                  "Keep four things in view: a short AGENTS.md as a map, a plan, the build/test flow, and the first verified step. The participant view should keep that together with the next safe move.",
              },
              "build-1-participant-focus": {
                title: "Keep in frame now",
                items: [
                  "A short AGENTS.md as the repo map.",
                  "A plan and the first verified step.",
                  "A room signal that will also help the next team continue.",
                ],
              },
              "build-1-participant-preview": {
                body:
                  "Watch the live phase, the next block, and the shared room notes. Detailed backstage control belongs to the facilitator, not to the participant view.",
              },
              "build-1-participant-callout": {
                title: "If you get stuck",
                body:
                  "Return to the README, AGENTS.md, the plan, and the smallest useful verification instead of another round of unbounded generation.",
              },
            },
          },
        },
      },
      "intermezzo-1": {
        label: "Intermezzo 1",
        goal:
          "Make the first round of learning visible across the room and reconnect teams to the discipline behind the output, not only to the output itself.",
        roomSummary:
          "Each team gives one tight signal. The facilitator then connects repo evidence, room observations, and one principle point grounded in what is actually happening.",
        facilitatorPrompts: [
          "What did you change and why?",
          "What did you move from chat or from your head into the repo?",
          "What are you verifying today with an executable check?",
        ],
        watchFors: [
          "The intermezzo slips into reporting without a principle point.",
          "Only the loudest team speaks while the others stay passive.",
          "The facilitator summarizes impressions instead of evidence.",
        ],
        checkpointQuestions: [
          "What did you move from your head or chat into the repo?",
          "What are you verifying today with an executable check?",
          "What should the next team read first?",
        ],
        sourceRefs: [{ label: "Facilitation guide: Intermezzos", path: "content/facilitation/master-guide.md" }],
        scenes: {
          "intermezzo-1-checkpoint": {
            label: "Checkpoint board",
            title: "Intermezzo: evidence, not impressions",
            body:
              "Keep the intermezzo disciplined: one sentence from each team, then a room summary, then one principle point tied to real evidence rather than facilitator vibes.",
            facilitatorNotes: ["Keep it short. The intermezzo is a reset and checkpoint, not a long presentation."],
            sourceRefs: [{ label: "Facilitation guide: Intermezzos", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "intermezzo-1-steps": {
                title: "Three steps",
                items: [
                  { title: "Teams: one sentence", body: "What we changed and why." },
                  { title: "Shared signal summary", body: "What is visible at the tables, in the repo, and in monitoring." },
                  { title: "One principle point", body: "Tied to real room behavior." },
                ],
              },
              "intermezzo-1-questions": {
                title: "Checkpoint questions",
                items: [
                  "What did you move from chat or from your head into the repo?",
                  "What are you verifying today with an executable check?",
                  "What should the next team read first?",
                ],
              },
            },
          },
          "intermezzo-1-participant-view": {
            label: "Participant intermezzo board",
            title: "Intermezzo: what the room should notice",
            body:
              "In the intermezzo, the participant view should make the important room signals legible without turning the moment into reporting theatre.",
            facilitatorNotes: ["This scene keeps the intermezzo as a short checkpoint for the whole room."],
            sourceRefs: [{ label: "Facilitation guide: Intermezzos", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "intermezzo-1-participant-hero": {
                eyebrow: "Intermezzo 1",
                title: "We collect signals, not impressions",
                body:
                  "The short intermezzo should help every table notice what is actually changing in the repo and in the way the teams are working.",
              },
              "intermezzo-1-participant-questions": {
                title: "Listen especially for",
                items: [
                  "What changed and why.",
                  "What moved from people’s heads into the repo.",
                  "What is actually being verified today.",
                ],
              },
              "intermezzo-1-participant-preview": {
                body: "Here the participant layer keeps the intermezzo as a shared checkpoint, not a backstage summary.",
              },
            },
          },
        },
      },
      "lunch-reset": {
        label: "Lunch and handoff prep",
        goal:
          "Interrupt the momentum before the afternoon shift and force teams to leave behind a repo another group can actually read.",
        roomSummary:
          "Before lunch, teams need to clean up context, record the next safe move, and leave the repo in a state that does not rely on their memory. Lunch is not a pause in the handoff constraint.",
        facilitatorPrompts: [
          "Handoff is not the end of the day. It is a design constraint throughout the day.",
          "Write down what the next team should read first.",
          "If the same rule was said aloud twice, it belongs in the repo.",
        ],
        watchFors: [
          "Teams leave for lunch without a clear next step and without cleaned-up context.",
          "A key decision is still only in people’s heads.",
          "The repo does not explain the midday state.",
        ],
        checkpointQuestions: [
          "What should the next team read first?",
          "Does the repo show what is done, what is a hypothesis, and what the next safe move is?",
          "What still lives only in conversation and must go into the repo?",
        ],
        sourceRefs: [
          { label: "Talk: What I want them to adopt", path: "content/talks/context-is-king.md" },
          { label: "Facilitation guide: What to normalize", path: "content/facilitation/master-guide.md" },
        ],
        scenes: {
          "lunch-reset-transition": {
            label: "Lunch reset",
            title: "Clean up, do not escape",
            body:
              "Before anyone leaves for lunch, the repo has to show what changed, what verifies it, and what the next safe move is for the incoming team.",
            facilitatorNotes: [
              "This is quiet handoff prep. Explain it as part of the work, not as admin overhead.",
            ],
            sourceRefs: [{ label: "Talk: What I want them to adopt", path: "content/talks/context-is-king.md" }],
            blocks: {
              "lunch-reset-checklist": {
                title: "Before lunch",
                items: [
                  "The next safe move is written down.",
                  "Key rules and decisions are in the repo.",
                  "It is clear what is done and what is only a hypothesis.",
                  "The next team knows what to read first.",
                ],
              },
            },
          },
          "lunch-reset-participant-view": {
            label: "Participant lunch reset board",
            title: "Clean up context before lunch",
            body:
              "Before lunch, the participant view should narrow attention to handoff prep: what still needs to be written down, what the next team should open first, and what must stop living only in conversation.",
            facilitatorNotes: ["Use this when you want to remind teams that lunch is not a break from handoff."],
            sourceRefs: [{ label: "Facilitation guide: What to normalize", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "lunch-reset-participant-hero": {
                eyebrow: "Lunch reset",
                title: "Do not leave without the next safe move",
                body:
                  "Before lunch, the repo has to make four things obvious: what changed, what is done, what is still only a hypothesis, and how the next team should continue.",
              },
              "lunch-reset-participant-checklist": {
                title: "Before you step away",
                items: [
                  "The next safe move is written down.",
                  "Key decisions are in the repo.",
                  "It is clear what is done and what is still a hypothesis.",
                  "The next team knows what to open first.",
                ],
              },
              "lunch-reset-participant-preview": {
                body:
                  "During lunch reset, the participant layer should hold a handoff-ready view, not only a countdown to lunch.",
              },
            },
          },
        },
      },
      rotation: {
        label: "Team rotation",
        goal:
          "Force a quiet start after rotation and let repo quality reveal what is genuinely legible.",
        roomSummary:
          "For the first ten minutes, the incoming team only reads the repo and maps the situation. Any confusion is diagnostic data about the quality of the context, not a workshop bug to be patched with talk.",
        facilitatorPrompts: [
          "The first 10 minutes are quiet. No improvised explanation.",
          "For the first 10 minutes, the new team only reads the repo and maps the situation.",
          "Frustration is not a workshop bug. It is a signal of context quality in the repository.",
        ],
        watchFors: [
          "The original team starts explaining things verbally.",
          "The new team edits the first file they open without a situation map.",
          "The facilitator rescues a weak repo signal with spoken handoff.",
        ],
        checkpointQuestions: [
          "What helps, what is missing, what is risky, and what is the next safe move?",
          "Does the repo make it clear where to look first?",
          "What needs to be written, clarified, or verified after rotation?",
        ],
        sourceRefs: [{ label: "Facilitation guide: Rotation", path: "content/facilitation/master-guide.md" }],
        scenes: {
          "rotation-framing": {
            label: "Rotation framing",
            title: "Quiet start after rotation",
            body:
              "For the first ten minutes, the incoming team only reads the repo and builds its own picture of the situation. Do not rescue the system with spoken explanation; let the repo show its quality honestly.",
            facilitatorNotes: ["Be strict. The moment you allow improvised explanation, the whole point of the afternoon is lost."],
            sourceRefs: [{ label: "Facilitation guide: Rotation", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "rotation-hero": {
                eyebrow: "Continuation shift",
                title: "Quiet start after rotation",
                body: "The repo has to show where to start now.",
              },
              "rotation-callout": {
                title: "The first 10 minutes",
                body: "Only read, map the situation, and write your own diagnosis.",
              },
            },
          },
          "rotation-instructions": {
            label: "Instructions for the new team",
            title: "How to start after rotation",
            body:
              "Start with the README, AGENTS.md, and the plan. The first job is not coding. It is making a map: what helps, what is missing, what is risky, and what the next safe move is.",
            facilitatorNotes: [
              "If the team does not know what to reach for, return them to learner kit artifacts.",
              "Make sure the team's own diagnosis appears before the first edit.",
            ],
            sourceRefs: [{ label: "Facilitation guide: Instructions for the new team", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "rotation-steps": {
                title: "New team",
                items: [
                  { title: "Start with the README, AGENTS.md, and the plan", body: "Do not skip the repo map." },
                  { title: "Write your own diagnosis", body: "What helps, what is missing, what is risky, and what is the next safe move?" },
                  { title: "Only then change code", body: "Do not reward confusion by editing the first file you see." },
                  {
                    title: "When unsure, return to the learner kit",
                    body: "Template-agents, reference, analyze-checklist, and challenge cards should be the first support, not verbal rescue.",
                  },
                ],
              },
              "rotation-toolkit": {
                title: "If you do not know where to start",
                body:
                  "Return to the learner kit and to the guiding artifacts in the repo. A weak signal should not be rescued by an improvised briefing.",
              },
            },
          },
          "rotation-participant-view": {
            label: "Participant handoff board",
            title: "Rotation without verbal handoff",
            body:
              "During rotation, the participant view should keep the incoming team anchored in the repo map, the next safe move, and the room-wide signal. It should support orientation, not replace missing repo context with softer prose.",
            facilitatorNotes: [
              "This is the participant equivalent of the hard handoff moment. It helps keep the room disciplined without backstage details.",
            ],
            sourceRefs: [{ label: "Facilitation guide: Rotation", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "rotation-participant-hero": {
                eyebrow: "Continuation shift",
                title: "The new team starts with a map, not improvisation",
                body:
                  "Read the README, AGENTS.md, and the plan first. The participant view should keep the live moment, the next step, and shared room notes together while the team takes stock.",
              },
              "rotation-participant-steps": {
                title: "The first 10 minutes",
                items: [
                  { title: "Read the repo map", body: "Start with the README, AGENTS.md, and the plan." },
                  { title: "Write your own diagnosis", body: "What helps, what is missing, what is risky, and what is the next safe move?" },
                  { title: "Only then change things", body: "Do not start editing without a shared situation map." },
                ],
              },
              "rotation-participant-preview": {
                body:
                  "The participant view should not compensate for a weak repo map. It should help the new team stay aligned while they take over the work honestly.",
              },
            },
          },
        },
      },
      "build-2": {
        goal:
          "Continue from repo-native signals only, then turn the friction of the handoff into stronger maps, stronger checks, and stronger continuation guidance.",
        roomSummary:
          "The second build phase is not simply more implementation. It is the test of whether the repo and the agent workflow can carry a genuinely new team.",
        facilitatorPrompts: [
          "Do not let teams replace a weak repo signal with verbal handoff.",
          "Name what needs to be written, clarified, or verified after rotation.",
          "Every repeated pain is a candidate for a better template, check, or runbook.",
        ],
        watchFors: [
          "The team only cleans up chaos, but does not turn it into better guidance.",
          "A weak repo signal keeps getting rescued in conversation.",
          "There is no explicit new verification after the handoff.",
        ],
        checkpointQuestions: [
          "Which repo signal helped you continue the most?",
          "What do you need to write or clarify after rotation?",
          "Which next check do you need now so you can continue safely?",
        ],
        sourceRefs: [
          { label: "Facilitation guide: Facilitation point for rotation", path: "content/facilitation/master-guide.md" },
          { label: "Talk: Closing", path: "content/talks/context-is-king.md" },
        ],
        scenes: {
          "build-2-handoff-work": {
            label: "After rotation: keep building",
            title: "Continue only from what survived",
            body:
              "Build Phase 2 should turn handoff friction into a better repo map, stronger checks, and a clearer next safe move. Do not continue as if nothing happened.",
            facilitatorNotes: [
              "Help the team see frustration as a diagnostic signal, not a failure.",
              "Ask what genuinely helped after rotation, what had to be written down, and which next check now keeps the work grounded.",
            ],
            sourceRefs: [{ label: "Facilitation guide: Facilitation point for rotation", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "build-2-friction": {
                title: "Friction is diagnostics",
                body:
                  "When the new team struggles, look for hidden context or missing verification. Do not fix the problem by talking around the repo.",
              },
              "build-2-steps": {
                title: "What to do after rotation",
                items: [
                  { title: "Name what truly helped continuation", body: "Capture the signal in the repo, not just the feeling." },
                  { title: "Write what is missing or unclear", body: "Tighten the map, a decision, or the handoff artifact." },
                  { title: "Add the next explicit check", body: "Before the next bigger move, put the work back on verification rails." },
                ],
              },
            },
          },
          "build-2-participant-view": {
            label: "Participant continuation board",
            title: "Continuation after rotation",
            body:
              "After rotation, the participant view should keep the incoming team close to three things: what survived in the repo, what is being checked now, and what still needs to be clarified before the next bigger move.",
            facilitatorNotes: [
              "This is the participant equivalent of the second build phase: no rescue through talking, only better orientation and the next check.",
            ],
            sourceRefs: [{ label: "Facilitation guide: Facilitation point for rotation", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "build-2-participant-hero": {
                eyebrow: "Build Phase 2",
                title: "Continue only from what is traceable",
                body:
                  "After rotation, the participant view should stop behaving like onboarding. It should hold shared orientation around what helped, what is missing, and what the next safe check is.",
              },
              "build-2-participant-bullets": {
                title: "Do this now",
                items: [
                  "Name what in the repo helped you continue.",
                  "Write down what is still unclear or missing after rotation.",
                  "Add the next explicit verification before a larger change.",
                ],
              },
              "build-2-participant-preview": {
                body:
                  "In the second build phase, the participant view should hold continuation signals, not nostalgia for the original team.",
              },
            },
          },
        },
      },
      "intermezzo-2": {
        label: "Intermezzo 2",
        goal:
          "Capture what truly helped after rotation and what is emerging as a weak point in the room’s current way of working.",
        roomSummary:
          "The second intermezzo should pull concrete continuation signals into the open and prepare the room for reveal and reflection without drifting into vague retrospectives.",
        facilitatorPrompts: [
          "What helped you continue after rotation?",
          "What was missing or slowing you down?",
          "Which repo signal saved you the most time?",
        ],
        watchFors: [
          "The intermezzo stays general and without concrete examples.",
          "You collect opinions, not signals from the repo.",
          "No link appears to the closing reflection.",
        ],
        checkpointQuestions: [
          "What helped you continue after rotation?",
          "What was missing?",
          "Which repo signal saved you the most time?",
        ],
        sourceRefs: [
          { label: "Facilitation guide: Intermezzos", path: "content/facilitation/master-guide.md" },
          { label: "Facilitation guide: Reveal and reflection", path: "content/facilitation/master-guide.md" },
        ],
        scenes: {
          "intermezzo-2-reflection": {
            label: "Continuation signals",
            title: "What really helped after rotation",
            body:
              "Use this moment to pull out hard continuation signals: what sped the new team up, what slowed it down, and what now deserves to become a better template or rule.",
            facilitatorNotes: [
              "Ask for concrete repo examples, not general impressions.",
              "Prepare the room for reveal by separating genuinely useful signals from good vibes.",
            ],
            sourceRefs: [{ label: "Facilitation guide: Reveal and reflection", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "intermezzo-2-steps": {
                title: "What we are collecting now",
                items: [
                  { title: "The signal that truly helped", body: "What saved time or reduced risk for the incoming team." },
                  { title: "The signal that was missing", body: "What stayed hidden in heads, chat, or an unverified state." },
                  { title: "The candidate for codification", body: "What should become a better template, check, or rule after today." },
                ],
              },
              "intermezzo-2-evidence": {
                title: "Examples, not impressions",
                body:
                  "Every answer should point to something traceable in the repo or to a clearly missing signal that should have been there.",
              },
            },
          },
          "intermezzo-2-participant-view": {
            label: "Participant continuation signals board",
            title: "What really helps after rotation",
            body:
              "In the second intermezzo, the participant view should bring the room back to the repo signals that genuinely helped people continue, and to the ones that still proved weak under pressure.",
            facilitatorNotes: ["This scene helps pull the afternoon back to concrete continuation signals before reveal."],
            sourceRefs: [{ label: "Facilitation guide: Reveal and reflection", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "intermezzo-2-participant-hero": {
                eyebrow: "Intermezzo 2",
                title: "We are collecting continuation signals",
                body:
                  "We are not only asking what felt good. We are asking which repo signals actually helped the new team continue.",
              },
              "intermezzo-2-participant-questions": {
                title: "Notice",
                items: [
                  "What helped people continue after rotation.",
                  "What was missing or slowing them down.",
                  "Which signal saved the most time.",
                ],
              },
              "intermezzo-2-participant-preview": {
                body:
                  "Here the participant view holds shared reflection on the continuation shift, not a leaderboard.",
              },
            },
          },
        },
      },
      reveal: {
        label: "Reveal and reflection",
        goal:
          "Close the day by naming the signals that helped work survive handoff and by turning them into next practice, not just a pleasant ending.",
        roomSummary:
          "Reveal and reflection are not a team ranking. They are the moment where the room decides which signals helped work survive handoff and which ones repeatedly failed.",
        facilitatorPrompts: [
          "We are not judging which team was better.",
          "We are looking at the system: which signals help work survive handoff and which ones slow it down.",
          "Collect concrete examples, not general impressions.",
        ],
        watchFors: [
          "The reflection turns into ranking teams.",
          "The questions stay too general and detached from the repo.",
          "No next step emerges for next week or for improving the blueprint.",
        ],
        checkpointQuestions: [
          "What helped you continue?",
          "What was missing?",
          "What will you do differently next week?",
        ],
        sourceRefs: [{ label: "Facilitation guide: Reveal and reflection", path: "content/facilitation/master-guide.md" }],
        scenes: {
          "reveal-1-2-4-all": {
            label: "1-2-4-All",
            title: "What helped people continue",
            body:
              "Use the final 1-2-4-All to surface the concrete signals that helped work survive handoff, and to separate them from general feelings about the day.",
            facilitatorNotes: [
              "Keep the questions concrete. Every example should point to a signal in the repo or to a missing signal.",
              "During the group share, keep steering away from team scoring and back toward system signals.",
            ],
            sourceRefs: [{ label: "Facilitation guide: 1-2-4-All", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "reveal-steps": {
                title: "1-2-4-All rhythm",
                items: [
                  {
                    title: "1 minute solo",
                    body: "Write what helped continuation, what was missing, and which signal saved the most time.",
                  },
                  {
                    title: "2 minutes in pairs",
                    body: "Compare examples and choose one that is really worth sharing.",
                  },
                  {
                    title: "4 minutes in fours",
                    body: "Look for repeated signals, not for better or worse teams.",
                  },
                  {
                    title: "All",
                    body: "Only concrete repo signals and concrete missing signals go back to the room.",
                  },
                ],
              },
              "reveal-system-frame": {
                title: "We are not judging winners",
                body:
                  "We are not asking who was better. We are asking which signals help work survive handoff and which ones still break under pressure.",
              },
            },
          },
          "reveal-w3": {
            label: "W3 closeout",
            title: "What? So what? Now what?",
            body: "W3 matters because it forces the day to end in concrete future practice rather than in abstract agreement.",
            facilitatorNotes: [
              "At the end, turn it toward next week as well as toward improving the blueprint and workshop system.",
            ],
            sourceRefs: [{ label: "Facilitation guide: W3", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "reveal-w3-steps": {
                title: "W3",
                items: [
                  { title: "What?", body: "What happened today, without judgment." },
                  { title: "So what?", body: "What that means for working with AI agents." },
                  { title: "Now what?", body: "What you will do differently next week." },
                ],
              },
              "reveal-system": {
                title: "We are watching the system",
                body:
                  "Every repeated pain point is a candidate for a better template, challenge card, or piece of blueprint guidance.",
              },
            },
          },
          "reveal-participant-view": {
            label: "Participant closeout board",
            title: "What we take from the day",
            body:
              "At the end of the day, the participant view should focus attention on what helped work survive handoff and what the team is genuinely taking into next week.",
            facilitatorNotes: [
              "Use this scene when you pull the day back to concrete signals and next steps.",
            ],
            sourceRefs: [{ label: "Facilitation guide: Reveal and reflection", path: "content/facilitation/master-guide.md" }],
            blocks: {
              "reveal-participant-hero": {
                eyebrow: "Reveal and reflection",
                title: "This is not about winners. It is about the signals that hold work together.",
                body:
                  "At the end of the day, we look at what helped the next team continue, what was missing, and what we will change in our own practice next week.",
              },
              "reveal-participant-questions": {
                title: "Take these with you",
                items: [
                  "What helped you continue?",
                  "What was missing?",
                  "What will you do differently next week?",
                ],
              },
              "reveal-participant-preview": {
                body: "The participant view should hold the closing moment in concrete signals, not in ranking teams.",
              },
            },
          },
        },
      },
    },
  },
} as const;
