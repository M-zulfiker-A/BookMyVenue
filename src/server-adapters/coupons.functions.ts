// Presentation/server adapter — Coupons (DI-resolved use-cases)

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { CouponSchema } from "@repo/application/coupons";
import { buildContainer } from "@/infrastructure/di/composition-root";
import * as T from "@/infrastructure/di/tokens";

export const listHostCoupons = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(({ context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.ListHostCoupons)(context.userId),
  );

export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => CouponSchema.parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.CreateCoupon)(data, context.userId),
  );

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId })
      .resolve(T.DeleteCoupon)(data.id)
      .then(() => ({ ok: true as const })),
  );
