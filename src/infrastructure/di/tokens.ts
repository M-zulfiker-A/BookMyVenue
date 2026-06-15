// Infrastructure — DI tokens for ports and use-cases.

import { token } from "@repo/infrastructure";
import type {
  AdminRepo,
  AuthProvider,
  BookingsRepo,
  CacheStore,
  CouponsRepo,
  DbClientFactory,
  DbHandle,
  EmailSender,
  InvoicePdfRenderer,
  InvoiceStorage,
  InvoicesRepo,
  PaymentsRepo,
  ProfilesRepo,
  ReviewsRepo,
  StorageProvider,
  UserRolesRepo,
  VenuesRepo,
} from "@repo/contracts";
import type {
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
import type {
  becomeHostUseCase,
  createVenueUseCase,
  deleteVenueUseCase,
  getVenueUseCase,
  listHostVenuesUseCase,
  listVenuesUseCase,
  updateVenueUseCase,
} from "@repo/application/venues";
import type {
  createCouponUseCase,
  deleteCouponUseCase,
  listHostCouponsUseCase,
} from "@repo/application/coupons";
import type {
  canIReviewVenueUseCase,
  deleteMyReviewUseCase,
  listVenueReviewsUseCase,
  upsertMyReviewUseCase,
} from "@repo/application/reviews";
import type {
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

// ---- Infrastructure handles ----
export const AdminDb = token<DbHandle>("AdminDb");
export const UserDb = token<DbHandle | undefined>("UserDb");
export const DbFactoryToken = token<DbClientFactory>("DbFactory");
export const UserId = token<string | undefined>("UserId");

// ---- Cross-cutting providers (swappable per environment) ----
export const AuthProviderToken = token<AuthProvider>("AuthProvider");
export const StorageProviderToken = token<StorageProvider>("StorageProvider");
export const CacheStoreToken = token<CacheStore>("CacheStore");

// ---- Repositories (ports) ----
export const VenuesRepoToken = token<VenuesRepo>("VenuesRepo");
export const UserRolesRepoToken = token<UserRolesRepo>("UserRolesRepo");
export const BookingsRepoToken = token<BookingsRepo>("BookingsRepo");
export const PaymentsRepoToken = token<PaymentsRepo>("PaymentsRepo");
export const CouponsRepoToken = token<CouponsRepo>("CouponsRepo");
export const ReviewsRepoToken = token<ReviewsRepo>("ReviewsRepo");
export const AdminRepoToken = token<AdminRepo>("AdminRepo");

// ---- Use cases ----
// Venues
export const ListVenues = token<ReturnType<typeof listVenuesUseCase>>("ListVenues");
export const GetVenue = token<ReturnType<typeof getVenueUseCase>>("GetVenue");
export const ListHostVenues = token<ReturnType<typeof listHostVenuesUseCase>>("ListHostVenues");
export const CreateVenue = token<ReturnType<typeof createVenueUseCase>>("CreateVenue");
export const UpdateVenue = token<ReturnType<typeof updateVenueUseCase>>("UpdateVenue");
export const DeleteVenue = token<ReturnType<typeof deleteVenueUseCase>>("DeleteVenue");
export const BecomeHost = token<ReturnType<typeof becomeHostUseCase>>("BecomeHost");

// Bookings
export const QuoteBooking = token<ReturnType<typeof quoteBookingUseCase>>("QuoteBooking");
export const CreateBookingHold =
  token<ReturnType<typeof createBookingHoldUseCase>>("CreateBookingHold");
export const ConfirmBooking = token<ReturnType<typeof confirmBookingUseCase>>("ConfirmBooking");
export const CancelBooking = token<ReturnType<typeof cancelBookingUseCase>>("CancelBooking");
export const ListMyBookings = token<ReturnType<typeof listMyBookingsUseCase>>("ListMyBookings");
export const ListHostBookings =
  token<ReturnType<typeof listHostBookingsUseCase>>("ListHostBookings");
export const GetBooking = token<ReturnType<typeof getBookingUseCase>>("GetBooking");
export const CreateOfflineBooking =
  token<ReturnType<typeof createOfflineBookingUseCase>>("CreateOfflineBooking");
export const CreateBlockOff = token<ReturnType<typeof createBlockOffUseCase>>("CreateBlockOff");

// Coupons
export const ListHostCoupons = token<ReturnType<typeof listHostCouponsUseCase>>("ListHostCoupons");
export const CreateCoupon = token<ReturnType<typeof createCouponUseCase>>("CreateCoupon");
export const DeleteCoupon = token<ReturnType<typeof deleteCouponUseCase>>("DeleteCoupon");

// Reviews
export const ListVenueReviews =
  token<ReturnType<typeof listVenueReviewsUseCase>>("ListVenueReviews");
export const CanIReviewVenue = token<ReturnType<typeof canIReviewVenueUseCase>>("CanIReviewVenue");
export const UpsertMyReview = token<ReturnType<typeof upsertMyReviewUseCase>>("UpsertMyReview");
export const DeleteMyReview = token<ReturnType<typeof deleteMyReviewUseCase>>("DeleteMyReview");

// Admin
export const PlatformStats = token<ReturnType<typeof platformStatsUseCase>>("PlatformStats");
export const ListAllUsers = token<ReturnType<typeof listAllUsersUseCase>>("ListAllUsers");
export const GetUserDetail = token<ReturnType<typeof getUserDetailUseCase>>("GetUserDetail");
export const SetUserRole = token<ReturnType<typeof setUserRoleUseCase>>("SetUserRole");
export const SetUserSuspended =
  token<ReturnType<typeof setUserSuspendedUseCase>>("SetUserSuspended");
export const ListAllVenues = token<ReturnType<typeof listAllVenuesUseCase>>("ListAllVenues");
export const SetVenueSuspended =
  token<ReturnType<typeof setVenueSuspendedAsAdminUseCase>>("SetVenueSuspended");
export const ListAllBookings = token<ReturnType<typeof listAllBookingsUseCase>>("ListAllBookings");
export const UpdateBookingStatus =
  token<ReturnType<typeof updateBookingStatusUseCase>>("UpdateBookingStatus");
export const ExpireStuckBookings =
  token<ReturnType<typeof expireStuckBookingsUseCase>>("ExpireStuckBookings");
export const ListAllCoupons = token<ReturnType<typeof listAllCouponsUseCase>>("ListAllCoupons");
export const SetCouponActive = token<ReturnType<typeof setCouponActiveUseCase>>("SetCouponActive");
export const ListAllReviews = token<ReturnType<typeof listAllReviewsUseCase>>("ListAllReviews");
export const DeleteReviewAsAdmin =
  token<ReturnType<typeof deleteReviewAsAdminUseCase>>("DeleteReviewAsAdmin");

// ---- Invoice + email (cross-cutting) ----
import type {
  generateAndSendInvoiceUseCase,
  getInvoiceDownloadUrlUseCase,
} from "@repo/application/invoices";

export const InvoicesRepoToken = token<InvoicesRepo>("InvoicesRepo");
export const ProfilesRepoToken = token<ProfilesRepo>("ProfilesRepo");
export const InvoiceStorageToken = token<InvoiceStorage>("InvoiceStorage");
export const InvoicePdfRendererToken = token<InvoicePdfRenderer>("InvoicePdfRenderer");
export const EmailSenderToken = token<EmailSender>("EmailSender");

export const GenerateAndSendInvoice =
  token<ReturnType<typeof generateAndSendInvoiceUseCase>>("GenerateAndSendInvoice");
export const GetInvoiceDownloadUrl =
  token<ReturnType<typeof getInvoiceDownloadUrlUseCase>>("GetInvoiceDownloadUrl");
