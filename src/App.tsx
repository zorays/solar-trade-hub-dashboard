import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";

import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Blank from "./pages/Blank";

import AppLayout from "./layout/AppLayout";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import PermissionRoute from "./components/auth/PermissionRoute";

import {
  ScrollToTop,
} from "./components/common/ScrollToTop";

import Home from "./pages/Dashboard/Home";

import ProductsList from "./pages/Products/ProductsList";
import ViewProduct from "./pages/Products/ViewProduct";

import CustomersList from "./pages/Customers/CustomersList";

import SuppliersList from "./pages/Suppliers/SuppliersList";
import AddSupplier from "./pages/Suppliers/AddSupplier";
import ViewSupplier from "./pages/Suppliers/ViewSupplier";
import EditSupplier from "./pages/Suppliers/EditSupplier";
import SupplierApplications from "./pages/Suppliers/SupplierApplications";
import SupplierVerification from "./pages/Suppliers/SupplierVerification";

import RangeTokens from "./pages/Marketplace/RangeTokens";
import CustomerRequests from "./pages/Marketplace/CustomerRequests";
import Subscriptions from "./pages/Marketplace/Subscriptions";
import PlansFeatures from "./pages/Marketplace/PlansFeatures";
import SupplierBids from "./pages/Marketplace/SupplierBids";

import InstallersList from "./pages/Installers/InstallersList";
import AddInstaller from "./pages/Installers/AddInstaller";
import ViewInstaller from "./pages/Installers/ViewInstaller";
import EditInstaller from "./pages/Installers/EditInstaller";
import InstallerApplications from "./pages/Installers/InstallerApplications";
import InstallerVerification from "./pages/Installers/InstallerVerification";

import TendersList from "./pages/Tenders/TendersList";
import AddTender from "./pages/Tenders/AddTender";
import ViewTender from "./pages/Tenders/ViewTender";
import EditTender from "./pages/Tenders/EditTender";

import OrdersList from "./pages/Orders/OrdersList";
import PendingOrders from "./pages/Orders/PendingOrders";
import CompletedOrders from "./pages/Orders/CompletedOrders";
import ViewOrder from "./pages/Orders/ViewOrder";

import PaymentsList from "./pages/Payments/PaymentsList";
import PendingPayments from "./pages/Payments/PendingPayments";
import ManualVerification from "./pages/Payments/ManualVerification";

import DealsList from "./pages/Deals/DealsList";
import AddDeal from "./pages/Deals/AddDeal";
import ViewDeal from "./pages/Deals/ViewDeal";
import EditDeal from "./pages/Deals/EditDeal";

import UsersList from "./pages/Users/UsersList";
import ViewUser from "./pages/Users/ViewUser";
import EditUser from "./pages/Users/EditUser";
import RolesPermissions from "./pages/Users/RolesPermissions";

import Homepage from "./pages/Content/Homepage";
import Banners from "./pages/Content/Banners";
import Pages from "./pages/Content/Pages";

import MarketplaceReport from "./pages/Reports/MarketplaceReport";
import UsersReport from "./pages/Reports/UsersReport";
import OrdersReport from "./pages/Reports/OrdersReport";

import GeneralSettings from "./pages/Settings/GeneralSettings";
import MarketplaceSettings from "./pages/Settings/MarketplaceSettings";
import EmailSettings from "./pages/Settings/EmailSettings";

import Notifications from "./pages/Notifications/Notifications";

import HelpSupport from "./pages/Help/HelpSupport";

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <Routes>
        <Route
          path="/signin"
          element={<SignIn />}
        />

        <Route
          path="/signup"
          element={<SignUp />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        <Route
          element={<ProtectedRoute />}
        >
          <Route
            element={<AppLayout />}
          >
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
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />
            </Route>

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
                path="/products/:id"
                element={<ViewProduct />}
              />

              <Route
                path="/products/add"
                element={
                  <Navigate
                    to="/products"
                    replace
                  />
                }
              />

              <Route
                path="/products/categories"
                element={
                  <Navigate
                    to="/products"
                    replace
                  />
                }
              />

              <Route
                path="/products/brands"
                element={
                  <Navigate
                    to="/products"
                    replace
                  />
                }
              />

              <Route
                path="/products/:id/edit"
                element={
                  <Navigate
                    to="/products"
                    replace
                  />
                }
              />

              <Route
                path="/products/*"
                element={<Blank />}
              />
            </Route>

            <Route
              element={
                <PermissionRoute
                  adminOnly
                />
              }
            >
              <Route
                path="/customers"
                element={<CustomersList />}
              />

              <Route
                path="/customers/*"
                element={
                  <Navigate
                    to="/customers"
                    replace
                  />
                }
              />
            </Route>

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

            <Route
              path="/marketplace"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

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
                path="/marketplace/range-tokens"
                element={<RangeTokens />}
              />
            </Route>

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
                  <Navigate
                    to="/payments"
                    replace
                  />
                }
              />
            </Route>

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

            <Route
              element={
                <PermissionRoute
                  adminOnly
                />
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

            <Route
              path="/profile"
              element={<UserProfiles />}
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </Router>
  );
}