import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * A guard must never wait on a query that something else destroys mid-flight.
 *
 * ## The shape, not the symptom
 *
 * The bug was "the login page shows a spinner forever". The SHAPE is:
 *
 *   a component gates its render on `isLoading`, and a global handler calls
 *   `queryClient.clear()` in response to the very request that query made.
 *
 * `clear()` removes the query while `fetchStatus` is still `fetching`, so the
 * response is never applied to it. It never reaches `error`, never reaches
 * `success`, and the observer reports `isLoading: true` permanently. Nothing
 * retries, nothing throws, and there is no error boundary to catch — the page
 * simply never renders.
 *
 * Observed, not deduced. Instrumenting the query cache in a real browser gave:
 *
 *   cache:added    status=pending  fetchStatus=idle
 *   cache:updated  status=pending  fetchStatus=fetching
 *   onUnauthorized FIRED
 *   cache:removed  status=pending  fetchStatus=fetching
 *
 * The plausible explanation beforehand — that the query returned to `pending`
 * and `refetchOnMount: false` stopped it refiring — was wrong.
 *
 * This is tested here rather than in `guest-guard.test.tsx` because the shape
 * belongs to the pairing of a global 401 handler with a gating query, not to
 * one component. The storefront's auth in Phase 5.6 has the same pairing.
 */

function Guard({ children }: { children: ReactNode }) {
  const { isLoading, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => Promise.reject(new Error("401")),
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Exactly `GuestGuard`'s logic: a 401 is the success case, so an error means
  // "no session" and the page should render.
  if (isLoading) return <p>Loading</p>;
  void isError;
  return <>{children}</>;
}

function renderWithClient(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <Guard>
        <p>Login form</p>
      </Guard>
    </QueryClientProvider>,
  );
}

describe("a gating query whose cache is cleared by its own 401 handler", () => {
  it("renders once the query settles, when nothing clears the cache", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderWithClient(client);

    // The baseline. Without this passing, the failing case below proves nothing.
    await waitFor(() => expect(screen.getByText("Login form")).toBeInTheDocument());
  });

  it("hangs forever when the handler clears the cache mid-flight", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    /*
     * The unguarded handler, reproduced: clear the cache as soon as the query
     * starts fetching — which is when a real 401 interceptor fires, before the
     * rejection reaches the query.
     */
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (event.query.state.fetchStatus === "fetching") client.clear();
    });

    renderWithClient(client);

    await new Promise((resolve) => setTimeout(resolve, 300));

    // The defect, stated positively so the test says what is wrong rather than
    // merely failing: the guard is still waiting and the page never rendered.
    expect(screen.queryByText("Login form")).toBeNull();
    expect(screen.getByText("Loading")).toBeInTheDocument();

    unsubscribe();
  });

  /*
   * Does the fix close the ROUTE or the SHAPE?
   *
   * Parameterised over routes on which a 401 is the expected answer and no
   * redirect follows. A route-specific fix passes the route it names and fails
   * every other one — which is exactly what the first attempt did, and why this
   * case exists rather than a single `/login` assertion.
   */
  const EXPECTED_401_ROUTES = ["/login", "/signup", "/account", "/order/ABC-123"];

  it.each(EXPECTED_401_ROUTES)(
    "a route-specific guard fails on %s (documents what is NOT enough)",
    async (pathname) => {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const routeSpecific = () => {
        if (pathname === "/login") return;
        client.clear();
      };

      const unsubscribe = client.getQueryCache().subscribe((event) => {
        if (event.query.state.fetchStatus === "fetching") routeSpecific();
      });

      renderWithClient(client);
      await new Promise((r) => setTimeout(r, 250));

      // Only the named route survives. Asserted rather than described, so the
      // difference between the two fixes is a fact in this file.
      const rendered = screen.queryByText("Login form") !== null;
      expect(rendered).toBe(pathname === "/login");

      unsubscribe();
    },
  );

  it.each(EXPECTED_401_ROUTES)(
    "deferring the clear is NOT enough, on %s (documents the second dead end)",
    async (pathname) => {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

      /*
       * The obvious second attempt: let the rejection land, then clear.
       *
       * It does not work, and the reason is worth keeping. Clearing removes the
       * settled query; its observer immediately refetches; that request 401s;
       * the handler fires again and clears again. The hang becomes a loop,
       * which is not an improvement.
       */
      const unsubscribe = client.getQueryCache().subscribe((event) => {
        if (event.query.state.fetchStatus === "fetching") setTimeout(() => client.clear(), 0);
      });

      renderWithClient(client);
      await new Promise((r) => setTimeout(r, 250));

      expect(screen.queryByText("Login form")).toBeNull();
      void pathname;
      unsubscribe();
    },
  );

  it.each(EXPECTED_401_ROUTES)("clearing everything EXCEPT in-flight queries works on %s", async (pathname) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    /*
     * The class fix. It names no routes, and it is the only one of the three
     * that holds on every route.
     *
     * The handler runs while the response that triggered it is still in
     * flight. Removing that query destroys the answer before any observer
     * sees it — so skip anything still fetching and drop the rest. The
     * in-flight query settles normally (to `error`, which is the correct
     * answer to "is anyone signed in"), and every stale authenticated query
     * is still dropped, which is what clearing was for.
     */
    const clearSettledOnly = () => {
      client.removeQueries({
        predicate: (query) => query.state.fetchStatus !== "fetching",
      });
    };

    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (event.query.state.fetchStatus === "fetching") clearSettledOnly();
    });

    renderWithClient(client);
    await waitFor(() => expect(screen.getByText("Login form")).toBeInTheDocument());
    void pathname;
    unsubscribe();
  });

  it("renders when the handler leaves the query alone, which is the fix", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    /*
     * The fix in `app-provider.tsx`: on the login page a 401 is the expected
     * answer — there is no session to clear and nowhere to redirect — so the
     * handler returns before touching the cache.
     */
    const onUnauthorized = (pathname: string) => {
      if (pathname === "/login") return;
      client.clear();
    };

    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (event.query.state.fetchStatus === "fetching") onUnauthorized("/login");
    });

    renderWithClient(client);

    await waitFor(() => expect(screen.getByText("Login form")).toBeInTheDocument());

    unsubscribe();
  });

  it("still drops stale authenticated data, so the fix is not 'never clear'", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    // A settled query holding data from the expired session.
    client.setQueryData(["staff", "list"], [{ id: 1 }]);
    expect(client.getQueryData(["staff", "list"])).toBeDefined();

    // The shipped handler.
    client.removeQueries({ predicate: (query) => query.state.fetchStatus !== "fetching" });

    /*
     * The half that matters as much as the hang: a 401 means the session is
     * gone, and cached authenticated data must not survive it. A fix that
     * stopped clearing would trade a visible hang for an invisible leak.
     */
    expect(client.getQueryData(["staff", "list"])).toBeUndefined();
  });

  it("keeps a query that is still in flight, which is the whole mechanism", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let resolve!: (value: unknown) => void;

    void client.fetchQuery({
      queryKey: ["auth", "me"],
      queryFn: () =>
        new Promise((r) => {
          resolve = r;
        }),
    });

    await waitFor(() =>
      expect(client.getQueryCache().find({ queryKey: ["auth", "me"] })?.state.fetchStatus).toBe("fetching"),
    );

    client.removeQueries({ predicate: (query) => query.state.fetchStatus !== "fetching" });

    // Survives, so its own response can still settle it.
    expect(client.getQueryCache().find({ queryKey: ["auth", "me"] })).toBeDefined();
    resolve(null);
  });
});
