# Decisions

## 1. One Event model for every kind of event

An event has a `kind` instead of a separate table for each kind. A bus and a
concert both have a title, a place and a start time, so one table is enough. The
create form now offers only three kinds (bus, concert, conference) from a list,
and the events page can filter by them. The database column is still free text.
Unsure: a database enum would enforce the list for old or hand-made data too. The
gates rely on the kind, so a wrong kind in old data shows as "wrong gate".

## 2. Ticket types carry the rules

Each ticket type has its own name, price, quantity, sale window and per-customer
limit. VIP and standard are two ticket types on the same event. A bus with several
departure times is several events that use the same layout. A ticket type with no
name is called Regular.

## 3. Seat layouts are separate and reusable

A seat layout (a bus, a theatre) is defined once and many events point to it. Seats
belong to the layout, not to an event. Whether a seat is free, held or sold for one
event is stored separately (a reservation row), so the layout never changes. A bus
gets a layout of the size the organiser types (for example 23 seats), created the
first time and reused by every later bus of that size.

## 4. Seated and unseated are both supported

A ticket type has `seated` true or false. A bus is seated and sells exactly its
seats as one ticket type. A concert or conference is unseated and sells a quantity
per ticket type, with the total checked against its capacity. The model also allows
a mixed event (a seated circle plus a standing floor), but checkout cannot yet put
seats and standing tickets in one order.
Unsure: a 1000-seat picker would be unusable, so large venues use standing tickets.

## 5. Price belongs to the ticket type, not the seat

All seats under one ticket type cost the same. If seats need different prices, they
become different ticket types in different sections.
Unsure: this is limiting if a bus charges extra for window seats.

## 6. Prices are whole numbers

Prices are stored as whole numbers in the single currency used, which avoids decimal
rounding mistakes. Multi-currency is out of scope.

## 7. Seats: the database decides who wins

There is one reservation row per seat per event, with a unique rule on (event, seat).
Two people clicking the same seat both try to insert, and the database lets one
succeed. I chose insert-and-handle-the-error over check-then-insert, which has a gap
where both see the seat as free. Expired holds are deleted in the same transaction as
the insert, so an abandoned hold cannot block a seat forever. A hold lasts 10 minutes,
which was my choice. A customer can give a held seat back, and cancel an unpaid
order. A seat in an unpaid order is released by cancelling the order, not by itself.
Proof: a test where two requests take the same seat at once and exactly one wins.

## 8. Orders and stock

There is no "sold" counter. Stock in use is counted from items on paid orders plus
unpaid orders that have not expired. Each ticket type row is locked with FOR UPDATE,
always in the same order to avoid deadlocks, so simultaneous buyers queue and count
after each other. Creating an order extends the held seats to the order's expiry, so
a seat cannot lapse while its order waits for payment. Each order item copies the
price at purchase time, so a later price change does not rewrite history. Every
ticket has a holder name, stored on its order item.
Proof: 8 buyers fighting for 3 tickets give exactly 3 winners.

## 9. Payments: one payment, one result

