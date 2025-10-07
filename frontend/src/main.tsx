import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import LandingPage from "./routes/LandingPage.tsx";
import HomePage from "./routes/HomePage.tsx";
import DetailsPage from "./routes/DetailsPage.tsx";
import AddMemberPage from "./routes/AddMemberPage.tsx";
import MenuPage from "./routes/MenuPage.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layout/MainLayout.tsx";
import QrDisplay from "./components/QrDisplay.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RegisterPage from "./routes/RegisterPage.tsx";
import CartPage from "./routes/CartPage.tsx";
import OrderStatusPage from "./routes/OrderStatusPage.tsx";
import BillPage from "./routes/BillPage.tsx";
import LoginPage from "./routes/LoginPage.tsx";
import AdminDashBoard from "./routes/AdminDashBoard.tsx";
import AdminOrderList from "./routes/AdminOrderList.tsx";
import AdminPayment from "./routes/AdminPayment.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { AuthProvider } from "./context/AuthProvider.tsx";
import PaymentPage from "./routes/PaymentPage.tsx";
import SplitBillPage from "./routes/SplitBillPage.tsx";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: "/tables/:sessionId",
        element: <LandingPage />,
      },
      {
        path: "/homepage/:sessionId",
        element: <HomePage />,
      },
      {
        path: "/menu/:sessionId",
        element: <MenuPage />,
      },
      {
        path: "/details/:sessionId/:menuId",
        element: <DetailsPage />,
      },
      {
        path: "/addmember/:sessionId",
        element: <AddMemberPage />,
      },
      {
        path: "/qr-display/:sessionId",
        element: <QrDisplay />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/cart/:sessionId",
        element: <CartPage />,
      },
      {
        path: "/orderstatus/:sessionId",
        element: <OrderStatusPage />,
      },
      {
        path: "/billpage/:sessionId",
        element: <BillPage />,
      },
            {
        path: "/splitbill/:billId",
        element: <SplitBillPage />,
      },
      {
        path: "/payment/:billId",
        element: <PaymentPage />,
      },
      {
        path: "/payment/:billId/:memberId",
        element: <PaymentPage />,
      },     
      {
        path: "/admin/dashboard",
        element: (
          <ProtectedRoute>
            <AdminDashBoard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/order",
        element: (
          <ProtectedRoute>
            <AdminOrderList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/payment",
        element: (
          <ProtectedRoute>
            <AdminPayment />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <App /> */}
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
