import { lazy, Suspense } from "react";
const Categories = lazy(() => import("./pages/Products/Categories"));
const Brands = lazy(() => import("./pages/Products/Brands"));

import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router";

/* =========================================================
   SOLAR TRADE HUB — DASHBOARD ROUTING

   Authentication:
   - Public authentication routes
   - Protected dashboard routes

   Careers:
   - Job Openings
   - Applications
   - Candidate Pipeline

   All Careers routes require:
   careers.view OR careers.manage
========================================================= */

/* =========================================================
   AUTHENTICATION
========================================================= */

const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("./pages/AuthPages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/AuthPages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/AuthPages/ResetPassword"));

/* =========================================================
   GENERAL PAGES / LAYOUT
========================================================= */

const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Blank = lazy(() => import("./pages/Blank"));

import AppLayout from "./layout/AppLayout";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import PermissionRoute from "./components/auth/PermissionRoute";

import { ScrollToTop } from "./components/common/ScrollToTop";

const Home = lazy(() => import("./pages/Dashboard/Home"));

/* =========================================================
   PRODUCTS
========================================================= */

const ProductsList = lazy(() => import("./pages/Products/ProductsList"));
const ViewProduct = lazy(() => import("./pages/Products/ViewProduct"));

/* =========================================================
   CUSTOMERS
========================================================= */

const CustomersList = lazy(() => import("./pages/Customers/CustomersList"));

/* =========================================================
   SUPPLIERS
========================================================= */

const SuppliersList = lazy(() => import("./pages/Suppliers/SuppliersList"));
const AddSupplier = lazy(() => import("./pages/Suppliers/AddSupplier"));
const ViewSupplier = lazy(() => import("./pages/Suppliers/ViewSupplier"));
const EditSupplier = lazy(() => import("./pages/Suppliers/EditSupplier"));
const SupplierApplications = lazy(() => import("./pages/Suppliers/SupplierApplications"));
const SupplierVerification = lazy(() => import("./pages/Suppliers/SupplierVerification"));

/* =========================================================
   MARKETPLACE
========================================================= */

const RangeTokens = lazy(() => import("./pages/Marketplace/RangeTokens"));
const CustomerRequests = lazy(() => import("./pages/Marketplace/CustomerRequests"));
const Subscriptions = lazy(() => import("./pages/Marketplace/Subscriptions"));
const PlansFeatures = lazy(() => import("./pages/Marketplace/PlansFeatures"));
const SupplierBids = lazy(() => import("./pages/Marketplace/SupplierBids"));

const SupplierProductManagement = lazy(() => import("./pages/Marketplace/SupplierProductManagement"));

/* =========================================================
   INSTALLERS
========================================================= */

const InstallersList = lazy(() => import("./pages/Installers/InstallersList"));
const AddInstaller = lazy(() => import("./pages/Installers/AddInstaller"));
const ViewInstaller = lazy(() => import("./pages/Installers/ViewInstaller"));
const EditInstaller = lazy(() => import("./pages/Installers/EditInstaller"));
const InstallerApplications = lazy(() => import("./pages/Installers/InstallerApplications"));
const InstallerVerification = lazy(() => import("./pages/Installers/InstallerVerification"));

/* =========================================================
   TENDERS
========================================================= */

const TendersList = lazy(() => import("./pages/Tenders/TendersList"));
const AddTender = lazy(() => import("./pages/Tenders/AddTender"));
const ViewTender = lazy(() => import("./pages/Tenders/ViewTender"));
const EditTender = lazy(() => import("./pages/Tenders/EditTender"));

/* =========================================================
   ORDERS
========================================================= */

const OrdersList = lazy(() => import("./pages/Orders/OrdersList"));
const PendingOrders = lazy(() => import("./pages/Orders/PendingOrders"));
const CompletedOrders = lazy(() => import("./pages/Orders/CompletedOrders"));
const ViewOrder = lazy(() => import("./pages/Orders/ViewOrder"));

