"use client";

import { useState, useRef, useEffect } from "react";

export type NavSection = "dashboard" | "schedule" | "analytics" | "team" | "settings";

export interface NewVisitData {
  name: string;
  address: string;
  duration: number; // minutes
  resourceId: string;
  date: string;
  startTime: string;
  priority: "low" | "medium" | "high";
  notes: string;
}

interface SidebarProps {
  activeSection?: NavSection;
  onNavigate?: (section: NavSection) => void;
  onOpenTeam?: () => void;
  onOpenSettings?: () => void;
  onNewVisit?: (visit: NewVisitData) => void;
  availableResources?: Array<{ id: string; name: string }>;
}

export function Sidebar({ 
  activeSection = "schedule", 
  onNavigate,
  onOpenTeam,
  onOpenSettings,
  onNewVisit,
  availableResources = [],
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (section: NavSection) => {
    onNavigate?.(section);
    
    // Trigger specific actions based on section
    if (section === "team") {
      onOpenTeam?.();
    } else if (section === "settings") {
      onOpenSettings?.();
    }
  };

  const navItems: { id: NavSection; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: "schedule", icon: <CalendarIcon />, label: "Schema" },
    { id: "team", icon: <UsersIcon />, label: "Personal" },
    { id: "settings", icon: <SettingsIcon />, label: "Inställningar" },
  ];

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => { setIsExpanded(false); setShowUserMenu(false); }}
      className={`
        bg-white border-r border-slate-200 flex flex-col items-center py-6 z-40 hidden md:flex h-screen sticky top-0
        transition-all duration-300 ease-out shadow-lg shadow-slate-200/50
        ${isExpanded ? "w-52" : "w-16"}
      `}
    >
      {/* Logo */}
      <div 
        onClick={() => handleNavClick("schedule")}
        className={`
          flex items-center gap-3 cursor-pointer group
          ${isExpanded ? "w-full px-4" : ""}
        `}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-xl group-hover:shadow-brand-500/30 transition-all shrink-0">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        {isExpanded && (
          <div className="animate-fade-in">
            <span className="font-display font-bold text-slate-900 text-lg">Caire</span>
            <span className="block text-[10px] text-slate-400 font-medium -mt-0.5">Scheduling</span>
          </div>
        )}
      </div>

      {/* Navigation Icons */}
      <nav className={`flex flex-col gap-2 w-full mt-8 ${isExpanded ? "px-3" : "items-center"}`}>
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            active={activeSection === item.id}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            expanded={isExpanded}
            onClick={() => handleNavClick(item.id)}
          />
        ))}
      </nav>

      {/* Divider */}
      <div className={`my-4 ${isExpanded ? "w-full px-4" : "w-8"}`}>
        <div className="h-px bg-slate-200" />
      </div>

      {/* Quick Actions (only when expanded) */}
      {isExpanded && (
        <div className="w-full px-3 space-y-2 animate-fade-in">
          <button 
            onClick={() => setShowNewVisitModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nytt besök</span>
          </button>
        </div>
      )}

      {/* New Visit Modal */}
      {showNewVisitModal && (
        <NewVisitModal 
          onClose={() => setShowNewVisitModal(false)}
          onSubmit={(data) => {
            onNewVisit?.(data);
            setShowNewVisitModal(false);
          }}
          availableResources={availableResources}
        />
      )}

      {/* Bottom User Section */}
      <div className="mt-auto relative w-full px-3" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`
            flex items-center gap-3 cursor-pointer group transition-all duration-200
            ${isExpanded 
              ? "w-full px-3 py-2 hover:bg-slate-50 rounded-lg" 
              : "w-10 h-10 mx-auto justify-center rounded-xl hover:bg-slate-50"
            }
          `}
        >
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden group-hover:ring-2 group-hover:ring-brand-500 transition-all shrink-0">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full" />
          </div>
          {isExpanded && (
            <div className="flex-1 text-left min-w-0 animate-fade-in">
              <span className="block text-sm font-medium text-slate-900 truncate">Anna Lindberg</span>
              <span className="block text-xs text-slate-400 truncate">Planerare</span>
            </div>
          )}
          {isExpanded && (
            <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${showUserMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* User Dropdown Menu */}
        {showUserMenu && (
          <div className={`
            absolute bottom-full mb-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 animate-fade-in-up z-50
            ${isExpanded ? "left-3 right-3" : "left-0 w-48"}
          `}>
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <div className="text-sm font-medium text-slate-900">Anna Lindberg</div>
              <div className="text-xs text-slate-400">anna.lindberg@caire.se</div>
            </div>
            <button 
              onClick={() => { onOpenSettings?.(); setShowUserMenu(false); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Min profil
            </button>
            <button 
              onClick={() => { onOpenSettings?.(); setShowUserMenu(false); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Inställningar
            </button>
            <div className="h-px bg-slate-100 my-1" />
            <button 
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logga ut
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

interface NavItemProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  expanded: boolean;
  onClick: () => void;
}

function NavItem({ active, icon, label, badge, expanded, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 transition-all duration-200 group relative
        ${expanded 
          ? "w-full px-3 py-2.5 rounded-lg" 
          : "w-10 h-10 rounded-xl justify-center"
        }
        ${active 
          ? "bg-brand-50 text-brand-600" 
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        }
      `}
      title={!expanded ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      
      {expanded && (
        <span className={`text-sm font-medium animate-fade-in ${active ? "text-brand-700" : "text-slate-600"}`}>
          {label}
        </span>
      )}
      
      {badge && expanded && (
        <span className="ml-auto bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-fade-in">
          {badge}
        </span>
      )}
      
      {badge && !expanded && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
      
      {active && !expanded && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-brand-600 rounded-r-full -ml-3" />
      )}
      
      {/* Tooltip when collapsed */}
      {!expanded && (
        <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
        </div>
      )}
    </button>
  );
}

// New Visit Modal Component
interface NewVisitModalProps {
  onClose: () => void;
  onSubmit: (data: NewVisitData) => void;
  availableResources: Array<{ id: string; name: string }>;
}

function NewVisitModal({ onClose, onSubmit, availableResources }: NewVisitModalProps) {
  const [formData, setFormData] = useState<NewVisitData>({
    name: "",
    address: "",
    duration: 30,
    resourceId: availableResources[0]?.id || "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    priority: "medium",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-white rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900 text-lg">Nytt besök</h2>
              <p className="text-xs text-slate-500">Lägg till ett nytt besök i schemat</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Patient/Visit Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Patient / Besöksnamn <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="t.ex. Maria Andersson - Morgonbesök"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Adress <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="t.ex. Storgatan 12, 114 55 Stockholm"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Datum</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Starttid</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Duration and Resource Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Längd (minuter)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 timme</option>
                <option value={90}>1.5 timmar</option>
                <option value={120}>2 timmar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tilldela till</label>
              <select
                value={formData.resourceId}
                onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white"
              >
                {availableResources.length > 0 ? (
                  availableResources.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))
                ) : (
                  <option value="">Ingen personal tillgänglig</option>
                )}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Prioritet</label>
            <div className="flex gap-2">
              {[
                { value: "low", label: "Låg", color: "bg-slate-100 text-slate-600 border-slate-200" },
                { value: "medium", label: "Medium", color: "bg-amber-50 text-amber-700 border-amber-200" },
                { value: "high", label: "Hög", color: "bg-red-50 text-red-700 border-red-200" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p.value as "low" | "medium" | "high" })}
                  className={`
                    flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all
                    ${formData.priority === p.value 
                      ? `${p.color} ring-2 ring-offset-1 ring-brand-500` 
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    }
                  `}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Anteckningar</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Valfria anteckningar om besöket..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || !formData.address.trim()}
            className="px-5 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Skapa besök
          </button>
        </div>
      </div>
    </div>
  );
}

// Icons
function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
