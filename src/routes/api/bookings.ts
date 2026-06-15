// Secure API route to fetch user bookings.
// Accessible by the mobile client and other authorized consumers.

import { createFileRoute } from "@tanstack/react-router";
import { createAuth } from "@/lib/auth";
import { getCloudflareEnv } from "@/lib/cloudflare-env";
import { buildContainer } from "@/infrastructure/di/composition-root";
import * as T from "@/infrastructure/di/tokens";

export const Route = createFileRoute("/api/bookings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = createAuth();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const cfEnv = getCloudflareEnv();
          const container = buildContainer({ db: cfEnv.DB, userId: session.user.id });
          const bookings = await container.resolve(T.ListMyBookings)(session.user.id);
          return Response.json(bookings);
        } catch (err) {
          return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
