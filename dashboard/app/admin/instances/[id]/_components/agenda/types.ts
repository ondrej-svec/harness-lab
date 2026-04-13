import type { AgendaItem, PresenterScene } from "@/lib/workshop-data";

export type SourceRef = {
  path: string;
  label: string;
};

export type RichAgendaItem = AgendaItem &
  Partial<{
    goal: string;
    roomSummary: string;
    facilitatorPrompts: string[];
    watchFors: string[];
    checkpointQuestions: string[];
    sourceRefs: SourceRef[];
  }>;

export type PresenterBlockSummary = {
  id: string;
  type: string;
};

export type RichPresenterScene = PresenterScene &
  Partial<{
    intent: string;
    chromePreset: string;
    blocks: PresenterBlockSummary[];
    facilitatorNotes: string[];
    sourceRefs: SourceRef[];
  }>;
