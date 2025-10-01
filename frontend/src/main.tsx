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

import OrderStatusPage from "./routes/OrderStatusPage.tsx";
import BillPage from './routes/ฺBillPage.tsx'
import LoginPage from './routes/LoginPage.tsx'
import RegisterPage from './routes/RegisterPage.tsx'
import CartPage from './routes/CartPage.tsx'

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
        path: "/menu/:groupId",
        element: <MenuPage />,
      },
      {
        path: "/details",
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
        path: "/cart",
        element: <CartPage />,
      },
      {
        path: "/orderstatus",
        element: <OrderStatusPage />,
      },
      {
        path: "/billpage",
        element: <BillPage />,
      },
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <App /> */}
    <RouterProvider router={router} />
  </StrictMode>,
)