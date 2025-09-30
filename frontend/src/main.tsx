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
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <App /> */}
    <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} /></QueryClientProvider>
  </StrictMode>
);
