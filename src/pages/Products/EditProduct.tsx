import {
  Navigate,
} from "react-router";

/* =========================================================
   SOLAR TRADE HUB
   LEGACY EDIT PRODUCT ROUTE

   Product master data is owned by the external Rate List API.
   The dashboard is read-only for catalogue master data and
   manages marketplace access around external products.
========================================================= */

export default function EditProduct() {
  return (
    <Navigate
      to="/products"
      replace
    />
  );
}
