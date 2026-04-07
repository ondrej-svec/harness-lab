# Facilitator Dashboard Design Rules

## Why This Exists

The facilitator surface is an operations tool for a live workshop day. It should feel calm, precise, and obvious under time pressure. The earlier version had the right data but weak control hierarchy: status, navigation, and high-impact actions all looked too similar.

This note records the rules the redesign now follows so the system can stay coherent as the participant surface and later facilitator flows evolve.

## Product Rules

1. Workspace scope and instance scope should not compete on the same primary screen.
2. The active instance is part of the control model, not just metadata.
3. The current phase is a live runtime marker, not a hidden side effect of "move agenda".
4. Blueprint edits and runtime edits must stay visibly separate.
5. Archive and reset are safety actions. They should be visible, but they should not dominate the primary workflow.

## Interaction Rules

1. Navigation is lightweight.
Workspace navigation should feel like overview and movement between events. Control-room navigation should feel like location inside one event, not like mode switching.

2. Status stays persistent.
In the control room, instance, live phase, rotation state, and team count stay visible in a compact summary strip at the top.

3. Actions are grouped by intent.
Phase control, continuation handoff, and safety actions each get their own block instead of being mixed into one generic control wall.

4. High-impact controls need explicit labels.
If a control changes live workshop state, the label must say what actually changes. "move live marker" is clearer than "move agenda".

5. Scope must be explicit before action.
The workspace lists instances as event records. Once inside the control room, actions are already scoped and should not compete with workspace management.

## Visual Rules

1. Calm first.
Use warm neutral surfaces, restrained contrast, and generous spacing before adding stronger accents.

2. Fewer boxes, better boxes.
Panels use soft grouping and internal rhythm. We avoid stacking too many identical bordered rectangles inside other bordered rectangles.

2a. Use the desktop canvas.
If the viewport is wide, the layout should express product structure with rails, grouped content, and readable density rather than leaving most of the screen idle.

3. Typography carries hierarchy.
Lowercase and calm tone remain part of the voice, but hierarchy comes from size, spacing, and density, not from shouting with contrast.

4. Filled black is reserved for decisive actions, not selected navigation.
The old black active tab made section selection feel heavier than it is.

5. Rounded shapes signal tooling, not marketing.
Corners are softened enough to make the panel feel intentional and modern, but not so much that the UI turns ornamental.

## Copy Rules

1. Say what the facilitator can do now.
2. Prefer operational nouns: `instance`, `live phase`, `handoff`, `archive`, `reset`.
3. Avoid internal implementation terms unless they explain a trust boundary.
4. Keep the Czech tone factual, calm, and peer-like.

## What Changed From The Earlier Version

1. `/admin` is now the workspace cockpit for workshop instances.
2. Entering an instance opens a focused control room for that event.
3. Instances are represented as event records rather than id-first technical rows.
4. Search and filtering exist at the workspace level.
5. The control room now answers four questions immediately:
Which event am I controlling?
What phase is live?
Is continuation open?
How many teams are in play?

## Review Checklist

Before shipping future facilitator UI changes, verify:

1. Can a facilitator tell whether they are in the workspace or inside one event in under 3 seconds?
2. Can they tell what the primary next action is without reading every card or panel?
3. Are high-impact actions visually separated from routine actions?
4. Does selected navigation feel like location, not mode switching?
5. Does the control room stay calm on mobile when the section switcher replaces the desktop rail?
