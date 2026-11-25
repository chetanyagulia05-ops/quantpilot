// ============================================================
// QuantPilot — AppLayout with Responsive Sidebar and Persistent AI Orb
// ============================================================

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIOrb from '@/components/ai/AIOrb';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-secondary text-text-primary antialiased">
      {/* Navigation Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex flex-1 flex-col transition-all duration-300 min-w-0 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        } ml-0`}
      >
        <Header
          onMenuToggle={() => {
            if (window.innerWidth < 768) {
              setMobileSidebarOpen((prev) => !prev);
            } else {
              setSidebarCollapsed((prev) => !prev);
            }
          }}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Persistent Conversational AI Orb (Across All Pages) */}
      <AIOrb />
    </div>
  );
}
