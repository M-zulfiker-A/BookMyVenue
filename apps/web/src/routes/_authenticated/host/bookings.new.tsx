import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { listHostVenues } from "@/server-adapters/venues.functions";
import { createOfflineBooking, getAvailableTimeslots } from "@/server-adapters/bookings.functions";
import {
  slotsToTimeRange,
  slotToMinutes,
  minutesToSlot,
  generateTimeslots,
} from "@repo/domain/timeslots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/host/bookings/new")({
  head: () => ({ meta: [{ title: "New offline booking — Book My Venue" }] }),
  component: NewOfflineBookingPage,
});

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function dateToString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function NewOfflineBookingPage() {
  const navigate = useNavigate();
  const listVenuesFn = useServerFn(listHostVenues);
  const createFn = useServerFn(createOfflineBooking);
  const getTimeslotsFn = useServerFn(getAvailableTimeslots);

  const { data: venues = [] } = useQuery({
    queryKey: ["host-venues"],
    queryFn: () => listVenuesFn({}),
  });

  const [venueId, setVenueId] = useState("");
  const [date, setDate] = useState<Date | undefined>(defaultDate());
  const dateStr = date ? dateToString(date) : "";
  const [startSlot, setStartSlot] = useState("");
  const [endSlot, setEndSlot] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCount, setGuestCount] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "bank_transfer" | "card_offline" | "online" | "other"
  >("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStartSlot("");
    setEndSlot("");
  }, [venueId, dateStr]);

  const { data: timeslots, isLoading: isTimeslotsLoading } = useQuery({
    queryKey: ["timeslots", venueId, dateStr],
    queryFn: () => getTimeslotsFn({ data: { venue_id: venueId, date: dateStr } }),
    enabled: !!venueId && !!dateStr,
  });

  const allSlotLabels = useMemo(() => generateTimeslots(), []);

  const endSlotOptions = useMemo(() => {
    if (!startSlot || !timeslots) return [];
    const startMin = slotToMinutes(startSlot);
    const opts: { value: string; label: string; disabled: boolean }[] = [];
    for (let min = startMin + 30; min <= 1440; min += 30) {
      const slotLabel = minutesToSlot(min % 1440);
      const display = min === 1440 ? "24:00" : slotLabel;
      let rangeBlocked = false;
      for (let check = startMin; check < min; check += 30) {
        const checkSlot = minutesToSlot(check);
        const s = timeslots.find((t) => t.time === checkSlot);
        if (!s || !s.is_available) {
          rangeBlocked = true;
          break;
        }
      }
      opts.push({ value: display, label: display, disabled: rangeBlocked });
      if (rangeBlocked) break;
    }
    return opts;
  }, [startSlot, timeslots]);

  const selectedSlots = useMemo(() => {
    if (!startSlot || !endSlot) return [];
    const startMin = slotToMinutes(startSlot);
    const endMin = endSlot === "24:00" ? 1440 : slotToMinutes(endSlot);
    const slots: string[] = [];
    for (let m = startMin; m < endMin; m += 30) {
      slots.push(minutesToSlot(m));
    }
    return slots;
  }, [startSlot, endSlot]);

  const timeRange = useMemo(() => {
    if (selectedSlots.length === 0 || !dateStr) return null;
    return slotsToTimeRange(dateStr, selectedSlots);
  }, [dateStr, selectedSlots]);

  const selectedRangeText = useMemo(() => {
    if (!startSlot || !endSlot) return null;
    const hours = selectedSlots.length * 0.5;
    return `${startSlot} – ${endSlot} (${hours} ${hours === 1 ? "hour" : "hours"})`;
  }, [startSlot, endSlot, selectedSlots.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return toast.error("Pick a venue");
    if (!timeRange) return toast.error("Select start and end times");
    setLoading(true);
    try {
      const total = Math.round(parseFloat(totalAmount || "0") * 100);
      const paid = Math.round(parseFloat(amountPaid || "0") * 100);
      await createFn({
        data: {
          venue_id: venueId,
          start_time: timeRange.startIso,
          end_time: timeRange.endIso,
          guest_name: guestName,
          guest_email: guestEmail || undefined,
          guest_phone: guestPhone || undefined,
          guest_count: guestCount ? parseInt(guestCount, 10) : undefined,
          total_cents: total,
          payment_method: paymentMethod,
          amount_paid_cents: paid,
          notes: notes || undefined,
        },
      });
      toast.success("Offline booking created");
      navigate({ to: "/host/bookings" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/host/bookings" className="text-xs text-brand font-medium">
        ← Back to bookings
      </Link>
      <h2 className="font-serif text-3xl mt-2 mb-6">New offline booking</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white ring-1 ring-black/5 rounded-2xl p-6 space-y-5"
      >
        <div>
          <Label htmlFor="venue">Venue</Label>
          <Select value={venueId} onValueChange={setVenueId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a venue…" />
            </SelectTrigger>
            <SelectContent>
              {venues.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Date</Label>
          <div className="mt-1">
            <DatePicker
              value={date}
              onChange={setDate}
              disabled={(d) => d < new Date(new Date().toDateString())}
              placeholder="Pick a date"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Time</Label>
            {!venueId ? (
              <div className="text-xs text-lead/50 py-3 mt-1">Select a venue first.</div>
            ) : isTimeslotsLoading ? (
              <div className="text-xs text-lead/50 animate-pulse py-3 mt-1">Loading…</div>
            ) : (
              <Select
                value={startSlot}
                onValueChange={(v) => {
                  setStartSlot(v);
                  setEndSlot("");
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select start…" />
                </SelectTrigger>
                <SelectContent>
                  {allSlotLabels.map((slot) => {
                    const s = timeslots?.find((t) => t.time === slot);
                    const isDisabled = !s || !s.is_available;
                    return (
                      <SelectItem key={slot} value={slot} disabled={isDisabled}>
                        {slot}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label>End Time</Label>
            <Select value={endSlot} onValueChange={setEndSlot} disabled={!startSlot}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select end…" />
              </SelectTrigger>
              <SelectContent>
                {endSlotOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedRangeText && (
          <div className="rounded-lg bg-brand/5 border border-brand/10 p-2.5 text-center text-xs text-brand font-medium">
            {selectedRangeText}
          </div>
        )}

        <div className="pt-2 border-t border-black/5">
          <p className="text-[11px] uppercase tracking-widest text-lead/40 font-bold mb-3">
            Customer
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="count">Guests (optional)</Label>
              <Input
                id="count"
                type="number"
                min="1"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-black/5">
          <p className="text-[11px] uppercase tracking-widest text-lead/40 font-bold mb-3">
            Payment
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total">Total amount</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="paid">Amount paid</Label>
              <Input
                id="paid"
                type="number"
                step="0.01"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label>Payment method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="card_offline">Card (offline)</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {loading ? "Saving…" : "Create booking"}
        </Button>
      </form>
    </div>
  );
}
