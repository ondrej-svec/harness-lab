// @vitest-environment happy-dom

/**
 * State-machine tests for ParticipantIdentifyFlow.
 *
 * Covers the five views (typing / set_password / enter_password /
 * walk_in_refused / already_bound) and the transitions between them
 * triggered by suggest responses, picks, walk-in policy, and
 * already_bound returns from the API.
 *
 * fetch is mocked at module level — no real network. router.refresh
 * is also mocked so we can assert the success path completes.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ParticipantIdentifyFlow } from "./participant-identify-flow";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

type SuggestMatch = {
  id: string;
  displayName: string;
  hasPassword: boolean;
  hasEmail?: boolean;
  emailDisplay?: string | null;
  disambiguator: { kind: "tag" | "masked_email" | "order"; value: string } | null;
};

type FetchResponse = {
  ok: boolean;
  status: number;
  body: unknown;
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  refresh.mockReset();
  vi.stubGlobal("fetch", fetchMock as typeof fetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function makeResponse(payload: FetchResponse): Response {
  return new Response(JSON.stringify(payload.body), {
    status: payload.status,
    headers: { "content-type": "application/json" },
  });
}

function setSuggestMatches(matches: SuggestMatch[]) {
  fetchMock.mockImplementation(async (url: string | URL | Request) => {
    const href = typeof url === "string" ? url : (url as Request).url;
    if (href.includes("/api/event-access/identify/suggest")) {
      return makeResponse({ ok: true, status: 200, body: { ok: true, matches } });
    }
    return makeResponse({ ok: false, status: 500, body: { ok: false, error: "unmocked" } });
  });
}

async function type(query: string) {
  const input = (await screen.findByRole("combobox")) as HTMLInputElement;
  fireEvent.change(input, { target: { value: query } });
}

async function waitForSuggest() {
  // Component debounces 250 ms before fetching. Use waitFor with a
  // generous timeout — the real setTimeout fires once.
  await waitFor(() => expect(fetchMock).toHaveBeenCalled(), { timeout: 1000 });
}

describe("ParticipantIdentifyFlow", () => {
  it("renders the typing view by default and surfaces no matches for prefix < 2 chars", async () => {
    setSuggestMatches([]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    expect(screen.getByLabelText("your name")).toBeDefined();
    const input = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "j" } });
    // Give the debounce more than enough wall-clock time to (not) fire
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("debounces the suggest fetch and renders matches when they arrive", async () => {
    setSuggestMatches([
      { id: "p1", displayName: "Jan Novák", hasPassword: false, disambiguator: null },
    ]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("jan");
    await waitForSuggest();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Jan Novák")).toBeDefined();
  });

  it("transitions typing → set_password when picking a match without a password", async () => {
    setSuggestMatches([
      { id: "p1", displayName: "Jan Novák", hasPassword: false, disambiguator: null },
    ]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("jan");
    await waitForSuggest();
    fireEvent.click(await screen.findByText("Jan Novák"));

    expect(await screen.findByText("welcome, Jan Novák")).toBeDefined();
    expect(screen.getByPlaceholderText("your email")).toBeDefined();
  });

  it("skips the email input when the picked roster match already has an email", async () => {
    setSuggestMatches([
      {
        id: "p1",
        displayName: "Jan Novák",
        hasPassword: false,
        hasEmail: true,
        emailDisplay: "j***@acme.com",
        disambiguator: null,
      },
    ]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("jan");
    await waitForSuggest();
    fireEvent.click(await screen.findByText("Jan Novák"));

    expect(await screen.findByText("welcome, Jan Novák")).toBeDefined();
    expect(screen.queryByPlaceholderText("your email")).toBeNull();
    expect(screen.getByText("j***@acme.com")).toBeDefined();
    expect(screen.getByPlaceholderText("password")).toBeDefined();
  });

  it("transitions typing → enter_password when picking a returning match (hasPassword=true)", async () => {
    setSuggestMatches([
      { id: "p1", displayName: "Jan Novák", hasPassword: true, disambiguator: null },
    ]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("jan");
    await waitForSuggest();
    fireEvent.click(await screen.findByText("Jan Novák"));

    expect(await screen.findByText("welcome back, Jan Novák")).toBeDefined();
    // No email field on the enter-password view
    expect(screen.queryByPlaceholderText("your email")).toBeNull();
  });

  it("renders the walk-in create sentinel when allowWalkIns and prefix has matches", async () => {
    setSuggestMatches([
      { id: "p1", displayName: "Jana", hasPassword: false, disambiguator: null },
    ]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("jan");
    await waitForSuggest();
    expect(await screen.findByText(/＋ add "jan" as a new participant/i)).toBeDefined();
  });

  it("immediately renders walk_in_refused when allowWalkIns is false and the typed name has no roster match", async () => {
    setSuggestMatches([]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns={false} />);

    await type("Stranger Danger");
    await waitForSuggest();

    const form = screen.getByRole("combobox").closest("form")!;
    fireEvent.submit(form);

    expect(await screen.findByText("not on the roster")).toBeDefined();
    expect(screen.getByText("ask your facilitator to add you.")).toBeDefined();
  });

  it("renders already_bound when initialHint = 'already_bound'", () => {
    setSuggestMatches([]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns initialHint="already_bound" />);
    expect(screen.getByText("this session is already identified as someone else")).toBeDefined();
  });

  it("set_password POST → ok = true triggers router.refresh", async () => {
    setSuggestMatches([
      { id: "p1", displayName: "Jan Novák", hasPassword: false, disambiguator: null },
    ]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("jan");
    await waitForSuggest();
    fireEvent.click(await screen.findByText("Jan Novák"));

    fetchMock.mockResolvedValueOnce(makeResponse({ ok: true, status: 200, body: { ok: true } }));

    fireEvent.change(screen.getByPlaceholderText("your email"), {
      target: { value: "jan@acme.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("password"), {
      target: { value: "longenough" },
    });
    fireEvent.submit(screen.getByPlaceholderText("password").closest("form")!);

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("set_password POST omits email when the picked roster match already has one", async () => {
    setSuggestMatches([
      {
        id: "p1",
        displayName: "Jan Novák",
        hasPassword: false,
        hasEmail: true,
        emailDisplay: "j***@acme.com",
        disambiguator: null,
      },
    ]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("jan");
    await waitForSuggest();
    fireEvent.click(await screen.findByText("Jan Novák"));

    fetchMock.mockResolvedValueOnce(makeResponse({ ok: true, status: 200, body: { ok: true } }));

    fireEvent.change(screen.getByPlaceholderText("password"), {
      target: { value: "longenough" },
    });
    fireEvent.submit(screen.getByPlaceholderText("password").closest("form")!);

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toEqual({ participantId: "p1", password: "longenough" });
  });

  it("set_password POST → email_taken surfaces the inline error (no view change)", async () => {
    setSuggestMatches([
      { id: "p1", displayName: "Jan", hasPassword: false, disambiguator: null },
    ]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("jan");
    await waitForSuggest();
    fireEvent.click(await screen.findByText("Jan"));

    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: false, status: 400, body: { ok: false, error: "email_taken" } }),
    );

    fireEvent.change(screen.getByPlaceholderText("your email"), {
      target: { value: "jan@acme.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("password"), {
      target: { value: "longenough" },
    });
    fireEvent.submit(screen.getByPlaceholderText("password").closest("form")!);

    expect(await screen.findByText(/that email already has an account/i)).toBeDefined();
    // Still on set_password view
    expect(screen.getByText("welcome, Jan")).toBeDefined();
  });

  it("set_password POST → walk_in_refused transitions the view", async () => {
    setSuggestMatches([]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("Stranger");
    await waitForSuggest();

    fireEvent.submit(screen.getByRole("combobox").closest("form")!);
    // Now on set_password view (walk-in path)
    expect(await screen.findByText("welcome, Stranger")).toBeDefined();

    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: false, status: 403, body: { ok: false, error: "walk_in_refused" } }),
    );

    fireEvent.change(screen.getByPlaceholderText("your email"), {
      target: { value: "stranger@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("password"), {
      target: { value: "longenough" },
    });
    fireEvent.submit(screen.getByPlaceholderText("password").closest("form")!);

    expect(await screen.findByText("not on the roster")).toBeDefined();
  });

  it("enter_password POST → already_bound transitions the view", async () => {
    setSuggestMatches([
      { id: "p1", displayName: "Jan", hasPassword: true, disambiguator: null },
    ]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("jan");
    await waitForSuggest();
    fireEvent.click(await screen.findByText("Jan"));

    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: false, status: 409, body: { ok: false, error: "already_bound" } }),
    );

    fireEvent.change(screen.getByPlaceholderText("password"), {
      target: { value: "longenough" },
    });
    fireEvent.submit(screen.getByPlaceholderText("password").closest("form")!);

    expect(await screen.findByText("this session is already identified as someone else")).toBeDefined();
  });

  it("enter_password POST → generic failure surfaces wrong_credentials copy without leaking the response", async () => {
    setSuggestMatches([
      { id: "p1", displayName: "Jan", hasPassword: true, disambiguator: null },
    ]);
    render(<ParticipantIdentifyFlow lang="en" allowWalkIns />);

    await type("jan");
    await waitForSuggest();
    fireEvent.click(await screen.findByText("Jan"));

    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: false, status: 401, body: { ok: false, error: "wrong_credentials" } }),
    );

    fireEvent.change(screen.getByPlaceholderText("password"), {
      target: { value: "longenough" },
    });
    fireEvent.submit(screen.getByPlaceholderText("password").closest("form")!);

    expect(await screen.findByText(/that didn't match/i)).toBeDefined();
  });
});
