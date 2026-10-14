# Decisions

## 1. One Event model for every kind of event
An event has a `kind` (concert, bus, flight, conference) instead of a separate
table for each kind. A bus and a concert both have a title, a place and a start
time, so one table is enough.
Unsure: a free-text `kind` is loose. A fixed list might be safer.

## 2. Ticket types carry the rules
Each ticket type has its own name, price, quantity, sale window and per-customer
limit. VIP and standard are two ticket types on the same event. A bus with
several departure times is several events that use the same layout.

## 3. Seat layouts are separate and reusable
A seat layout (a bus, a theatre) is defined once and many events point to it.
Seats belong to the layout, not to an event. Whether a seat is free, held or
sold for one event will be stored separately, so the layout never changes.

## 4. Seated and unseated are both supported
A ticket type has `seated` true or false. General admission uses `quantity`
only. A mixed venue uses a seated ticket type tied to a section (for example
"circle") plus a standing ticket type with a quantity.

## 5. Price belongs to the ticket type, not the seat
All seats under one ticket type cost the same. If seats need different prices,
they become different ticket types in different sections.
Unsure: this is limiting if a bus charges extra for window seats.

## 6. Prices are whole numbers
Prices are stored as whole numbers in the single currency used, which avoids
decimal rounding mistakes. Multi-currency is out of scope.