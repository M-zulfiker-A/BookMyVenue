// Presentation/server adapter — Bookings (DI-resolved use-cases)

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import {
  BookingIdSchema,
  BlockOffSchema,
  OfflineBookingSchema,
  QuoteSchema,
} from "@repo/application/bookings";
import { buildContainer } from "@/infrastructure/di/composition-root";
import * as T from "@/infrastructure/di/tokens";

export const quoteBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QuoteSchema.parse(input))
  .handler(({ data }) => buildContainer().resolve(T.QuoteBooking)(data));

export const createBookingHold = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => QuoteSchema.parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.CreateBookingHold)(
      data,
      context.userId,
    ),
  );

export const confirmBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => BookingIdSchema.parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.ConfirmBooking)(
      data.booking_id,
      context.userId,
    ),
  );

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => BookingIdSchema.parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.CancelBooking)(
      data.booking_id,
      context.userId,
    ),
  );

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(({ context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.ListMyBookings)(
      context.userId,
    ),
  );

export const listHostBookings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(({ context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.ListHostBookings)(
      context.userId,
    ),
  );

const GetBookingSchema = z
  .object({ id: z.string().uuid().optional(), booking_id: z.string().uuid().optional() })
  .refine((d) => !!(d.id ?? d.booking_id), { message: "id required" });

export const getBooking = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => GetBookingSchema.parse(input))
  .handler(({ data, context }) => {
    const id = (data.id ?? data.booking_id)!;
    return buildContainer({ db: context.db, userId: context.userId }).resolve(T.GetBooking)(id);
  });

export const createOfflineBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => OfflineBookingSchema.parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.CreateOfflineBooking)(
      data,
    ),
  );

export const createBlockOff = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => BlockOffSchema.parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.CreateBlockOff)(data),
  );