A payment is created PENDING and resolved later by a callback, as mobile money works.
There is one payment per order. The callback does one conditional update ("set status
where it is still PENDING"). Exactly one copy changes the row and issues tickets.
Duplicates return 200 and do nothing, so the provider stops retrying. Tickets also
have a unique order item, so a bug could not issue two. If the callback never arrives,
overdue orders are timed out and their seats freed. This runs when pages load, not on
a schedule.
Proof: the same callback sent 10 times at once gives exactly one set of tickets.
Weakness: a shared secret header proves the caller knows the secret, not that the
body is unaltered. A signature over the body would be stronger.
Known gap: a payment that succeeds after the seat was lost takes money and issues no
tickets. Refunds are out of scope.

## 10. Tickets: signed, not guessable

A ticket code is the ticket id plus an HMAC-SHA256 signature over the id, the ticket
type and the seat. Nothing secret is stored. The type, seat and name shown at the gate
come from the database row, so a standard ticket cannot be presented as VIP or as
another seat. The code is shown as text and as a QR picture, and downloaded as a PDF.
The holder name is display only and is not part of the signature, so the gate shows
it for staff to compare with an ID, but the system does not enforce it.
Using a ticket is one conditional update (used_at from empty to now).
Proof: the same ticket scanned 10 times at once gives exactly one "valid".
Weaknesses: whoever scans a screenshotted ticket first gets in. If the signing secret
leaks, anyone can forge tickets, and there is no key rotation. The gate needs the
database, so it cannot work offline. Offline checking would need public-key signatures.

## 11. Roles and gates

There are three roles: customer, organiser and gate staff. The server checks the role
on every action and page, never only the hidden link. Roles are changed with SQL, since
there is no admin screen. Each category (bus, concert, conference) has its own gate. A
ticket at the wrong gate is refused before the one-time update, so it stays unused and
still works at the right gate. At the gate a code can be typed, pasted, read from the
camera or read from an uploaded picture. The camera needs HTTPS or localhost.

## 12. Dashboard

Each event records its organiser. The dashboard shows sold against left, revenue, sales
per ticket type and scanned against not scanned. "Sold" and revenue count paid orders
only, and "left" is capacity minus sold. It can differ slightly from the live "N left"
on the tickets page, which also counts unpaid orders that have not expired.

## 13. Design

There is one set of colour variables with a light and a dark theme, and one toggle that
remembers the choice and follows the device on the first visit. Pages use named classes
and never hard-coded colours.

## 14. Fixes after the assessment

- Late payments: settlePayment locks the ticket types and recounts before issuing tickets,
  so an order that expired and was re-bought by someone else cannot oversell. If the sweeper
  already timed the order out, a late success is ignored. That is safe for stock, but the
  customer paid and has no ticket, which needs a refund (out of scope).
- Double charge: a seat already in an unpaid or paid order cannot go into a second order.
  The checkout list, the checkout action and createOrder all check it, and createOrder locks
  the hold rows so two checkouts at once cannot both pass.
- Gate: the gate admits one chosen event. A ticket for another event is refused before the
  one-time update, so it stays unused.
- Holds: the per-customer limit is checked when a seat is held (default 10 when the organiser
  sets none), under a lock on the user row, so rapid clicks cannot exceed it. The rule is
  checked at the first point a resource is reserved, not only at the last step.
- Error messages quote the ticket type name ("tickets of type X") so an unusual name cannot
  produce nonsense like "at most 2 12 tickets".

## 15. Editing and deleting events

- An organiser edits only their own events. A price change applies to new orders only,
  because each order item copies its price. A standing quantity cannot go below what is sold
  or reserved. A seated quantity is the number of seats and cannot change, because seats
  already exist and may be held. Changing a bus's size after seats are held would orphan
  holds, so it is refused rather than guessed.
- An event is deleted only while no paid or unexpired unpaid order exists. Cancelling a sold
  event would need refunds, which are out of scope.
- Unsure: a small window exists between the delete check and the delete itself. A lock would
  close it.

## 16. Seat groups, flights and theatres

- A ticket type owns a group of seats through its section name. A seat can be sold only as the
  ticket type of its section, enforced in createOrder. This allows business and economy seats
  on one bus without a schema change. A single group uses the section "main", so older events
  and layouts keep working.
- Layouts are reused by kind and split. The split is part of the layout name as JSON, so two
  different splits can never share a layout.
- Flights (six seats a row) and theatres (ten) are new seated kinds with their own gates.
- Not built: mixed events. A seated circle plus a standing floor would need checkout to combine
  a seat picker and quantities in one order. createOrder can already take both kinds of item,
  so the missing piece is the page, which I judged less valuable than fixing the edge cases.
- Unsure: seats are not checked against a section when they are held, only when they are
  ordered. A held seat that no ticket type sells is greyed in the picker but not refused by
  the server until checkout.

## 17. Dashboard

- Totals are per category, never across categories, so seats and standing places are never
  added together. The dashboard is for an organiser deciding where to push sales and whether
  a gate is keeping up.