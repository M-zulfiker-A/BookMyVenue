// Presentation/server adapter — Invoices

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { buildContainer } from "@/infrastructure/di/composition-root";
import * as T from "@/infrastructure/di/tokens";

const InvoiceIdSchema = z.object({ booking_id: z.string().uuid() });

export const getInvoiceDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => InvoiceIdSchema.parse(input))
  .handler(({ data, context }) =>
    buildContainer({ db: context.db, userId: context.userId }).resolve(T.GetInvoiceDownloadUrl)(
      data.booking_id,
      context.userId,
    ),
  );
