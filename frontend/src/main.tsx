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

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: "/table/:sessionId",
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
        path: "/details/:sessionId",
        element: <DetailsPage />,
      },
      {
        path: "/addmember/:sessionId",
        element: <AddMemberPage />,
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
