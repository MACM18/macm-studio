"use client";

import { useEffect, useState } from "react";
import { LogOut, Moon, Sun } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function WorkspaceTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = localStorage.getItem("macm-theme");
    const selected = saved === "light" || saved === "dark" ? saved : matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setTheme(selected);
    document.documentElement.dataset.theme = selected;
  }, []);
  const toggle = () => {
    const selected = theme === "dark" ? "light" : "dark";
    setTheme(selected);
    localStorage.setItem("macm-theme", selected);
    document.documentElement.dataset.theme = selected;
  };
  return <button className="workspace-icon" type="button" onClick={toggle} aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>;
}

export function SignOutButton() {
  const signOut = async () => {
    await authClient.signOut();
    window.location.assign("/sign-in");
  };
  return <button className="workspace-signout" type="button" onClick={signOut}><LogOut size={16} /> Sign out</button>;
}
