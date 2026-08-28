import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Assets Imports
import ntiLogo from "../../assets/nti.png";
import mtcLogo from "../../assets/mtc.png";
import mctLogo from "../../assets/logoMi.png";
import digiLogo from "../../assets/Digilians.png";
import mlogo from "../../assets/logom.png";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // login method authenticates credentials and returns user details (including role) or success indicator
      const response = await login({ username, password });

      if (response) {
        // Extract role returned from login response or auth context
        const userRole = response.user?.role || response.role || "JUDGE";

        // Route automatically based on user's assigned role
        if (userRole === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/judge/dashboard");
        }
      } else {
        setError(
          "Invalid credentials. Please verify your username and password.",
        );
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(
        err.response?.data?.message ||
          "An error occurred while logging in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Main Branding Logos */}
        <div className="flex justify-center items-center gap-3 flex-wrap">
          <div className="p-2 rounded-2xl">
            <img src={mlogo} alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <div className="p-2 rounded-2xl">
            <img
              src={mtcLogo}
              alt="MTC Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="p-2 rounded-2xl">
            <img
              src={digiLogo}
              alt="Digillians Logo"
              className="w-16 h-16 object-contain"
            />
          </div>

          <div className="p-2 rounded-2xl">
            <img
              src={ntiLogo}
              alt="NTI Logo"
              className="w-16 h-16 object-contain"
            />
          </div>

          <div className="p-2 rounded-2xl">
            <img
              src={mctLogo}
              alt="MCT Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>

        <h2 className="mt-4 text-center text-3xl font-extrabold text-black tracking-tight">
          Digillians Evaluation Portal
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          Competition Tracks & Live Evaluation System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 border border-slate-200 shadow-sm rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center space-x-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username Input Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Input Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
