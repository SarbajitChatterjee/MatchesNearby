/**
 * ProfileScreen — user settings and account info.
 *
 * Layout: centered card-based settings list with avatar at top.
 * Currently shows a "Guest User" placeholder — when real auth
 * is wired up, pull the user's name/email from the auth context.
 *
 * Theme toggle:
 * The dark mode switch is wired directly to useTheme().toggle,
 * which toggles the `dark` class on <html> and persists to localStorage.
 */

import { User, Bell, Moon, Sun, Info, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/useTheme";

export function ProfileScreen() {
  const { theme, toggle, isDark } = useTheme();

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      {/* Avatar & name */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="text-2xl font-semibold">G</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Guest User</h2>
          <p className="text-sm text-muted-foreground">Sign in to sync your data</p>
        </div>
      </div>

      {/* Settings card */}
      <Card>
        <CardContent className="space-y-4 p-4">
          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
              <span className="text-sm font-medium text-foreground">Dark Mode</span>
            </div>
            <Switch checked={isDark} onCheckedChange={toggle} />
          </div>

          <Separator />

          {/* Notifications toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Notifications</span>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          {/* About / version */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">About</span>
            </div>
            <span className="text-xs text-muted-foreground">v1.0.0</span>
          </div>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Button variant="outline" className="w-full gap-2">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
