import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { adminCopy } from "@/lib/ui-language";

// AdminRouteLink is a client component that calls useRouter(). In the
// Vitest/Node environment there is no Next.js router context, so we mock
// next/navigation — same pattern as dashboard/app/admin/instances/[id]/page.test.tsx.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { OutlineRail, type OutlineAgendaItem } from "./outline-rail";

const agendaItems: OutlineAgendaItem[] = [
  { id: "opening", label: "Opening", time: "09:00", status: "done" },
  { id: "talk", label: "Talk", time: "10:00", status: "current" },
  { id: "build", label: "Build", time: "11:00", status: "upcoming" },
];

describe("OutlineRail", () => {
  it("renders the 4 section links with the expected Czech copy", () => {
    const html = renderToStaticMarkup(
      <OutlineRail
        lang="cs"
        instanceId="sample-studio-a"
        activeSection="run"
        activeAgendaItemId="talk"
        workshopLabel="sample-lab-a"
        agendaItems={agendaItems}
        copy={adminCopy.cs}
      />
    );
    // All 4 control-room section labels should be present.
    expect(html).toContain(adminCopy.cs.navAgenda);
    expect(html).toContain(adminCopy.cs.navPeople);
    expect(html).toContain(adminCopy.cs.navAccess);
    expect(html).toContain(adminCopy.cs.navSettings);
  });

  it("nests agenda items under Run when Run is active", () => {
    const html = renderToStaticMarkup(
      <OutlineRail
        lang="cs"
        instanceId="sample-studio-a"
        activeSection="run"
        activeAgendaItemId="talk"
        workshopLabel="sample-lab-a"
        agendaItems={agendaItems}
        copy={adminCopy.cs}
      />
    );
    expect(html).toContain("Opening");
    expect(html).toContain("Talk");
    expect(html).toContain("Build");
    // The data-agenda-item attribute must be preserved for E2E selectors
    expect(html).toContain('data-agenda-item="opening"');
    expect(html).toContain('data-agenda-item="talk"');
    expect(html).toContain('data-agenda-item="build"');
  });

  it("does not nest agenda items when a different section is active", () => {
    const html = renderToStaticMarkup(
      <OutlineRail
        lang="cs"
        instanceId="sample-studio-a"
        activeSection="people"
        activeAgendaItemId={null}
        workshopLabel="sample-lab-a"
        agendaItems={agendaItems}
        copy={adminCopy.cs}
      />
    );
    expect(html).not.toContain('data-agenda-item="opening"');
    expect(html).not.toContain('data-agenda-item="talk"');
  });

  it("exposes viewTransitionName: outline-rail for morph anchoring", () => {
    const html = renderToStaticMarkup(
      <OutlineRail
        lang="cs"
        instanceId="sample-studio-a"
        activeSection="run"
        activeAgendaItemId={null}
        workshopLabel="sample-lab-a"
        agendaItems={agendaItems}
        copy={adminCopy.cs}
      />
    );
    expect(html).toMatch(/view-transition-name:\s*outline-rail/);
  });

  it("renders a workshop label in the header", () => {
    const html = renderToStaticMarkup(
      <OutlineRail
        lang="cs"
        instanceId="sample-studio-a"
        activeSection="run"
        activeAgendaItemId={null}
        workshopLabel="distinctive-workshop-id"
        agendaItems={agendaItems}
        copy={adminCopy.cs}
      />
    );
    expect(html).toContain("distinctive-workshop-id");
  });
});
