import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)
    throw new Error(
      "Install Playwright and Chromium first: npm install --no-save playwright && npx playwright install chromium",
    );
  ({ chromium } = require(
    path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, "playwright"),
  ));
}
const server = process.env.DASHBOARD_TEST_URL
  ? null
  : await (
      await import("vite")
    ).createServer({
      server: { host: "127.0.0.1", port: 5173, strictPort: true },
    });
if (server) await server.listen();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-zygote",
    "--single-process",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--in-process-gpu",
  ],
});
const origin = process.env.DASHBOARD_TEST_URL || "http://127.0.0.1:5173";
const id = "aaaaaaaaaaaaaaaaaaaaaaaa",
  sid = "bbbbbbbbbbbbbbbbbbbbbbbb",
  now = "2026-11-03T12:00:00.000Z";
const user = {
  _id: id,
  id,
  accountType: "dashboard",
  name: "Test Administrator",
  email: "admin@example.test",
  role: "admin",
  status: "active",
  isVerified: true,
  permissions: ["*"],
  provider: "local",
};
const product = {
  _id: id,
  name: "Test solar module",
  sku: "TEST-550",
  category: "Solar panels",
  price: 19500,
  currency: "PKR",
  stockQuantity: 100,
  minimumOrderQuantity: 1,
  stockStatus: "in_stock",
  status: "approved",
  enabled: false,
  publicationStatus: "not_published",
  supplier: {
    _id: sid,
    companyName: "Test Supplier",
    status: "active",
    verificationStatus: "verified",
  },
  catalogue: {
    source: "master_catalogue",
    mappingStatus: "pending",
    externalProductId: "11111111-1111-4111-8111-111111111111",
  },
  stockVerification: { status: "verified", verifiedQuantity: 100 },
  freeListing: { active: false },
  createdAt: now,
  updatedAt: now,
};
const payment = {
  _id: id,
  paymentNumber: "PAY-TEST-001",
  customer: { _id: sid, name: "Test Customer", email: "buyer@example.test" },
  supplier: null,
  purpose: "product_order",
  order: null,
  subscriptionPlan: null,
  supplierSubscription: null,
  rangeTokenAmount: null,
  amount: 19500,
  currency: "PKR",
  paymentMethod: "manual_bank_transfer",
  provider: "manual",
  status: "pending",
  verificationStatus: "pending",
  fulfillmentStatus: "pending",
  merchantReference: "TEST-REF-001",
  createdAt: now,
};
const order = {
  _id: id,
  orderNumber: "ORD-TEST-001",
  customer: { _id: sid, name: "Test Customer" },
  status: "confirmed",
  paymentStatus: "paid",
  fulfillmentStatus: "unfulfilled",
  items: [],
  currency: "PKR",
  subtotal: 19500,
  grandTotal: 19500,
  deliveryAmount: 0,
  discountAmount: 0,
  createdAt: now,
};
const operations = {
  generatedAt: now,
  supplierProducts: {
    byStatus: { pendingReview: 3 },
    catalogueMappingQueue: 2,
    stockVerificationQueue: 4,
    published: 7,
    freeEnabledActive: 2,
  },
  catalogueOffers: { enabled: 10, freeEnabledActive: 1 },
  subscriptions: { active: 8, expiringWithin7Days: 2, awaitingPayment: 1 },
  payments: {
    awaitingVerification: 5,
    fulfilmentFailed: 1,
    verifiedRevenue: [
      { purpose: "product_order", currency: "PKR", amount: 19500, payments: 1 },
    ],
  },
  orders: {
    awaitingFulfilment: { confirmed: 1, processing: 0, ready: 0, shipped: 0 },
  },
};
const pagination = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};
let profile = user;
const calls = [];
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
await context.addInitScript(() => {
  localStorage.setItem("accessToken", "fixture-access-token");
  localStorage.setItem("refreshToken", "fixture-refresh-token");
});
await context.route("**/api/v1/**", async (route) => {
  const req = route.request(),
    url = new URL(req.url()),
    p = url.pathname.replace("/api/v1", "");
  calls.push({ method: req.method(), path: p, body: req.postDataJSON() });
  let body = { success: true, data: {} };
  if (p === "/auth/profile") body.data = { user: profile };
  else if (p === "/reports/dashboard/operations") body.data = operations;
  else if (p === "/reports/orders")
    body.data = {
      monthlyOrders: [{ key: "2026-11", label: "Nov", orders: 1 }],
    };
  else if (p === "/reports/dashboard/marketplace") {
    const metric = {
      value: 5,
      thisMonth: 1,
      lastMonth: 1,
      changePct: 0,
      trend: "up",
      comparable: true,
    };
    body.data = {
      suppliers: metric,
      verifiedInstallers: metric,
      activeTenders: metric,
    };
  } else if (p === "/reports/dashboard/user-growth")
    body.data = { range: "6m", months: 6, data: [] };
  else if (
    [
      "/users",
      "/suppliers",
      "/installers",
      "/tenders",
      "/products",
      "/products/catalog",
    ].includes(p)
  )
    body = { success: true, data: [], pagination };
  else if (p === "/supplier-products/admin")
    body = { success: true, data: [product], pagination };
  else if (p === `/supplier-products/admin/${id}`) body.data = product;
  else if (p.endsWith("/entitlement"))
    body.data = {
      publiclyVisible: product.enabled,
      entitlement: {
        allowed: product.freeListing.active,
        source: product.freeListing.active ? "admin_free_enable" : null,
        reason: product.freeListing.active ? null : "no_listing_entitlement",
      },
      checks: {
        approved: true,
        catalogueMapped: product.catalogue.mappingStatus === "mapped",
        stockVerified: true,
        inStock: true,
        sufficientStock: true,
        published: product.enabled,
        paidListingEntitlement: false,
        freeListingActive: product.freeListing.active,
      },
      subscriptionBlockingReasons: [],
    };
  else if (p.endsWith("/catalogue-mapping")) {
    assert.equal(req.postDataJSON().decision, "map");
    product.catalogue.mappingStatus = "mapped";
    body.data = product;
  } else if (
    p.startsWith("/supplier-products/") &&
    p.endsWith("/free-enable")
  ) {
    assert.ok(req.postDataJSON().reason);
    product.freeListing.active = true;
    body.data = { product, published: false };
  } else if (p.endsWith("/free-enable/revoke")) {
    product.freeListing.active = false;
    body.data = { product, unpublished: true };
  } else if (p === "/payments/manage")
    body = { success: true, data: [payment], pagination };
  else if (p === `/payments/manage/${id}`) body.data = { payment };
  else if (p.endsWith("/verify-paid")) {
    payment.status = "paid";
    payment.verificationStatus = "verified";
    payment.fulfillmentStatus = "fulfilled";
    body.data = { payment, fulfilled: true };
  } else if (p === `/orders/manage/${id}`) body.data = { order };
  else if (p === `/orders/manage/${id}/status`) {
    order.status = req.postDataJSON().status;
    body.data = { order };
  } else if (p === "/roles/permissions")
    body.data = {
      groups: [
        {
          group: "Product overrides",
          permissions: [
            { key: "products.free_enable", label: "Grant FREE ENABLE" },
          ],
        },
      ],
      keys: ["products.free_enable"],
    };
  else if (p === "/roles" || p === "/roles/active" || p === "/notifications")
    body = { success: true, data: [], pagination };
  else if (p === "/notifications/unread-count") body.data = { count: 0 };
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "authorization,content-type",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    },
  });
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
const results = [];
async function test(name, fn) {
  await fn();
  results.push(name);
  console.log("PASS", name);
}
try {
  await test("Payment list uses the management API", async () => {
    await page.goto(origin + "/payments");
    await page
      .getByText("PAY-TEST-001", { exact: true })
      .filter({ visible: true })
      .waitFor();
    assert.ok(calls.some((c) => c.path === "/payments/manage"));
  });
  await test("Payment verification sends reference and refreshes server state", async () => {
    await page
      .getByRole("button", { name: "Review", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByText("Payment review", { exact: true }).waitFor();
    await page
      .getByRole("textbox", { name: "Bank or provider reference" })
      .fill("BANK-TEST-123");
    await page
      .getByRole("button", { name: "Verify paid", exact: true })
      .click();
    await page.getByText("Payment updated successfully.").waitFor();
    assert.equal(
      calls.find((c) => c.path.endsWith("/verify-paid")).body.providerSnapshot
        .reference,
      "BANK-TEST-123",
    );
    await page.getByRole("button", { name: "Close payment review" }).click();
  });
  await test("Supplier product mapping and FREE ENABLE use the correct routes", async () => {
    await page.goto(origin + "/products/supplier-products");
    await page.getByText("Test solar module", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: /view|review/i })
      .last()
      .click();
    await page
      .getByRole("heading", { name: "Publication readiness" })
      .waitFor();
    await page
      .getByRole("button", { name: "Save mapping", exact: true })
      .click();
    await page
      .getByText(
        "Catalogue mapping saved. Recheck readiness before publishing.",
      )
      .waitFor();
    await page
      .getByRole("textbox", { name: "Grant or revocation reason" })
      .fill("Early bird supplier access");
    await page
      .getByRole("button", { name: "Grant FREE ENABLE", exact: true })
      .click();
    await page.getByText(/FREE ENABLE granted/).waitFor();
    assert.ok(calls.some((c) => c.path.endsWith("/catalogue-mapping")));
    assert.ok(calls.some((c) => c.path.endsWith("/free-enable")));
  });
  await test("FREE ENABLE revocation updates product entitlement", async () => {
    await page
      .getByRole("button", { name: "Revoke grant", exact: true })
      .click();
    await page.getByText("Grant revoked; product unpublished.").waitFor();
    assert.equal(product.freeListing.active, false);
    assert.ok(calls.some((c) => c.path.endsWith("/free-enable/revoke")));
  });
  await test("Order fulfilment saves an allowed transition", async () => {
    await page.goto(origin + `/orders/${id}`);
    await page.getByRole("heading", { name: "Fulfilment actions" }).waitFor();
    await page
      .getByRole("combobox", { name: "Next order status" })
      .selectOption("processing");
    await page
      .getByRole("button", { name: "Update status", exact: true })
      .click();
    await page.getByText("Order status updated.").waitFor();
    assert.equal(order.status, "processing");
  });
  await test("Role editor loads the backend permission catalogue", async () => {
    await page.goto(origin + "/users/roles");
    await page.getByRole("heading", { name: /roles/i }).first().waitFor();
    assert.ok(calls.some((c) => c.path === "/roles/permissions"));
  });
  await test("Read-only payment staff cannot verify payments", async () => {
    profile = {
      ...user,
      role: "accountant",
      roleDetails: {
        name: "Accountant",
        slug: "accountant",
        status: "active",
        permissions: ["payments.view"],
      },
      permissions: ["payments.view"],
    };
    await page.goto(origin + "/payments");
    await page
      .getByText("PAY-TEST-001", { exact: true })
      .filter({ visible: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Review", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByText("Your account has read-only payment access.")
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Verify paid", exact: true })
        .count(),
      0,
    );
    await page.getByRole("button", { name: "Close payment review" }).click();
  });
  await test("Mobile payment workspace stays within the viewport", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + "/payments");
    await page
      .getByText("PAY-TEST-001", { exact: true })
      .filter({ visible: true })
      .waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    );
    if (process.env.DASHBOARD_SCREENSHOT_DIR)
      await page.screenshot({
        path: process.env.DASHBOARD_SCREENSHOT_DIR + "/payments-mobile.png",
        fullPage: true,
      });
  });
  await test("Operational work queue renders real response values", async () => {
    profile = user;
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin + "/");
    await page.getByRole("heading", { name: "Your work queue" }).waitFor();
    await page.getByText("Catalogue mapping", { exact: true }).waitFor();
    assert.ok(calls.some((c) => c.path === "/reports/dashboard/operations"));
    if (process.env.DASHBOARD_SCREENSHOT_DIR)
      await page.screenshot({
        path: process.env.DASHBOARD_SCREENSHOT_DIR + "/dashboard-desktop.png",
        fullPage: true,
      });
  });
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    JSON.stringify({
      passed: results.length,
      browserErrors: errors.length,
      scope:
        "Mock API frontend integration; no live MongoDB or payment gateway",
    }),
  );
} catch (error) {
  console.error("Browser failure:", {url: page.url(), errors, calls: calls.slice(-12), text: (await page.locator("body").innerText()).slice(0,2200)});
  throw error;
} finally {
  await browser.close();
  if (server) await server.close();
}
