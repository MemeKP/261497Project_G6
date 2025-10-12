import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
 
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", 
        });

        // console.log('🔍 Auth check response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          if (data.admin) {
            // console.log("✅ ADMIN:", data.admin);
            setIsAuthenticated(true);  
          } else {
            // console.log("❌ No admin in response");
            setIsAuthenticated(false);
          }
        } else {
          if (res.status === 401) {
            // console.log('🔐 Not authenticated (401)');
            setIsAuthenticated(false);
          } else {
            const errorData = await res.json().catch(() => ({}));
            // console.error('Auth check failed:', res.status, errorData);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.log("Network error in Auth Provider", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false); 
      }
    };

    checkSession();
  }, []);
  
  const login = () => setIsAuthenticated(true);
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsAuthenticated(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };