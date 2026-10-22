
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

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";

/* =========================================================
   GENERAL PAGES / LAYOUT
========================================================= */

import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Blank from "./pages/Blank";

import AppLayout from "./layout/AppLayout";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import PermissionRoute from "./components/auth/PermissionRoute";

import { ScrollToTop } from "./components/common/ScrollToTop";

import Home from "./pages/Dashboard/Home";

/* =========================================================
   PRODUCTS
========================================================= */

import ProductsList from "./pages/Products/ProductsList";
import ViewProduct from "./pages/Products/ViewProduct";

/* =========================================================
   CUSTOMERS
========================================================= */

import CustomersList from "./pages/Customers/CustomersList";

/* =========================================================
   SUPPLIERS
========================================================= */

import SuppliersList from "./pages/Suppliers/SuppliersList";
import AddSupplier from "./pages/Suppliers/AddSupplier";
import ViewSupplier from "./pages/Suppliers/ViewSupplier";
import EditSupplier from "./pages/Suppliers/EditSupplier";
import SupplierApplications from "./pages/Suppliers/SupplierApplications";
import SupplierVerification from "./pages/Suppliers/SupplierVerification";

/* =========================================================
   MARKETPLACE
========================================================= */

import RangeTokens from "./pages/Marketplace/RangeTokens";
import CustomerRequests from "./pages/Marketplace/CustomerRequests";
import Subscriptions from "./pages/Marketplace/Subscriptions";
import PlansFeatures from "./pages/Marketplace/PlansFeatures";
import SupplierBids from "./pages/Marketplace/SupplierBids";

import SupplierProductManagement from "./pages/Marketplace/SupplierProductManagement";

/* =========================================================
   INSTALLERS
========================================================= */

import InstallersList from "./pages/Installers/InstallersList";
import AddInstaller from "./pages/Installers/AddInstaller";
import ViewInstaller from "./pages/Installers/ViewInstaller";
import EditInstaller from "./pages/Installers/EditInstaller";
import InstallerApplications from "./pages/Installers/InstallerApplications";
import InstallerVerification from "./pages/Installers/InstallerVerification";

/* =========================================================
   TENDERS
========================================================= */

import TendersList from "./pages/Tenders/TendersList";
import AddTender from "./pages/Tenders/AddTender";
import ViewTender from "./pages/Tenders/ViewTender";
import EditTender from "./pages/Tenders/EditTender";

/* =========================================================
   ORDERS
========================================================= */

import OrdersList from "./pages/Orders/OrdersList";
import PendingOrders from "./pages/Orders/PendingOrders";
import CompletedOrders from "./pages/Orders/CompletedOrders";
import ViewOrder from "./pages/Orders/ViewOrder";

/* =========================================================
   PAYMENTS
========================================================= */

import PaymentsList from "./pages/Payments/PaymentsList";
import PendingPayments from "./pages/Payments/PendingPayments";
import ManualVerification from "./pages/Payments/ManualVerification";

/* =========================================================
   DEALS
========================================================= */

import DealsList from "./pages/Deals/DealsList";
import AddDeal from "./pages/Deals/AddDeal";
import ViewDeal from "./pages/Deals/ViewDeal";
import EditDeal from "./pages/Deals/EditDeal";

/* =========================================================
   CAREERS MANAGEMENT

   Existing dashboard files:

   src/pages/Careers/Careers.tsx
   src/pages/Careers/ApplicationsCareers.tsx
   src/pages/Careers/PipelineCareers.tsx
========================================================= */

import Careers from "./pages/Careers/Careers";

import ApplicationsCareers from "./pages/Careers/ApplicationsCareers";

import PipelineCareers from "./pages/Careers/PipelineCareers";

/* =========================================================
   USERS / ROLES
========================================================= */

import UsersList from "./pages/Users/UsersList";
import ViewUser from "./pages/Users/ViewUser";
import EditUser from "./pages/Users/EditUser";
import RolesPermissions from "./pages/Users/RolesPermissions";

/* =========================================================
   CONTENT
========================================================= */

import Homepage from "./pages/Content/Homepage";
import Banners from "./pages/Content/Banners";
import Pages from "./pages/Content/Pages";

/* =========================================================
   REPORTS
========================================================= */

import MarketplaceReport from "./pages/Reports/MarketplaceReport";
import UsersReport from "./pages/Reports/UsersReport";
import OrdersReport from "./pages/Reports/OrdersReport";

/* =========================================================
   SETTINGS
========================================================= */

import GeneralSettings from "./pages/Settings/GeneralSettings";
import MarketplaceSettings from "./pages/Settings/MarketplaceSettings";
import EmailSettings from "./pages/Settings/EmailSettings";

/* =========================================================
   NOTIFICATIONS / HELP
========================================================= */

import Notifications from "./pages/Notifications/Notifications";
import HelpSupport from "./pages/Help/HelpSupport";

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  return (
    <Router>
      <ScrollToTop />

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
                element={
                  <Navigate to="/products" replace />
                }
              />

              <Route
                path="/products/brands"
                element={
                  <Navigate to="/products" replace />
                }
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
                  anyOf={["suppliers.manage"]}
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
                    "customer_requests.view",
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
                    "subscriptions.view",
                    "subscriptions.manage",
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
                    "subscriptions.manage",
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
                    "supplier_bids.view",
                    "supplier_bids.manage",
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
                    "orders.manage",
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
    </Router>
  );
}
