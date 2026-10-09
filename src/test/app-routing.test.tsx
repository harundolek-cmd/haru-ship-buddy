import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// JSDOM does not load stylesheet links emitted by the document head. React 19
// waits for those resources before painting; exercise routing without head assets.
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...actual, HeadContent: () => null, Scripts: () => null };
});

import { routeTree } from "@/routeTree.gen";

function renderAt(path: string) {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router} />, { container: document });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// TanStack Start renders an HTML document shell; mount into document, not a div.
describe("App routing", () => {
  it("renders the index route", async () => {
    renderAt("/");

    await waitFor(() => expect(document.body.textContent).toContain("Dispatch smarter."));
  });

  it("renders the not-found route", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    renderAt("/this-route-does-not-exist");

    await waitFor(() => expect(document.body.textContent).toContain("Page not found"));
  });
});
