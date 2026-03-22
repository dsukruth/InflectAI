import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080C14" }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "#F0A500", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={`/login?redirect_to=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
