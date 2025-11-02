"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../hooks/useAuth";
import ChangelogModal from "./ChangelogModal";
import HelpModal from "./HelpModal";
import SettingsModal from "./SettingsModal";
import CreditsModal from "./CreditsModal";
import AccountSettingsModal from "./AccountSettingsModal";
import AssetRegistrationFloatingPanel from "./AssetRegistrationFloatingPanel";
import AssetLinkingFloatingPanel from "./AssetLinkingFloatingPanel";
import AssetTransferFloatingPanel from "./AssetTransferFloatingPanel";

interface Project {
  id: string;
  name: string;
  status: string;
  speckleUrl?: string;
  createdAt?: string;
  lastModified?: string;
}

interface TopBarProps {
  currentProject?: Project | null;
  showBackTo3D?: boolean;
  assetRegistrationOpen?: boolean;
  onAssetRegistrationOpenChange?: (open: boolean) => void;
  selectedElementId?: string;
  selectedElementName?: string;
  selectedElementType?: string;
  selectedElementProperties?: Record<string, any>;
  assetProjectId?: string;
  assetLinkingOpen?: boolean;
  onAssetLinkingOpenChange?: (open: boolean) => void;
  linkingElementId?: string;
  linkingElementName?: string;
  linkingProjectId?: string;
  assetTransferOpen?: boolean;
  onAssetTransferOpenChange?: (open: boolean) => void;
  transferAssetId?: string;
  transferCurrentProjectId?: string;
}

