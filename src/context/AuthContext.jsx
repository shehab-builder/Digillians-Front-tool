import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate the cookie session on app load
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Backend reads cookie and returns current user info (Admin or Judge)
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        console.log(error);

        // Cookie missing or invalid
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  /**
   * Login request setting the HTTP-only Cookie on the backend
   */
  const login = async ({ username, password }) => {
    setLoading(true);
    try {
      console.log({ username, password });

      // Backend sets the cookie in response header: Set-Cookie: token=...; HttpOnly; SameSite=Lax
      const response = await api.post("/auth/login", {
        username,
        password,
      });
      console.log(response.data);

      setUser(response.data.data);
      setLoading(false);
      return response.data.data;
    } catch (error) {
      console.error(
        "Login failed:",
        error.response?.data?.message || error.message,
      );
      setLoading(false);
      return false;
    }
  };

  /**
   * Logout clears the server cookie
   */
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