/* =========================================================
   PAYMENTS
========================================================= */

const PaymentsList = lazy(() => import("./pages/Payments/PaymentsList"));
const PendingPayments = lazy(() => import("./pages/Payments/PendingPayments"));
const ManualVerification = lazy(() => import("./pages/Payments/ManualVerification"));

/* =========================================================
   DEALS
========================================================= */

const DealsList = lazy(() => import("./pages/Deals/DealsList"));
const AddDeal = lazy(() => import("./pages/Deals/AddDeal"));
const ViewDeal = lazy(() => import("./pages/Deals/ViewDeal"));
const EditDeal = lazy(() => import("./pages/Deals/EditDeal"));

/* =========================================================
   CAREERS MANAGEMENT

   Existing dashboard files:

   src/pages/Careers/Careers.tsx
   src/pages/Careers/ApplicationsCareers.tsx
   src/pages/Careers/PipelineCareers.tsx
========================================================= */

const Careers = lazy(() => import("./pages/Careers/Careers"));

const ApplicationsCareers = lazy(() => import("./pages/Careers/ApplicationsCareers"));

const PipelineCareers = lazy(() => import("./pages/Careers/PipelineCareers"));

/* =========================================================
   USERS / ROLES
========================================================= */

const UsersList = lazy(() => import("./pages/Users/UsersList"));
const ViewUser = lazy(() => import("./pages/Users/ViewUser"));
const EditUser = lazy(() => import("./pages/Users/EditUser"));
const RolesPermissions = lazy(() => import("./pages/Users/RolesPermissions"));

/* =========================================================
   CONTENT
========================================================= */

const Homepage = lazy(() => import("./pages/Content/Homepage"));
const MarketplaceSales = lazy(() => import("./pages/Content/MarketplaceSales"));
const Banners = lazy(() => import("./pages/Content/Banners"));
const Pages = lazy(() => import("./pages/Content/Pages"));

/* =========================================================
   REPORTS
========================================================= */

const MarketplaceReport = lazy(() => import("./pages/Reports/MarketplaceReport"));
const UsersReport = lazy(() => import("./pages/Reports/UsersReport"));
const OrdersReport = lazy(() => import("./pages/Reports/OrdersReport"));

/* =========================================================
   SETTINGS
========================================================= */

const GeneralSettings = lazy(() => import("./pages/Settings/GeneralSettings"));
const MarketplaceSettings = lazy(() => import("./pages/Settings/MarketplaceSettings"));
const EmailSettings = lazy(() => import("./pages/Settings/EmailSettings"));

/* =========================================================
   NOTIFICATIONS / HELP
========================================================= */

