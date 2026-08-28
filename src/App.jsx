import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

// Context Providers

// Layout & Protection Wrappers
import AppLayout from "./Components/layout/AppLayout";
import ProtectedRoute from "./Components/protected/ProtectedRoute";

// Pages
import LoginPage from "./Pages/Auth/LoginPage";

// Admin Pages
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import TracksPage from "./Pages/Admin/TracksPage";
import LabsPage from "./Pages/Admin/LabsPage";
import JudgesPage from "./Pages/Admin/JudgesPage";
import TeamsPage from "./Pages/Admin/TeamsPage";
import MasterEvaluationsPage from "./Pages/Admin/MasterEvaluationsPage";
import ScheduledEvaluations from "./Pages/Admin/SchedulledEvaluations";
import JudgeDashboard from "./Pages/Judge/JudgeDashboard";
import JudgeEvaluation from "./Pages/Judge/JudgeEvaluation";
import { AuthProvider } from "./context/AuthProvider";

// Judge Pages
// import JudgeDashboard from "./pages/judge/JudgeDashboard";
// import LiveScoringPage from "./pages/judge/LiveScoringPage";

const router = createBrowserRouter([
  // Public Routes
  {
    path: "/login",
    element: <LoginPage />,
  },

  // Protected Admin Portal
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "tracks", element: <TracksPage /> },
          { path: "labs", element: <LabsPage /> },
          { path: "judges", element: <JudgesPage /> },
          { path: "teams", element: <TeamsPage /> },
          { path: "evaluations", element: <MasterEvaluationsPage /> },
          { path: "schedulled-evaluations", element: <ScheduledEvaluations /> },
        ],
      },
    ],
  },

  // Protected Judge Portal
  {
    path: "/judge",
    element: <ProtectedRoute allowedRoles={["JUDGE"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/judge/dashboard" replace /> },
          { path: "dashboard", element: <JudgeDashboard /> },
          // Added evaluation route under AppLayout
          { path: "evaluate/:evaluationId", element: <JudgeEvaluation /> },
        ],
      },
    ],
  },
  // Fallback Catch-All Route
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
