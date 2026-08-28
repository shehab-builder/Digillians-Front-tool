import { useState, useEffect } from "react";
import api from "../services/api.js";
import { AuthContext } from "./AuthContext.jsx";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate cookie session on app load
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        console.log(error);

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async ({ username, password }) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

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
