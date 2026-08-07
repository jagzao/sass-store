-- STRY-021: Unique partial index on bookings to prevent double-booking a staff slot.
-- Resolves SC-12 (race condition) atomically at the DB level.
-- Generated: 2026-08-04
--
-- Only active bookings (confirmed | pending) with an assigned staff are protected.
-- cancelled/completed rows are excluded so slots become reusable.
-- NULL staff_id rows are excluded (NULLs are distinct in unique indexes, would not
-- conflict anyway, but we keep the predicate tight for clarity and perf).

CREATE UNIQUE INDEX IF NOT EXISTS booking_slot_uniq
  ON bookings (staff_id, start_time)
  WHERE status IN ('confirmed', 'pending') AND staff_id IS NOT NULL;
