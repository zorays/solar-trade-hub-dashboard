import OrdersManagementPage from "./OrdersManagementPage";

const PendingOrders = () => (
  <OrdersManagementPage
    scope="pending"
    title="Pending Orders"
    description="Review live marketplace orders that have not yet reached a final delivered, cancelled or failed state."
  />
);

export default PendingOrders;
