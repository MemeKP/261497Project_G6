import { createContext } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean; // ✅ เพิ่ม loading state
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };
export type { AuthContextType };