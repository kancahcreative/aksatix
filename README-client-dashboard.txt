AKSATIX CLIENT / ORGANIZER DASHBOARD

Files:
- client-dashboard.html: organizer dashboard with Supabase Auth and database CRUD for events, tickets, promos, and profile settings.
- supabase-config.js: existing Supabase project URL and public anon key (never put service_role keys in the browser).
- supabase-setup.sql: base schema and admin policies already included in the original project.
- supabase-client-setup.sql: organizer-scoped RLS policies for the client dashboard.
- index.html / admin.html / assets: original Aksatix site and admin dashboard.

SETUP REQUIRED BEFORE USE
1. In Supabase SQL Editor, run supabase-setup.sql if it has not already been run.
2. Then run supabase-client-setup.sql.
3. In Supabase Authentication settings, configure the allowed site URL and redirect URLs for the domain where this dashboard is hosted. Keep email confirmation enabled for production.
4. Deploy client-dashboard.html, supabase-config.js, assets/, and the other site files together to the same static hosting origin (or an appropriate subdirectory). Do not open as file://.
5. Test signup/login with a separate organizer account. Create an event, refresh the page, edit it, add a ticket, and verify it remains after signing in on another browser/device.
6. Confirm the public website displays only published events and active tickets.

BACKEND BEHAVIOR
- Supabase Auth signs organizers in with email/password.
- Event, ticket, promo, and organizer profile/bank-setting records are stored in aksatix_records with organizer_id ownership metadata.
- RLS restricts organizer CRUD to their own events/tickets/promos/settings. Existing admins retain their separate admin policy.
- Orders/attendees are read-only in the client dashboard and only visible for events owned by the organizer.
- Empty database means empty dashboard; demo event/order data is not inserted automatically.

IMPORTANT LIMITATIONS — NOT PAYMENT-PRODUCTION READY
- This connects the organizer dashboard to the existing Supabase backend once the SQL migrations are applied. The current environment cannot apply migrations or verify live login/read/write, so deployment is not claimed as tested.
- Payment gateway, trusted server-side webhook verification, atomic ticket inventory reservation, refund processing, e-ticket/QR issuance, secure check-in writes, and real payout ledger are not implemented by these static dashboard files. Do not accept real payments or treat estimated payout figures as actual funds until those backend functions are built and tested.
- The existing generic aksatix_records schema is retained for compatibility with the current admin/public website. A normalized schema with database constraints and Edge Functions is recommended before scaling ticket sales.