const Notifications = lazy(() => import("./pages/Notifications/Notifications"));
const HelpSupport = lazy(() => import("./pages/Help/HelpSupport"));

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <Suspense fallback={<div role="status" className="p-10 text-center text-sm text-gray-500">Loading workspace…</div>}>
      <Routes>
        {/* ================================================
            PUBLIC AUTHENTICATION
        ================================================ */}

        <Route path="/signin" element={<SignIn />} />

        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* ================================================
            AUTHENTICATED DASHBOARD
        ================================================ */}

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            {/* ============================================
                DASHBOARD OVERVIEW
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  permission="dashboard.view"
                  redirectTo="/"
                />
              }
            >
              <Route
                path="/"
                element={<Home />}
              />

              <Route
                path="/dashboard"
                element={<Navigate to="/" replace />}
              />
            </Route>

            {/* ============================================
                PRODUCTS — VIEW
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "products.view",
                    "products.manage",
                  ]}
                />
              }
            >
              <Route
                path="/products"
                element={<ProductsList />}
              />

              <Route
                path="/products/supplier-products"
                element={
                  <SupplierProductManagement
                    mode="products"
                  />
                }
              />

              <Route
                path="/products/:id"
                element={<ViewProduct />}
              />

              <Route
                path="/products/add"
                element={
                  <Navigate to="/products" replace />
                }
              />

              <Route
                path="/products/categories"
                element={<PermissionRoute permission="products.manage"><Categories /></PermissionRoute>}
              />

              <Route
                path="/products/brands"
                element={<PermissionRoute permission="products.manage"><Brands /></PermissionRoute>}
              />

              <Route
                path="/products/:id/edit"
                element={
                  <Navigate to="/products" replace />
                }
              />

              <Route
                path="/products/*"
                element={<Blank />}
              />
            </Route>

            {/* PRODUCTS — APPROVAL */}

            <Route
              element={
                <PermissionRoute
                  anyOf={["products.manage"]}
                />
              }
            >
              <Route
                path="/products/approvals"
                element={
                  <SupplierProductManagement
                    mode="approvals"
                  />
                }
              />
            </Route>

            {/* SUPPLIER STOCK */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "products.view",
                    "products.manage",
                  ]}
                />
              }
            >
              <Route
                path="/suppliers/stock"
                element={
                  <SupplierProductManagement
                    mode="stock"
                  />
                }
              />
            </Route>

            {/* ============================================
                CUSTOMERS — ADMIN ONLY
            ============================================ */}

            <Route
              element={
                <PermissionRoute adminOnly />
              }
            >
              <Route
                path="/customers"
                element={<CustomersList />}
              />

              <Route
                path="/customers/*"
                element={
                  <Navigate to="/customers" replace />
                }
              />
            </Route>

            {/* ============================================
                SUPPLIERS — VIEW
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "suppliers.view",
                    "suppliers.manage",
                  ]}
                />
              }
            >
              <Route
                path="/suppliers"
                element={<SuppliersList />}
              />

              <Route
                path="/suppliers/:id"
                element={<ViewSupplier />}
              />

              <Route
                path="/suppliers/*"
                element={<Blank />}
              />
            </Route>

            {/* SUPPLIERS — MANAGEMENT */}

            <Route
              element={
                <PermissionRoute
                  permission="suppliers.manage"
                />
              }
            >
              <Route
                path="/suppliers/add"
                element={<AddSupplier />}
              />

              <Route
                path="/suppliers/applications"
                element={<SupplierApplications />}
              />

              <Route
                path="/suppliers/verification"
                element={<SupplierVerification />}
              />

              <Route
                path="/suppliers/:id/edit"
                element={<EditSupplier />}
              />
            </Route>

            {/* ============================================
                MARKETPLACE
            ============================================ */}

            <Route
              path="/marketplace"
              element={<Navigate to="/" replace />}
            />

            {/* RANGE TOKENS */}

            <Route
              element={
                <PermissionRoute
                  anyOf={["range_tokens.view", "range_tokens.manage", "customer_requests.manage", "suppliers.manage"]}
                />
              }
            >
              <Route
                path="/marketplace/range-tokens"
                element={<RangeTokens />}
              />
            </Route>

            {/* CUSTOMER REQUESTS */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    
                    "customer_requests.manage",
                    "suppliers.manage",
                  ]}
                />
              }
            >
              <Route
                path="/marketplace/customer-requests"
                element={<CustomerRequests />}
              />
            </Route>

            {/* SUBSCRIPTIONS */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    
                    
                    "suppliers.manage",
                  ]}
                />
              }
            >
              <Route
                path="/marketplace/subscriptions"
                element={<Subscriptions />}
              />
            </Route>

            {/* PLANS & FEATURES */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    
                    "suppliers.manage",
                  ]}
                />
              }
            >
              <Route
                path="/marketplace/plans"
                element={<PlansFeatures />}
              />
            </Route>

            {/* SUPPLIER BIDS */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    
                    
                    "suppliers.manage",
                  ]}
                />
              }
            >
              <Route
                path="/marketplace/supplier-bids"
                element={<SupplierBids />}
              />
            </Route>

            {/* MARKETPLACE LEGACY REDIRECTS */}

            <Route
              path="/marketplace/coupons"
              element={
                <Navigate
                  to="/marketplace/range-tokens"
                  replace
                />
              }
            />

            <Route
              path="/marketplace/*"
              element={<Blank />}
            />

            {/* ============================================
                INSTALLERS — VIEW
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "installers.view",
                    "installers.manage",
                  ]}
                />
              }
            >
              <Route
                path="/installers"
                element={<InstallersList />}
              />

              <Route
                path="/installers/:id"
                element={<ViewInstaller />}
              />

              <Route
                path="/installers/*"
                element={<Blank />}
              />
            </Route>

            {/* INSTALLERS — MANAGEMENT */}

            <Route
              element={
                <PermissionRoute
                  permission="installers.manage"
                />
              }
            >
              <Route
                path="/installers/add"
                element={<AddInstaller />}
              />

              <Route
                path="/installers/applications"
                element={<InstallerApplications />}
              />

              <Route
                path="/installers/verification"
                element={<InstallerVerification />}
              />

              <Route
                path="/installers/:id/edit"
                element={<EditInstaller />}
              />
            </Route>

            {/* ============================================
                TENDERS — VIEW
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "tenders.view",
                    "tenders.manage",
                  ]}
                />
              }
            >
              <Route
                path="/tenders"
                element={<TendersList />}
              />

              <Route
                path="/tenders/:id"
                element={<ViewTender />}
              />

              <Route
                path="/tenders/*"
                element={<Blank />}
              />
            </Route>

            {/* TENDERS — MANAGEMENT */}

            <Route
              element={
                <PermissionRoute
                  permission="tenders.manage"
                />
              }
            >
              <Route
                path="/tenders/add"
                element={<AddTender />}
              />

              <Route
                path="/tenders/:id/edit"
                element={<EditTender />}
              />
            </Route>

            {/* ============================================
                ORDERS
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "orders.view",
                    "orders.manage",
                  ]}
                />
              }
            >
              <Route
                path="/orders"
                element={<OrdersList />}
              />

              <Route
                path="/orders/pending"
                element={<PendingOrders />}
              />

              <Route
                path="/orders/completed"
                element={<CompletedOrders />}
              />

              <Route
                path="/orders/:id"
                element={<ViewOrder />}
              />

              <Route
                path="/orders/*"
                element={<Blank />}
              />
            </Route>

            {/* ============================================
                PAYMENTS
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "payments.view",
                    "payments.manage",
                  ]}
                />
              }
            >
              <Route
                path="/payments"
                element={<PaymentsList />}
              />

              <Route
                path="/payments/pending"
                element={<PendingPayments />}
              />

              <Route
                path="/payments/manual-verification"
                element={<ManualVerification />}
              />

              <Route
                path="/payments/*"
                element={
                  <Navigate to="/payments" replace />
                }
              />
            </Route>

            {/* ============================================
                DEALS — VIEW
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "deals.view",
                    "deals.manage",
                  ]}
                />
              }
            >
              <Route
                path="/deals"
                element={<DealsList />}
              />

              <Route
                path="/deals/:id"
                element={<ViewDeal />}
              />

              <Route
                path="/deals/*"
                element={<Blank />}
              />
            </Route>

            {/* DEALS — MANAGEMENT */}

            <Route
              element={
                <PermissionRoute
                  permission="deals.manage"
                />
              }
            >
              <Route
                path="/deals/add"
                element={<AddDeal />}
              />

              <Route
                path="/deals/:id/edit"
                element={<EditDeal />}
              />
            </Route>

            {/* ============================================
                CAREERS MANAGEMENT

                All three pages connected to the same
                RBAC-protected dashboard layout.

                Job Openings:
                /careers

                Candidate Applications:
                /careers/applications

                Recruitment Pipeline:
                /careers/pipeline
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "careers.view",
                    "careers.manage",
                  ]}
                />
              }
            >
              {/* JOB OPENINGS */}

              <Route
                path="/careers"
                element={<Careers />}
              />

              {/* CANDIDATE APPLICATIONS */}

              <Route
                path="/careers/applications"
                element={<ApplicationsCareers />}
              />

              {/* RECRUITMENT PIPELINE */}

              <Route
                path="/careers/pipeline"
                element={<PipelineCareers />}
              />
            </Route>

            {/* ============================================
                ROLES & PERMISSIONS
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "roles.view",
                    "roles.manage",
                  ]}
                />
              }
            >
              <Route
                path="/users/roles"
                element={<RolesPermissions />}
              />
            </Route>

            {/* ============================================
                COMPANY USERS — ADMIN ONLY
            ============================================ */}

            <Route
              element={
                <PermissionRoute adminOnly />
              }
            >
              <Route
                path="/users"
                element={<UsersList />}
              />

              <Route
                path="/users/:id/edit"
                element={<EditUser />}
              />

              <Route
                path="/users/:id"
                element={<ViewUser />}
              />

              <Route
                path="/users/*"
                element={<Blank />}
              />
            </Route>

            {/* ============================================
                CONTENT — VIEW
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "content.view",
                    "content.manage",
                  ]}
                />
              }
            >
              <Route
                path="/content/homepage"
                element={<Homepage />}
              />

              <Route
                path="/content/sales"
                element={<PermissionRoute permission="content.manage"><MarketplaceSales /></PermissionRoute>}
              />

              <Route
                path="/content/*"
                element={<Blank />}
              />
            </Route>

            {/* CONTENT — MANAGEMENT */}

            <Route
              element={
                <PermissionRoute
                  permission="content.manage"
                />
              }
            >
              <Route
                path="/content/banners"
                element={<Banners />}
              />

              <Route
                path="/content/pages"
                element={<Pages />}
              />
            </Route>

            {/* ============================================
                REPORTS
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "reports.view",
                    "reports.manage",
                  ]}
                />
              }
            >
              <Route
                path="/reports/marketplace"
                element={<MarketplaceReport />}
              />

              <Route
                path="/reports/users"
                element={<UsersReport />}
              />

              <Route
                path="/reports/orders"
                element={<OrdersReport />}
              />

              <Route
                path="/reports/*"
                element={<Blank />}
              />
            </Route>

            {/* ============================================
                SETTINGS
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "settings.view",
                    "settings.manage",
                  ]}
                />
              }
            >
              <Route
                path="/settings"
                element={<GeneralSettings />}
              />

              <Route
                path="/settings/marketplace"
                element={<MarketplaceSettings />}
              />

              <Route
                path="/settings/email"
                element={<EmailSettings />}
              />

              <Route
                path="/settings/*"
                element={<Blank />}
              />
            </Route>

            {/* ============================================
                NOTIFICATIONS
            ============================================ */}

            <Route
              element={
                <PermissionRoute
                  anyOf={[
                    "notifications.view",
                    "notifications.manage",
                  ]}
                />
              }
            >
              <Route
                path="/notifications"
                element={<Notifications />}
              />

              <Route
                path="/notifications/*"
                element={<Blank />}
              />
            </Route>

            {/* ============================================
                HELP & SUPPORT
            ============================================ */}

            <Route
              path="/help-support"
              element={<HelpSupport />}
            />

            <Route
              path="/help"
              element={
                <Navigate
                  to="/help-support"
                  replace
                />
              }
            />

            <Route
              path="/help/*"
              element={
                <Navigate
                  to="/help-support"
                  replace
                />
              }
            />

            <Route
              path="/help-support/*"
              element={<Blank />}
            />

            {/* ============================================
                USER PROFILE
            ============================================ */}

            <Route
              path="/profile"
              element={<UserProfiles />}
            />

          </Route>
        </Route>

        {/* ================================================
            404 — NOT FOUND
        ================================================ */}

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
      </Suspense>
    </Router>
  );
}
