/**
 * Test fixtures: materialize blueprint agenda views from the bilingual
 * authoring source at import time, so tests can assert against the same
 * CS/EN/participant content the dashboard renders at runtime without
 * depending on committed `dashboard/lib/generated/agenda-*.json` files.
 *
 * Runtime code must NOT import from this module — instances receive
 * blueprints via `externalBlueprint` / `blueprintRecordToAgenda`. This
 * file exists purely to replace the retired compiled bundle for tests.
 */

import source from "../../../workshop-content/agenda.json";
import type { BilingualAgenda } from "../types/bilingual-agenda";
import { generateAgendaView } from "../content-views/agenda-view";

const bilingualSource = source as unknown as BilingualAgenda;

export const csFacilitatorAgenda = generateAgendaView(bilingualSource, "cs", "facilitator");
export const enFacilitatorAgenda = generateAgendaView(bilingualSource, "en", "facilitator");
export const csParticipantAgenda = generateAgendaView(bilingualSource, "cs", "participant");
export const enParticipantAgenda = generateAgendaView(bilingualSource, "en", "participant");
