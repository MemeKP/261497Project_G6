import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

// import { Navigate } from "react-router-dom";
// import { useEffect, useState } from "react";

// interface ProtectedRouteProps {
//   children: React.ReactNode;
// }

// const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
//   const [loading, setLoading] = useState(true);
//   const [authorized, setAuthorized] = useState(false);

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const res = await fetch("/api/auth/me", {
//           credentials: "include",
//         });
//         setAuthorized(res.ok); 
//       } catch (error) {
//         setAuthorized(false);
//       } finally {
//         setLoading(false);
//       }
//     };

//     checkAuth();
//   }, []);

//   if (loading) return <div>Loading...</div>;

//   if (!authorized) return <Navigate to="/login" replace />;

//   return <>{children}</>;
// };

// export default ProtectedRoute;
