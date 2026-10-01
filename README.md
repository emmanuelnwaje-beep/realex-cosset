# Realex Cosset Services — Complete Live Build

## What this build fixes
- Customer orders are saved to Supabase without public SELECT access.
- Admin Orders contains only real Supabase orders; there is no demo/fake order data in the admin JavaScript.
- Dashboard sales, order counts, customers and reports come from Supabase.
- Admin can update order status.
- Admin can add/edit/delete/hide menu items.
- Customer Menu reads available products from Supabase. If an existing seeded product has no uploaded image, the app uses its bundled local image.
- Admin can add/edit/hide/delete business locations.
- Customer Locations reads active locations from Supabase.
- Responsive customer app and admin dashboard.
- PWA/service-worker cache version bumped.

## Before deployment
1. Open `supabase-config.js`.
2. Replace the two placeholders with the Supabase Project URL and publishable/anon key.
3. In Supabase SQL Editor, run `supabase-complete-schema.sql`.
4. If the project already has the schema and you do not want to rerun it, run `supabase-admin-migration.sql` instead.
5. Create the administrator in Supabase Authentication.
6. Add that user's UUID to `admin_users` using the setup SQL comment in the schema.
7. Sign in through `admin-login.html`.

## Address changes
Go to Admin → Locations.
Edit an address and save. Only locations marked Active/Show are displayed on the customer app.

## Important
Do not put a Supabase service-role/secret key in `supabase-config.js`.
The browser should use the publishable/anon key and RLS should protect the database.


## New admin features
- Orders: delete individual orders or all cancelled orders.
- Customers: delete a customer's order history; because the customer list is derived from orders, the customer disappears when their order history is removed.
- Locations: add, edit, hide/show and delete addresses.
- Advertisements: create, edit, hide/show and delete live promotions.
- Customer app: active advertisements from Supabase appear in the Live Offer area.

## Advertisement setup
Run the updated `supabase-admin-migration.sql` once. It creates the `advertisements` table and a starter Ready-to-Fry Samosa & Spring Roll advert. You can later edit it and upload the advert picture from Admin → Advertisements.
