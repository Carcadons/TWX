"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

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
}

export default function TopBar({ currentProject }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

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
              <button className="dropdown-item" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"></path>
                </svg>
                Settings
              </button>
              <button className="dropdown-item" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
                Help
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
          <div className="avatar-circle">U</div>
          <span className="avatar-text">User</span>
        </div>

        {dropdownOpen && (
          <div className="user-dropdown">
            <button className="dropdown-item">My Account</button>
            <button className="dropdown-item">Logout</button>
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
    </nav>
  );
}