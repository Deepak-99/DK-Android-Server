import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { connect, disconnect } from "@/services/websocket";
import { getToken, clearToken } from "@/utils/token";

interface AuthContextType {
  user: any;
  login: (user: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  /* ------------------------------
     Restore session on reload
  ------------------------------ */
    useEffect(() => {
        const token = getToken();
        const userData = localStorage.getItem("user");

        if (token && userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

  /* ------------------------------
     LOGIN (token already stored)
  ------------------------------ */
  const login = (userData: any) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    navigate("/");
  };

  /* ------------------------------
     LOGOUT
  ------------------------------ */
  const logout = () => {
    disconnect();
    clearToken();

    setUser(null);
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);