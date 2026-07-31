import React, { useEffect, useState } from "react";
import Header from "./Header";
import DashboardContent from "./DashboardContent";
import Sidebar from "./Sidebar";
import camporaLogo from "../../assets/campora_logo.png";
import { fetchDashboard } from "../../lib/api";

export default function Page() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard()
      .then(setDashboard)
      .catch((err) => setError(err.message));
  }, []);

  const user = dashboard
    ? { name: dashboard.profile.name, role: dashboard.profile.role, avatarUrl: dashboard.profile.avatar_url }
    : undefined;

  return (
    <div className="bg-background text-on-background min-h-screen overflow-x-hidden">
      <Sidebar logoUrl={camporaLogo} user={user} />
      <main className="md:ml-sidebar-width min-h-screen">
        <Header />
        {error ? (
          <div className="px-container-padding pt-8">
            <p className="text-error font-bold">Couldn't load dashboard data: {error}</p>
          </div>
        ) : (
          <DashboardContent dashboard={dashboard} />
        )}
      </main>
    </div>
  );
}
