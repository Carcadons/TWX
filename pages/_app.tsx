import type { AppProps } from "next/app";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Inject global CSS variables and design system */}
      <style jsx global>{`
        /* TWX Design System - Minimal & Cohesive */
        :root {
          /* Core Colors */
          --color-primary: #ff6600;
          --color-primary-dark: #e55a00;
          --color-dark: #2a2a2a;
          --color-dark-light: #3a3a3a;
          --color-white: #ffffff;
          --color-gray-50: #f9f9f9;
          --color-gray-100: #f1f1f1;
          --color-gray-200: #e1e1e1;
          --color-gray-300: #d1d1d1;
          --color-gray-400: #a1a1a1;
          --color-gray-500: #717171;
          --color-gray-600: #515151;
          --color-gray-700: #414141;
          --color-gray-800: #313131;
          --color-gray-900: #212121;

          /* Status Colors */
          --color-success: #22c55e;
          --color-success-dark: #16a34a;
          --color-warning: #f59e0b;
          --color-warning-dark: #d97706;
          --color-error: #ef4444;
          --color-error-dark: #dc2626;

          /* Spacing */
          --space-xs: 0.25rem;
          --space-sm: 0.5rem;
          --space-md: 1rem;
          --space-lg: 1.5rem;
          --space-xl: 2rem;
          --space-2xl: 3rem;

          /* Typography */
          --font-size-xs: 0.75rem;
          --font-size-sm: 0.875rem;
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.25rem;
          --font-size-2xl: 1.5rem;
          --font-size-3xl: 2rem;

          /* Borders */
          --border-radius: 8px;
          --border-radius-lg: 12px;
          --border-width: 1px;

          /* Shadows */
          --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
          --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.15);

          /* Layout */
          --header-height: 64px;
        }

        /* Reset */
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background: var(--color-white);
          color: var(--color-gray-900);
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-size: var(--font-size-base);
        }

        h1, h2, h3, h4, h5, h6, p, ul, ol, li {
          margin: 0;
          padding: 0;
        }

        ul, ol {
          list-style: none;
        }

        button {
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          margin: 0;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
        }

        input, select, textarea {
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          margin: 0;
          border: none;
          background: none;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        img {
          max-width: 100%;
          height: auto;
        }

        /* Focus styles */
        *:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* Next.js app wrapper */
        #__next {
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        /* Component Base Classes */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-md) var(--space-lg);
          font-size: var(--font-size-base);
          font-weight: 500;
          border-radius: var(--border-radius);
          border: var(--border-width) solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          white-space: nowrap;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: var(--color-primary);
          color: var(--color-white);
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }

        .btn-secondary {
          background: var(--color-gray-200);
          color: var(--color-gray-900);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--color-gray-300);
        }

        .btn-success {
          background: var(--color-success);
          color: var(--color-white);
        }

        .btn-success:hover:not(:disabled) {
          background: var(--color-success-dark);
        }

        .btn-error {
          background: var(--color-error);
          color: var(--color-white);
        }

        .btn-error:hover:not(:disabled) {
          background: var(--color-error-dark);
        }

        .btn-sm {
          padding: var(--space-sm) var(--space-md);
          font-size: var(--font-size-sm);
        }

        /* Cards */
        .card {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          border: var(--border-width) solid var(--color-gray-200);
          box-shadow: var(--shadow-sm);
        }

        .card-header {
          padding: var(--space-lg);
          border-bottom: var(--border-width) solid var(--color-gray-200);
        }

        .card-body {
          padding: var(--space-lg);
        }

        .card-footer {
          padding: var(--space-lg);
          border-top: var(--border-width) solid var(--color-gray-200);
          background: var(--color-gray-50);
        }

        /* Forms */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .form-label {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-gray-700);
        }

        .form-input,
        .form-select,
        .form-textarea {
          padding: var(--space-md);
          border: var(--border-width) solid var(--color-gray-300);
          border-radius: var(--border-radius);
          font-size: var(--font-size-base);
          background: var(--color-white);
          transition: border-color 0.15s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .form-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right var(--space-md) center;
          background-repeat: no-repeat;
          background-size: 1rem;
          padding-right: 3rem;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          :root {
            --font-size-base: 0.875rem;
            --space-md: 0.75rem;
            --space-lg: 1rem;
            --space-xl: 1.5rem;
          }

          body {
            font-size: 16px; /* Prevent zoom on iOS */
          }
        }
      `}</style>

      <Component {...pageProps} />
    </>
  );
}