export default function TopBar({ 
  currentProject, 
  showBackTo3D, 
  assetRegistrationOpen = false, 
  onAssetRegistrationOpenChange, 
  selectedElementId, 
  selectedElementName, 
  selectedElementType, 
  selectedElementProperties, 
  assetProjectId,
  assetLinkingOpen = false,
  onAssetLinkingOpenChange,
  linkingElementId,
  linkingElementName,
  linkingProjectId,
  assetTransferOpen = false,
  onAssetTransferOpenChange,
  transferAssetId,
  transferCurrentProjectId
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const { user, isLoading, refreshUser } = useAuth();
  
  // Get last viewed project from localStorage
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lastViewedProject');
      setLastProjectId(stored);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigateHome = () => {
    router.push('/');
    setMenuOpen(false);
  };
  
  const handleBackTo3D = () => {
    if (lastProjectId) {
      router.push(`/viewer/${lastProjectId}`);
    } else {
      router.push('/');
    }
    setMenuOpen(false);
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const handleWhatsNew = () => {
    setChangelogOpen(true);
    setMenuOpen(false);
  };

  const handleHelp = () => {
    setHelpOpen(true);
    setMenuOpen(false);
  };

  const handleSettings = () => {
    setSettingsOpen(true);
    setMenuOpen(false);
  };

  const handleCredits = () => {
    setCreditsOpen(true);
    setMenuOpen(false);
  };

  const handleAccountSettings = () => {
    setAccountSettingsOpen(true);
    setDropdownOpen(false);
  };

  const handleAccountUpdate = () => {
    // Refresh user data after profile update
    if (refreshUser) {
      refreshUser();
    }
  };

  const getUserName = () => {
    if (!user) return 'User';
    if (user.displayName) return user.displayName;
    return user.email || 'User';
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 1).toUpperCase();
  };

  return (
    <nav className="topbar">
      <div className="topbar-left">
        {/* Hamburger Menu */}
        <div className="menu-container" ref={menuRef}>
          <button 
            className="hamburger-button"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Menu"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="hamburger-icon"
            >
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {menuOpen && (
            <div className="hamburger-dropdown">
              {showBackTo3D && lastProjectId ? (
                <button 
                  className="dropdown-item"
                  onClick={handleBackTo3D}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back to 3D View
                </button>
              ) : (
                <button 
                  className="dropdown-item"
                  onClick={handleNavigateHome}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                  All Projects
                </button>
              )}
              <button className="dropdown-item" onClick={() => { router.push('/assets'); setMenuOpen(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Asset Inventory
              </button>
              <button className="dropdown-item" onClick={handleWhatsNew}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                What's New
              </button>
              <button className="dropdown-item" onClick={handleSettings}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"></path>
                </svg>
                Settings
              </button>
              <button className="dropdown-item" onClick={handleHelp}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Help
              </button>
              <button className="dropdown-item" onClick={() => { router.push('/docs'); setMenuOpen(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                Developer Docs
              </button>
              <button className="dropdown-item" onClick={handleCredits}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                Credits
              </button>
            </div>
          )}
        </div>

        <Link href="/" className="topbar-logo">
          <Image src="/logo-orange.png" alt="TWX" width={96} height={96} />
        </Link>

        {/* Project Info */}
        {currentProject && (
          <div className="project-info">
            <div className="project-details">
              <h2 className="project-name">{currentProject.name}</h2>
              <span className={`project-status ${currentProject.status}`}>
                {currentProject.status}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="topbar-right" ref={userRef}>
        <div 
          className="user-avatar"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={getUserName()} className="avatar-circle avatar-image" />
          ) : (
            <div className="avatar-circle">{getInitials(getUserName())}</div>
          )}
          <span className="avatar-text">{isLoading ? 'Loading...' : getUserName()}</span>
        </div>

        {dropdownOpen && (
          <div className="user-dropdown">
            <button className="dropdown-item" onClick={handleAccountSettings}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              My Account
            </button>
            <button className="dropdown-item" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--header-height);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--color-white);
          border-bottom: var(--border-width) solid var(--color-gray-200);
          padding: 0 var(--space-lg);
          z-index: 1000;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          flex: 1;
        }

        .menu-container {
          position: relative;
        }

        .hamburger-button {
          display: flex;
          align-items: center;
          padding: var(--space-sm);
          border-radius: var(--border-radius);
          color: var(--color-gray-600);
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .hamburger-button:hover {
          color: var(--color-primary);
          background: var(--color-gray-50);
        }

        .hamburger-icon {
          transition: all 0.15s ease;
        }

        .hamburger-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: var(--space-sm);
          background: var(--color-white);
          border: var(--border-width) solid var(--color-gray-200);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          min-width: 180px;
          z-index: 1001;
        }

        .topbar-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }

        .project-info {
          display: flex;
          align-items: center;
          background: var(--color-gray-50);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--border-radius-lg);
          border: var(--border-width) solid var(--color-gray-200);
          margin-left: var(--space-md);
        }

        .project-details {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .project-name {
          margin: 0;
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-gray-900);
        }

        .project-status {
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .project-status.active {
          background: var(--color-success);
          color: var(--color-white);
        }

        .project-status.pending {
          background: var(--color-warning);
          color: var(--color-white);
        }

        .topbar-right {
          position: relative;
        }

        .user-avatar {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          cursor: pointer;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--border-radius);
          transition: background 0.15s ease;
        }

        .user-avatar:hover {
          background: var(--color-gray-50);
        }

        .avatar-circle {
          width: 32px;
          height: 32px;
          background: var(--color-gray-200);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-gray-600);
        }

        .avatar-image {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-text {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-gray-700);
        }

        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: var(--space-sm);
          background: var(--color-white);
          border: var(--border-width) solid var(--color-gray-200);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          min-width: 160px;
          z-index: 1001;
        }

        .dropdown-item {
          width: 100%;
          padding: var(--space-md);
          text-align: left;
          border: none;
          background: none;
          font-size: var(--font-size-sm);
          color: var(--color-gray-700);
          cursor: pointer;
          transition: background 0.15s ease;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .dropdown-item:hover:not(:disabled) {
          background: var(--color-gray-50);
        }

        .dropdown-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dropdown-item:first-child {
          border-top-left-radius: var(--border-radius-lg);
          border-top-right-radius: var(--border-radius-lg);
        }

        .dropdown-item:last-child {
          border-bottom-left-radius: var(--border-radius-lg);
          border-bottom-right-radius: var(--border-radius-lg);
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .topbar {
            padding: 0 var(--space-md);
          }

          .topbar-left {
            gap: var(--space-md);
          }

          .project-info {
            display: none;
          }

          .avatar-text {
            display: none;
          }

          .hamburger-dropdown {
            left: 0;
            right: 0;
            min-width: auto;
          }
        }

        @media (max-width: 600px) {
          .project-details {
            flex-direction: column;
            gap: var(--space-xs);
            align-items: flex-start;
          }

          .project-name {
            font-size: var(--font-size-sm);
          }
        }
      `}</style>

      <ChangelogModal 
        isOpen={changelogOpen} 
        onClose={() => setChangelogOpen(false)} 
      />
      
      <HelpModal 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
      />
      
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
      
      <CreditsModal 
        isOpen={creditsOpen} 
        onClose={() => setCreditsOpen(false)} 
      />

      <AccountSettingsModal
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
        user={user}
        onUpdate={handleAccountUpdate}
      />

      <AssetRegistrationFloatingPanel 
        isOpen={assetRegistrationOpen}
        onClose={() => onAssetRegistrationOpenChange?.(false)}
        projectId={assetProjectId}
        selectedElementId={selectedElementId}
        selectedElementName={selectedElementName}
        selectedElementType={selectedElementType}
        selectedElementProperties={selectedElementProperties}
      />

      <AssetLinkingFloatingPanel
        isOpen={assetLinkingOpen}
        onClose={() => onAssetLinkingOpenChange?.(false)}
        projectId={linkingProjectId}
        selectedElementId={linkingElementId}
        selectedElementName={linkingElementName}
        onElementLinked={() => {
          // Refresh the inspection panel or trigger reload
          window.location.reload();
        }}
      />

      <AssetTransferFloatingPanel
        isOpen={assetTransferOpen}
        onClose={() => onAssetTransferOpenChange?.(false)}
        assetId={transferAssetId || ''}
        currentProjectId={transferCurrentProjectId || ''}
        onTransferInitiated={() => {
          // Refresh the inspection panel or trigger reload
          window.location.reload();
        }}
      />
    </nav>
  );
}