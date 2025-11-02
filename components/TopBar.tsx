"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = router.pathname;

  const isActive = (path: string) => pathname === path;

  const currentPage = () => {
    if (pathname === "/") return "Home";
    if (pathname.includes("project")) return "Project Viewer";
    return "Page";
  };

  return (
    <nav className="topbar">
      <div className="topbar-left">
        <button 
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        <Link href="/" className="topbar-logo">
          <Image src="/logo-orange.png" alt="TWX" width={48} height={48} />
        </Link>

        <div className="breadcrumb">
          <span className="breadcrumb-separator">/</span>
          <span>{currentPage()}</span>
        </div>
      </div>

      <div className={`topbar-menu ${menuOpen ? "open" : ""}`}>
        <Link 
          href="/" 
          className={`topbar-link ${isActive("/") ? "active" : ""}`}
        >
          Home
        </Link>
        <Link 
          href="/viewer/test" 
          className={`topbar-link ${isActive("/viewer/test") ? "active" : ""}`}
        >
          Project
        </Link>
      </div>

      <div className="topbar-right">
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
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--space-sm);
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .hamburger span {
          width: 20px;
          height: 2px;
          background: var(--color-gray-700);
          transition: all 0.2s ease;
        }

        .topbar-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          color: var(--color-gray-500);
          font-size: var(--font-size-sm);
        }

        .breadcrumb-separator {
          margin-right: var(--space-sm);
          color: var(--color-gray-300);
        }

        .topbar-menu {
          display: flex;
          gap: var(--space-lg);
        }

        .topbar-link {
          color: var(--color-gray-600);
          text-decoration: none;
          font-size: var(--font-size-base);
          font-weight: 500;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--border-radius);
          transition: all 0.15s ease;
        }

        .topbar-link:hover {
          color: var(--color-primary);
          background: var(--color-gray-50);
        }

        .topbar-link.active {
          color: var(--color-primary);
          background: var(--color-gray-50);
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
        }

        .dropdown-item:hover {
          background: var(--color-gray-50);
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

          .menu-toggle {
            display: block;
          }

          .breadcrumb {
            display: none;
          }

          .topbar-menu {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--color-white);
            border-bottom: var(--border-width) solid var(--color-gray-200);
            padding: var(--space-md);
            flex-direction: column;
            gap: 0;
          }

          .topbar-menu.open {
            display: flex;
          }

          .topbar-link {
            padding: var(--space-md);
            border-radius: 0;
            border-bottom: var(--border-width) solid var(--color-gray-100);
          }

          .topbar-link:last-child {
            border-bottom: none;
          }

          .avatar-text {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}