// import { Navigate } from "react-router-dom";
// import { useAuth } from "../context/useAuth";
// import type { ReactNode } from "react";

// interface ProtectedRouteProps {
//   children: ReactNode;
// }

// const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
//   const { isAuthenticated } = useAuth();

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   // return children;
//   return <>{children}</>;
// };

// // export { ProtectedRoute };
// export default ProtectedRoute

import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        setAuthorized(res.ok); // ถ้า 200 แปลว่ามี session
      } catch (error) {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!authorized) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
