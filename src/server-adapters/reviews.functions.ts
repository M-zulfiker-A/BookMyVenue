// Presentation/server adapter — Reviews (DI-resolved use-cases)

import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { ReviewIdSchema, UpsertReviewSchema, VenueIdSchema } from "@repo/application/reviews";
import { buildContainer } from "@/infrastructure/di/composition-root";
import * as T from "@/infrastructure/di/tokens";

export const listVenueReviews = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => VenueIdSchema.parse(input))
  .handler(({ data }) => buildContainer().resolve(T.ListVenueReviews)(data.venueId));

export const canIReviewVenue = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => VenueIdSchema.parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.CanIReviewVenue)(
      context.userId,
      data.venueId,
    ),
  );

export const upsertMyReview = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => UpsertReviewSchema.parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.UpsertMyReview)(
      data,
      context.userId,
    ),
  );

export const deleteMyReview = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => ReviewIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await buildContainer({ db: context.db, userId: context.userId }).resolve(T.DeleteMyReview)(
      data.reviewId,
      context.userId,
    );
    return { ok: true as const };
  });
