"use client";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>How to Use TWX</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <section className="help-section">
            <h3>📂 Getting Started</h3>
            <ol>
              <li><strong>Sign In:</strong> Click "Sign In to Continue" on the landing page and authenticate with Google, GitHub, X, Apple, or email</li>
              <li><strong>Select a Project:</strong> From the home page, choose a project from the available list to open the 3D viewer</li>
            </ol>
          </section>

          <section className="help-section">
            <h3>🎯 Viewing 3D Models</h3>
            <ul>
              <li><strong>Navigate:</strong> Use your mouse to rotate (click + drag), pan (right-click + drag), and zoom (scroll wheel) around the model</li>
              <li><strong>Select Elements:</strong> Click on any structural element in the 3D viewer to select it</li>
              <li><strong>View Details:</strong> Selected elements will display their properties and any existing inspection data</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>📝 Recording Inspections</h3>
            <ol>
              <li><strong>Select an Element:</strong> Click on a temporary works element in the 3D model</li>
              <li><strong>Open Inspection Form:</strong> The inspection panel will appear on the right side of the screen</li>
              <li><strong>Fill in Details:</strong> Complete the inspection form with:
                <ul className="sub-list">
                  <li>Inspector name and date</li>
                  <li>Status (e.g., OK, Requires Attention, Failed)</li>
                  <li>Technical requirements and loading criteria</li>
                  <li>Location and environmental conditions</li>
                  <li>Planning dates and commercial information</li>
                  <li>Quality checks and compliance notes</li>
                </ul>
              </li>
              <li><strong>Save:</strong> Click "Save Inspection" to record your findings</li>
              <li><strong>User Tracking:</strong> Your user ID is automatically recorded when you create or update inspections for audit purposes</li>
            </ol>
          </section>

          <section className="help-section">
            <h3>🔍 Finding Inspections</h3>
            <ul>
              <li><strong>Element Selection:</strong> Click any element in the 3D viewer to see its inspection history</li>
              <li><strong>Inspection History:</strong> View previous inspections including who created/modified them and when</li>
              <li><strong>Version Tracking:</strong> All updates are versioned so you can track changes over time</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>📊 Understanding the Interface</h3>
            <ul>
              <li><strong>Top Bar:</strong>
                <ul className="sub-list">
                  <li>Hamburger menu (☰) - Navigate to all projects, settings, or help</li>
                  <li>TWX logo - Click to return to the home page</li>
                  <li>Project name - Shows the currently open project</li>
                  <li>User avatar - Access account settings, changelog, or logout</li>
                </ul>
              </li>
              <li><strong>3D Viewer:</strong> Central area displaying the BIM model loaded from Speckle</li>
              <li><strong>Inspection Panel:</strong> Right sidebar showing inspection form or details</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>💡 Tips & Best Practices</h3>
            <ul>
              <li><strong>Regular Inspections:</strong> Record inspections regularly to maintain a complete audit trail</li>
              <li><strong>Detailed Notes:</strong> Add comprehensive notes in the inspection form for future reference</li>
              <li><strong>Status Updates:</strong> Keep status fields up-to-date to reflect current conditions</li>
              <li><strong>Document Everything:</strong> Use all available fields to capture technical requirements, material certificates, and test results</li>
              <li><strong>Review History:</strong> Check previous inspections before creating new ones to track changes over time</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>🔒 Data & Security</h3>
            <ul>
              <li>All inspection data is securely stored in PostgreSQL database</li>
              <li>Your user identity is automatically tracked with each inspection</li>
              <li>Inspection records are versioned to provide complete audit trails</li>
              <li>Authentication is managed through secure Replit Auth</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>❓ Need More Help?</h3>
            <p>
              If you encounter any issues or have questions about using TWX:
            </p>
            <ul>
              <li>Check the "What's New" section in your user menu for recent updates</li>
              <li>Ensure you're logged in to access all features</li>
              <li>Contact your system administrator for technical support</li>
            </ul>
          </section>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          padding: var(--space-lg);
          overflow-y: auto;
        }

        .modal-content {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
          margin: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-xl);
          border-bottom: var(--border-width) solid var(--color-gray-200);
          position: sticky;
          top: 0;
          background: var(--color-white);
          z-index: 10;
          border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: var(--font-size-2xl);
          color: var(--color-gray-900);
          font-weight: 700;
        }

        .close-button {
          background: none;
          border: none;
          color: var(--color-gray-500);
          cursor: pointer;
          padding: var(--space-sm);
          border-radius: var(--border-radius);
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: var(--color-gray-100);
          color: var(--color-gray-700);
        }

        .modal-body {
          padding: var(--space-xl);
        }

        .help-section {
          margin-bottom: var(--space-2xl);
        }

        .help-section:last-child {
          margin-bottom: 0;
        }

        .help-section h3 {
          font-size: var(--font-size-xl);
          color: var(--color-gray-900);
          margin: 0 0 var(--space-md) 0;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .help-section ol,
        .help-section ul {
          margin: 0;
          padding-left: var(--space-xl);
          color: var(--color-gray-700);
          line-height: 1.7;
        }

        .help-section li {
          margin-bottom: var(--space-md);
        }

        .help-section li:last-child {
          margin-bottom: 0;
        }

        .help-section strong {
          color: var(--color-gray-900);
          font-weight: 600;
        }

        .sub-list {
          margin-top: var(--space-sm);
          padding-left: var(--space-lg);
        }

        .sub-list li {
          margin-bottom: var(--space-sm);
          font-size: var(--font-size-sm);
        }

        .help-section p {
          color: var(--color-gray-700);
          line-height: 1.7;
          margin: 0 0 var(--space-md) 0;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 0;
          }

          .modal-content {
            max-height: 100vh;
            border-radius: 0;
          }

          .modal-header {
            padding: var(--space-lg);
            border-radius: 0;
          }

          .modal-header h2 {
            font-size: var(--font-size-xl);
          }

          .modal-body {
            padding: var(--space-lg);
          }

          .help-section h3 {
            font-size: var(--font-size-lg);
          }
        }
      `}</style>
    </div>
  );
}
