import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/inflect-logo.png";

const AppNavbar = () => {
  const { user } = useAuthStore();
  const signOut = async () => { await supabase.auth.signOut(); };
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initial = user?.email?.charAt(0).toUpperCase() || "?";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <nav
      className="h-14 flex items-center justify-between px-8 border-b border-border shrink-0"
      style={{ background: "rgba(8,12,20,0.95)" }}
    >
      <Link to="/app/research">
        <img src={logo} alt="Inflect" className="h-7 object-contain" />
      </Link>

      <div className="flex items-center gap-6">
        <Link
          to="/app/portfolio"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Portfolio
        </Link>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ background: "#F0A500", color: "#080C14" }}
          >
            {initial}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-36 rounded-lg py-1 z-50"
              style={{ background: "#0F1820", border: "1px solid #1E2D40" }}
            >
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
