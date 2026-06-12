"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileSidebar } from "./sidebar";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
        }
      })
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <MobileSidebar />

      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products, customers..."
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        {user && (
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-2 rounded-md px-2 py-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? "..." : "Logout"}
            </Button>
          </div>
        )}

        {user && (
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}
