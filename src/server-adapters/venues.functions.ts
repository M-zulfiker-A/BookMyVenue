// Presentation/server adapter — Venues
// Thin createServerFn wrappers. All wiring lives in the DI composition root;
// these adapters only parse input and resolve the relevant use-case.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { VenueInputSchema, VenueListFilterSchema } from "@repo/application/venues";
import { buildContainer } from "@/infrastructure/di/composition-root";
import * as T from "@/infrastructure/di/tokens";

// Public reads (no auth)
export const listVenues = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => VenueListFilterSchema.parse(input ?? {}))
  .handler(({ data }) => buildContainer().resolve(T.ListVenues)(data));

export const getVenue = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(({ data }) => buildContainer().resolve(T.GetVenue)(data.id));

// Host operations (authenticated)
export const becomeHost = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await buildContainer({ db: context.db, userId: context.userId }).resolve(T.BecomeHost)();
    return { ok: true };
  });

export const createVenue = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => VenueInputSchema.parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.CreateVenue)(data, context.userId),
  );

export const updateVenue = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).merge(VenueInputSchema.partial()).parse(input),
  )
  .handler(({ data, context }) => {
    const { id, ...patch } = data;
    return buildContainer({ db: context.db, userId: context.userId }).resolve(T.UpdateVenue)(id, patch);
  });

export const listHostVenues = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(({ context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.ListHostVenues)(context.userId),
  );

export const deleteVenue = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await buildContainer({ db: context.db, userId: context.userId }).resolve(T.DeleteVenue)(data.id);
    return { ok: true as const };
  });
