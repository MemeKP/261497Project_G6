import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LandingPage from './routes/LandingPage.tsx'
import HomePage from './routes/HomePage.tsx'
import DetailsPage from './routes/DetailsPage.tsx'
import AddMemberPage from './routes/AddMemberPage.tsx'
import MenuPage from './routes/MenuPage.tsx'
import { 
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'
import MainLayout from './layout/MainLayout.tsx'
import LoginPage from './routes/LoginPage.tsx'
import RegisterPage from './routes/RegisterPage.tsx'
import CartPage from './routes/CartPage.tsx'
import OrderStatusPage from './routes/OrderStatusPage.tsx'
import BillPage from './routes/ฺBillPage.tsx'

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/homepage",
        element: <HomePage />,
      },
      {
        path: "/menu",
        element: <MenuPage />,
      },
      {
        path: "/details",
        element: <DetailsPage />,
      },
      {
        path: "/addmember",
        element: <AddMemberPage />,
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