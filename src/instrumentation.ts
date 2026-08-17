/**
 * Next.js hands every server-side failure to `onRequestError`.
 *
 * That is the whole point of having it: catching errors one `try` at a time
 * means the ones nobody thought about — the ones actually worth knowing — are
 * exactly the ones that go unrecorded.
 */

type ErrorContext = {
  routerKind?: string;
  routePath?: string;
  routeType?: string;
};

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: ErrorContext,
) {
  // Imported here rather than at module scope: instrumentation is loaded in
  // every runtime, and the reporter pulls in Prisma, which the edge one has no
  // business starting.
  const { reportError } = await import("@/lib/errors");
  const where = [
    context.routeType ?? context.routerKind ?? "request",
    request.method,
    context.routePath ?? request.path,
  ]
    .filter(Boolean)
    .join(" ");
  await reportError(where, error);
}
