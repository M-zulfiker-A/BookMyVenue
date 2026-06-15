// Infrastructure — Composition Root.
// Wires concrete providers + repositories into the container and exposes
// every use-case as a resolvable dependency.
//
// THIS FILE IS THE ONLY PLACE THAT KNOWS WHICH PROVIDER IS IN USE.
// Swap auth/storage/db/cache here to migrate to a different vendor.

import { Container } from "@repo/infrastructure";
import { getCloudflareEnv } from "@/lib/cloudflare-env";
import * as T from "./tokens";
import {
  makeDrizzleAdminRepo,
  makeDrizzleBookingsRepo,
  makeDrizzleCouponsRepo,
  makeDrizzleInvoicesRepo,
  makeDrizzlePaymentsRepo,
  makeDrizzleProfilesRepo,
  makeDrizzleReviewsRepo,
  makeDrizzleUserRolesRepo,
  makeDrizzleVenuesRepo,
  makePdfLibInvoiceRenderer,
  makeResendEmailSender,
  makeBetterAuthProvider,
  CacheStoreManager,
  makeDrizzleD1Factory,
} from "@repo/infrastructure";
import {
  cancelBookingUseCase,
  confirmBookingUseCase,
  createBlockOffUseCase,
  createBookingHoldUseCase,
  createOfflineBookingUseCase,
  getBookingUseCase,
  listHostBookingsUseCase,
  listMyBookingsUseCase,
  quoteBookingUseCase,
} from "@repo/application/bookings";
import {
  becomeHostUseCase,
  createVenueUseCase,
  deleteVenueUseCase,
  getVenueUseCase,
  listHostVenuesUseCase,
  listVenuesUseCase,
  updateVenueUseCase,
} from "@repo/application/venues";
import {
  createCouponUseCase,
  deleteCouponUseCase,
  listHostCouponsUseCase,
} from "@repo/application/coupons";
import {
  canIReviewVenueUseCase,
  deleteMyReviewUseCase,
  listVenueReviewsUseCase,
  upsertMyReviewUseCase,
} from "@repo/application/reviews";
import {
  deleteReviewAsAdminUseCase,
  expireStuckBookingsUseCase,
  getUserDetailUseCase,
  listAllBookingsUseCase,
  listAllCouponsUseCase,
  listAllReviewsUseCase,
  listAllUsersUseCase,
  listAllVenuesUseCase,
  platformStatsUseCase,
  setCouponActiveUseCase,
  setUserRoleUseCase,
  setUserSuspendedUseCase,
  setVenueSuspendedAsAdminUseCase,
  updateBookingStatusUseCase,
} from "@repo/application/admin";
import {
  generateAndSendInvoiceUseCase,
  getInvoiceDownloadUrlUseCase,
} from "@repo/application/invoices";

export interface RootOptions {
  /**
   * Database handle (D1 database binding).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db?: any;
  /** Override admin client — defaults to the D1 database binding. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminDb?: any;
  /** Current authenticated user ID. */
  userId?: string;
  /** Cloudflare KV cache namespace binding. */
  cacheKv?: any;
}

/**
 * Build a request-scoped container. Pass `db` for authenticated calls
 * so writes are scoped to the caller; omit it for public reads.
 */
