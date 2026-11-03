# Run and deploy the updated dashboard

## Development

1. Use Node.js 22 LTS or a compatible supported Node.js runtime.
2. Run `npm ci` in this folder.
3. Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the backend API base, including `/api/v1`.
4. Run `npm run dev`.
5. Sign in with an existing verified dashboard account. The supplied backend must be running, connected to MongoDB and configured to allow the dashboard's origin through CORS.

Only the public API base URL belongs in the dashboard environment. MongoDB, JWT signing, SMTP, Biz Daily and analytics-ingestion secrets belong on the backend.

## Build and hosting

Run `npm run build`. The included `dist/` folder is a production build using the default development API fallback. For live hosting, configure the real API URL and rebuild; do not deploy that default build unchanged to production.

Deploy the rebuilt contents of `dist/` to your static host. Configure history fallback so routes such as `/payments` and `/products/supplier-products` serve `index.html`. Retain existing backend endpoints and permission enforcement.

## Checks

- `npm run typecheck` checks TypeScript.
- `npm run build` checks types and builds production assets.
- `npm run check:api -- /absolute/path/to/backend/src` compares direct Axios methods/paths against the reviewed backend route tree. Supply the backend's `src` directory, containing `routes/index.js`.
- `npx playwright install chromium`, then `npm run test:ui` runs the fixture-backed browser checks. The runner starts its own local Vite server. Use `DASHBOARD_TEST_URL` to test an already running local build instead.
- An existing compatible Chromium binary can be selected with `CHROMIUM_PATH`.
- `npm run lint` runs the full lint configuration; legacy findings are documented in UPDATE_NOTES.md.

## First live smoke test

Use a staging backend and non-production records. Verify the following with appropriate roles:

1. Login, refresh, logout and rejected/expired sessions.
2. Supplier product submission → admin approval → mapping → stock verification → grant FREE ENABLE → publish → public visibility → revoke.
3. External catalogue item → choose a supplier → grant/revoke FREE ENABLE; confirm public listing visibility from the storefront.
4. Pending manual receipt → review actual bank receipt/reference → verify paid → correct order/subscription/token fulfilment. Retrying failed fulfilment must not duplicate the grant.
5. A paid order → processing/ready → shipment → delivery; disallowed cancellation remains rejected by the server.
6. A read-only payment role can view records but cannot see or execute financial mutation controls; a token viewer cannot adjust balances.
7. Check the real operation queue counts, mobile layout, dark mode and API/network failures.

These live checks are not marked passed by the included fixture browser suite. For missing backend capabilities, see UPDATE_NOTES.md.
