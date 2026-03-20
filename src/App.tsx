import React, { useState } from "react";
import { Home } from "@/pages/Home";
import { InspectorMode } from "@/pages/InspectorMode";
import { AdminMode } from "@/pages/AdminMode";
import { AppMode } from "@/types";

export default function App() {
  const [mode, setMode] = useState<AppMode>("home");

  const handleModeChange = (m: AppMode) => setMode(m);
  const goHome = () => setMode("home");

  if (mode === "inspector") return <InspectorMode onBack={goHome} />;
  if (mode === "admin") return <AdminMode onBack={goHome} />;
  return <Home onModeChange={handleModeChange} />;
}