export function buildContainer(opts: RootOptions = {}): Container {
  const c = new Container();

  let d1 = opts.db ?? opts.adminDb ?? getCloudflareEnv().DB;

  if (!d1) {
    // Fallback/Mock for local build & typecheck tasks if DB is not bound yet
    d1 = {
      prepare: () => ({ bind: () => ({ all: async () => [] }) }),
      exec: async () => {},
      batch: async () => [],
    };
  }

  const dbFactory = makeDrizzleD1Factory({ d1 });
  const adminDbInstance = dbFactory.admin();
  const userDbInstance = opts.db ? dbFactory.forUser("") : adminDbInstance;

  // Better Auth client placeholder (the actual client is initialized on frontend)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authProvider = makeBetterAuthProvider({} as any);

  // Infrastructure handles
  c.registerValue(T.AdminDb, adminDbInstance);
  c.registerValue(T.UserDb, userDbInstance);
  c.registerValue(T.UserId, opts.userId);
  c.registerValue(T.AuthProviderToken, authProvider);

  // Storage provider stub (Phase 4 will wire up R2)
  c.registerValue(T.StorageProviderToken, {
    getPublicUrl: (_b: string, p: string) => p,
    createSignedUploadUrl: () => {
      throw new Error("Storage migration pending");
    },
    createSignedDownloadUrl: () => {
      throw new Error("Storage migration pending");
    },
    upload: () => {
      throw new Error("Storage migration pending");
    },
    delete: () => {
      throw new Error("Storage migration pending");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // Cache
  c.registerSingleton(
    T.CacheStoreToken,
    (c) =>
      new CacheStoreManager({
        drizzleDb: c.resolve(T.AdminDb),
        kv: opts.cacheKv ?? getCloudflareEnv().CACHE_KV,
        upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
        upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
  );

  // Repositories (singletons within this request scope)
  c.registerSingleton(T.VenuesRepoToken, (c) =>
    makeDrizzleVenuesRepo({ adminDb: c.resolve(T.AdminDb), userDb: c.resolve(T.UserDb) }),
  );
  c.registerSingleton(T.UserRolesRepoToken, (c) =>
    makeDrizzleUserRolesRepo({
      adminDb: c.resolve(T.AdminDb),
      userDb: c.resolve(T.UserDb),
      userId: c.resolve(T.UserId),
    }),
  );
  c.registerSingleton(T.BookingsRepoToken, (c) =>
    makeDrizzleBookingsRepo({ adminDb: c.resolve(T.AdminDb), userDb: c.resolve(T.UserDb) }),
  );
  c.registerSingleton(T.PaymentsRepoToken, (c) =>
    makeDrizzlePaymentsRepo({ adminDb: c.resolve(T.AdminDb) }),
  );
  c.registerSingleton(T.CouponsRepoToken, (c) =>
    makeDrizzleCouponsRepo({ adminDb: c.resolve(T.AdminDb), userDb: c.resolve(T.UserDb) }),
  );
  c.registerSingleton(T.ReviewsRepoToken, (c) =>
    makeDrizzleReviewsRepo({ adminDb: c.resolve(T.AdminDb), userDb: c.resolve(T.UserDb) }),
  );
  c.registerSingleton(T.AdminRepoToken, (c) =>
    makeDrizzleAdminRepo({ adminDb: c.resolve(T.AdminDb) }),
  );

  // Invoice + email infrastructure (singletons per request)
  c.registerSingleton(T.InvoicesRepoToken, (c) =>
    makeDrizzleInvoicesRepo({ adminDb: c.resolve(T.AdminDb) }),
  );
  c.registerSingleton(T.ProfilesRepoToken, (c) =>
    makeDrizzleProfilesRepo({ adminDb: c.resolve(T.AdminDb) }),
  );

  // Invoice storage stub (Phase 4 will wire up R2)
  c.registerSingleton(T.InvoiceStorageToken, () => ({
    upload: async (p: string) => ({ path: p }),
    createSignedDownloadUrl: async (p: string) => p,
  }));

  c.registerSingleton(T.InvoicePdfRendererToken, () => makePdfLibInvoiceRenderer());
  c.registerSingleton(T.EmailSenderToken, () =>
    makeResendEmailSender({
      defaultFrom: process.env.INVOICE_FROM_EMAIL ?? "Book My Venue <onboarding@resend.dev>",
    }),
  );

  c.register(T.GenerateAndSendInvoice, (c) =>
    generateAndSendInvoiceUseCase({
      invoices: c.resolve(T.InvoicesRepoToken),
      storage: c.resolve(T.InvoiceStorageToken),
      renderer: c.resolve(T.InvoicePdfRendererToken),
      email: c.resolve(T.EmailSenderToken),
      profiles: c.resolve(T.ProfilesRepoToken),
      brand: {
        name: "Book My Venue",
        supportEmail: process.env.SUPPORT_EMAIL ?? "support@bookmyvenue.app",
      },
    }),
  );
  c.register(T.GetInvoiceDownloadUrl, (c) =>
    getInvoiceDownloadUrlUseCase({
      invoices: c.resolve(T.InvoicesRepoToken),
      storage: c.resolve(T.InvoiceStorageToken),
      bookings: c.resolve(T.BookingsRepoToken),
      roles: c.resolve(T.UserRolesRepoToken),
    }),
  );

  // Use cases — pure functions composed with their dependencies
  c.register(T.ListVenues, (c) => listVenuesUseCase(c.resolve(T.VenuesRepoToken)));
  c.register(T.GetVenue, (c) => getVenueUseCase(c.resolve(T.VenuesRepoToken)));
  c.register(T.ListHostVenues, (c) => listHostVenuesUseCase(c.resolve(T.VenuesRepoToken)));
  c.register(T.CreateVenue, (c) =>
    createVenueUseCase(
      c.resolve(T.VenuesRepoToken),
      c.resolve(T.UserRolesRepoToken),
      c.resolve(T.CacheStoreToken),
    ),
  );
  c.register(T.UpdateVenue, (c) =>
    updateVenueUseCase(c.resolve(T.VenuesRepoToken), c.resolve(T.CacheStoreToken)),
  );
  c.register(T.DeleteVenue, (c) =>
    deleteVenueUseCase(c.resolve(T.VenuesRepoToken), c.resolve(T.CacheStoreToken)),
  );
  c.register(T.BecomeHost, (c) => becomeHostUseCase(c.resolve(T.UserRolesRepoToken)));

  c.register(T.QuoteBooking, (c) =>
    quoteBookingUseCase(c.resolve(T.BookingsRepoToken), c.resolve(T.CouponsRepoToken)),
  );
  c.register(T.CreateBookingHold, (c) =>
    createBookingHoldUseCase(
      c.resolve(T.BookingsRepoToken),
      c.resolve(T.CouponsRepoToken),
      c.resolve(T.CacheStoreToken),
    ),
  );
  c.register(T.ConfirmBooking, (c) => {
    const bookingsRepo = c.resolve(T.BookingsRepoToken);
    const sendInvoice = c.resolve(T.GenerateAndSendInvoice);
    return confirmBookingUseCase(
      bookingsRepo,
      c.resolve(T.PaymentsRepoToken),
      c.resolve(T.CouponsRepoToken),
      c.resolve(T.CacheStoreToken),
      {
        onConfirmed: async (booking) => {
          const withVenue = await bookingsRepo.findWithVenue(booking.id);
          if (withVenue) await sendInvoice({ booking: withVenue });
        },
      },
    );
  });
  c.register(T.CancelBooking, (c) => cancelBookingUseCase(c.resolve(T.BookingsRepoToken)));
  c.register(T.ListMyBookings, (c) => listMyBookingsUseCase(c.resolve(T.BookingsRepoToken)));
  c.register(T.ListHostBookings, (c) => listHostBookingsUseCase(c.resolve(T.BookingsRepoToken)));
  c.register(T.GetBooking, (c) => getBookingUseCase(c.resolve(T.BookingsRepoToken)));
  c.register(T.CreateOfflineBooking, (c) =>
    createOfflineBookingUseCase(c.resolve(T.BookingsRepoToken)),
  );
  c.register(T.CreateBlockOff, (c) => createBlockOffUseCase(c.resolve(T.BookingsRepoToken)));

  c.register(T.ListHostCoupons, (c) => listHostCouponsUseCase(c.resolve(T.CouponsRepoToken)));
  c.register(T.CreateCoupon, (c) => createCouponUseCase(c.resolve(T.CouponsRepoToken)));
  c.register(T.DeleteCoupon, (c) => deleteCouponUseCase(c.resolve(T.CouponsRepoToken)));

  // Reviews
  c.register(T.ListVenueReviews, (c) => listVenueReviewsUseCase(c.resolve(T.ReviewsRepoToken)));
  c.register(T.CanIReviewVenue, (c) => canIReviewVenueUseCase(c.resolve(T.ReviewsRepoToken)));
  c.register(T.UpsertMyReview, (c) => upsertMyReviewUseCase(c.resolve(T.ReviewsRepoToken)));
  c.register(T.DeleteMyReview, (c) => deleteMyReviewUseCase(c.resolve(T.ReviewsRepoToken)));

  // Admin
  c.register(T.PlatformStats, (c) =>
    platformStatsUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.ListAllUsers, (c) =>
    listAllUsersUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.GetUserDetail, (c) =>
    getUserDetailUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.SetUserRole, (c) => setUserRoleUseCase(c.resolve(T.UserRolesRepoToken)));
  c.register(T.SetUserSuspended, (c) =>
    setUserSuspendedUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.ListAllVenues, (c) =>
    listAllVenuesUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.SetVenueSuspended, (c) =>
    setVenueSuspendedAsAdminUseCase(
      c.resolve(T.AdminRepoToken),
      c.resolve(T.UserRolesRepoToken),
      c.resolve(T.CacheStoreToken),
    ),
  );
  c.register(T.ListAllBookings, (c) =>
    listAllBookingsUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.UpdateBookingStatus, (c) =>
    updateBookingStatusUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.ExpireStuckBookings, (c) =>
    expireStuckBookingsUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.ListAllCoupons, (c) =>
    listAllCouponsUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.SetCouponActive, (c) =>
    setCouponActiveUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.ListAllReviews, (c) =>
    listAllReviewsUseCase(c.resolve(T.AdminRepoToken), c.resolve(T.UserRolesRepoToken)),
  );
  c.register(T.DeleteReviewAsAdmin, (c) =>
    deleteReviewAsAdminUseCase(c.resolve(T.ReviewsRepoToken), c.resolve(T.UserRolesRepoToken)),
  );

  return c;
}
