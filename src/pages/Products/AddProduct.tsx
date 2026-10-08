import {
  Navigate,
} from "react-router";

/* =========================================================
   SOLAR TRADE HUB
   LEGACY ADD PRODUCT ROUTE

   Product master data is owned by the external Rate List API.
   The dashboard no longer creates duplicate local products.
========================================================= */

export default function AddProduct() {
  return (
    <Navigate
      to="/products"
      replace
    />
  );
}
