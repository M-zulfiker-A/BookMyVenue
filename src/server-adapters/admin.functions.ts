// Presentation/server adapter — Admin (DI-resolved use-cases).
// Authorization checks are enforced inside each use case via
// `assertAdminUseCase`. These adapters only validate input and dispatch.

import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import {
  AdminReviewIdSchema,
  ListBookingsSchema,
  ListUsersSchema,
  ListVenuesSchema,
  SetCouponActiveSchema,
  SetUserRoleSchema,
  SetUserSuspendedSchema,
  SetVenueSuspendedSchema,
  UpdateBookingStatusSchema,
  UserIdSchema,
} from "@repo/application/admin";
import { buildContainer } from "@/infrastructure/di/composition-root";
import * as T from "@/infrastructure/di/tokens";

function ctnr(db?: unknown, userId?: string) {
  return db ? buildContainer({ db: db as never, userId }) : buildContainer();
}

export const requireAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const c = ctnr(context.db, context.userId);
    const roles = c.resolve(T.UserRolesRepoToken);
    if (!(await roles.isAdmin(context.userId))) {
      throw new Error("Forbidden: admin role required");
    }
    return { ok: true as const };
  });

export const getPlatformStats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(({ context }) =>
    ctnr(context.db, context.userId).resolve(T.PlatformStats)(context.userId),
  );

// ---- Users ----
export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => ListUsersSchema.parse(input ?? {}))
  .handler(({ data, context }) =>
    ctnr(context.db, context.userId).resolve(T.ListAllUsers)(context.userId, data),
  );

export const getUserDetail = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => UserIdSchema.parse(input))
  .handler(({ data, context }) =>
    ctnr(context.db, context.userId).resolve(T.GetUserDetail)(context.userId, data.userId),
  );

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => SetUserRoleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ctnr(context.db, context.userId).resolve(T.SetUserRole)(context.userId, data);
    return { ok: true as const };
  });

export const setUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => SetUserSuspendedSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ctnr(context.db, context.userId).resolve(T.SetUserSuspended)(context.userId, data);
    return { ok: true as const };
  });

// ---- Venues ----
export const listAllVenues = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => ListVenuesSchema.parse(input ?? {}))
  .handler(({ data, context }) =>
    ctnr(context.db, context.userId).resolve(T.ListAllVenues)(context.userId, data),
  );

export const setVenueSuspended = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => SetVenueSuspendedSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ctnr(context.db, context.userId).resolve(T.SetVenueSuspended)(context.userId, data);
    return { ok: true as const };
  });

// ---- Bookings ----
export const listAllBookings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => ListBookingsSchema.parse(input ?? {}))
  .handler(({ data, context }) =>
    ctnr(context.db, context.userId).resolve(T.ListAllBookings)(context.userId, data),
  );

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => UpdateBookingStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ctnr(context.db, context.userId).resolve(T.UpdateBookingStatus)(context.userId, data);
    return { ok: true as const };
  });

export const expireStuckBookings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(({ context }) =>
    ctnr(context.db, context.userId).resolve(T.ExpireStuckBookings)(context.userId),
  );

// ---- Coupons ----
export const listAllCoupons = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(({ context }) =>
    ctnr(context.db, context.userId).resolve(T.ListAllCoupons)(context.userId),
  );

export const setCouponActive = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => SetCouponActiveSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ctnr(context.db, context.userId).resolve(T.SetCouponActive)(context.userId, data);
    return { ok: true as const };
  });

// ---- Reviews ----
export const listAllReviews = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(({ context }) =>
    ctnr(context.db, context.userId).resolve(T.ListAllReviews)(context.userId),
  );

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => AdminReviewIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ctnr(context.db, context.userId).resolve(T.DeleteReviewAsAdmin)(context.userId, data.id);
    return { ok: true as const };
  });
