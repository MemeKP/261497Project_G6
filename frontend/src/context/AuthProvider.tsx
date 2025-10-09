import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
 
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", 
        });

        if (res.ok) {
          const data = await res.json();
          if (data.admin) {
            console.log("ADMIN, ",data.admin)
            setIsAuthenticated(true);  
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.log("Error inAuth Provider", err)
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, []);
  
  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };