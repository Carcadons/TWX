import { useRouter } from "next/router";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Project {
  id: string;
  name: string;
  status: string;
  speckleUrl?: string;
  createdAt?: string;
  lastModified?: string;
}

function LandingPage() {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <div className="logo-section">
            <Image src="/logo-orange.png" alt="TWX" width={160} height={160} />
          </div>
          <h1 className="landing-title">Digital Temporary Works Inspection</h1>
          <p className="landing-description">
            Streamline your BIM element inspections with our integrated Speckle viewer
          </p>
        </div>

        <div className="landing-actions">
          <a href="/auth" className="btn btn-primary btn-large">
            Sign In to Continue
          </a>
          <p className="landing-note">
            Sign in with your email and password to get started
          </p>
        </div>
      </div>

      <style jsx>{`
        .home-container {
          width: 100%;
          min-height: 100vh;
          background: var(--color-dark);
          color: var(--color-white);
          padding: var(--space-2xl) var(--space-xl);
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .home-content {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-2xl);
          text-align: center;
        }

        .home-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-lg);
        }

        .logo-section {
          margin-bottom: var(--space-md);
        }

        .landing-title {
          font-size: var(--font-size-3xl);
          font-weight: 700;
          color: var(--color-white);
          margin: 0;
          line-height: 1.2;
        }

        .landing-description {
          font-size: var(--font-size-lg);
          color: var(--color-gray-400);
          margin: 0;
          line-height: 1.6;
        }

        .landing-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          margin-top: var(--space-xl);
        }

        .btn-large {
          padding: var(--space-lg) var(--space-2xl);
          font-size: var(--font-size-lg);
          width: 100%;
          max-width: 300px;
        }

        .landing-note {
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
          margin: 0;
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load projects from API
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      const result = await response.json();

      if (result.success) {
        setProjects(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load projects');
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Clear error when user starts typing
  useEffect(() => {
    if (error && (newProjectName || newProjectUrl)) {
      setError(null);
    }
  }, [newProjectName, newProjectUrl, error]);

  // Create a memoized handler for project navigation
  const handleProjectClick = useCallback((projectId: string) => {
    console.log('Navigating to project ID:', projectId);
    router.push(`/viewer/${projectId}`);
  }, [router]);

  // Create a memoized handler for delete modal
  const handleDeleteClick = useCallback((project: {id: string, name: string}) => {
    console.log('Opening delete modal for project:', project);
    setProjectToDelete(project);
    setDeleteModalOpen(true);
    setDeleteConfirmText("");
  }, []);

  // Create new project function
  const createProject = async () => {
    if (!newProjectName.trim()) {
      setError('Project name is required');
      return;
    }

    if (!newProjectUrl.trim()) {
      setError('Speckle project URL is required');
      return;
    }

    if (!newProjectUrl.includes('speckle.systems/projects/')) {
      setError('Please enter a valid Speckle project URL (e.g., https://app.speckle.systems/projects/...)');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName.trim(),
          speckleUrl: newProjectUrl.trim(),
          status: 'active'
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setProjects(prevProjects => [...prevProjects, result.data]);
        setNewProjectName("");
        setNewProjectUrl("");
        console.log('✅ New project created:', result.data);
        router.push(`/viewer/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch (err) {
      console.error('❌ Failed to create project:', err);
      setError('Failed to connect to server');
    } finally {
      setIsCreating(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setProjectToDelete(null);
    setDeleteConfirmText("");
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText === "DELETE" && projectToDelete) {
      try {
        const response = await fetch(`/api/projects?id=${projectToDelete.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          setProjects(prevProjects => 
            prevProjects.filter(project => project.id !== projectToDelete.id)
          );
          console.log(`Deleted project ${projectToDelete.id}: ${projectToDelete.name}`);
          closeDeleteModal();
        } else {
          console.error('Failed to delete project:', result.error);
          setError(result.error || 'Failed to delete project');
        }
      } catch (err) {
        console.error('Failed to delete project:', err);
        setError('Failed to connect to server');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="home-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Header */}
        <div className="home-header">
          <div className="header-top">
            <div className="user-info">
              {user?.profileImageUrl && (
                <img src={user.profileImageUrl} alt="Profile" className="user-avatar" />
              )}
              <span className="user-name">
                {user?.firstName || user?.email || 'User'}
              </span>
            </div>
            <a href="/api/logout" className="btn btn-secondary btn-sm">
              Sign Out
            </a>
          </div>
          <div className="logo-section">
            <Image src="/logo-orange.png" alt="TWX" width={160} height={160} />
          </div>
          <p className="app-description">
            Digital Temporary Works Inspection
          </p>
        </div>

        {/* Project Selection */}
        <div className="project-section">
          <h2 className="section-title">Select a project</h2>

          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
              <button onClick={loadProjects} className="btn btn-sm btn-secondary">
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading projects...</p>
            </div>
          ) : (
            <div className="project-list">
              {projects.map((project) => (
                <div key={`project-${project.id}`} className="project-item-wrapper">
                  <button
                    onClick={() => handleProjectClick(project.id)}
                    className="project-item"
                    data-project-id={project.id}
                  >
                    <div className="project-info">
                      <span className="project-name">{project.name}</span>
                      <span className={`project-status ${project.status}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="project-arrow">→</div>
                  </button>

                  <div className="project-actions">
                    <button
                      onClick={() => handleDeleteClick({id: project.id, name: project.name})}
                      className="delete-button"
                      title="Delete project"
                      data-project-id={project.id}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {!loading && projects.length === 0 && (
                <div className="empty-state">
                  <p>No projects found. Create your first project below!</p>
                </div>
              )}
            </div>
          )}

          {/* New Project Section */}
          <div className="new-project-section">
            <h3 className="new-project-title">New project</h3>

            <div className="project-setup">
              <div className="setup-form">
                {error && (
                  <div className="form-error">
                    <p>⚠️ {error}</p>
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Speckle Project URL</label>
                  <input
                    type="text"
                    placeholder="https://app.speckle.systems/projects/..."
                    className={`speckle-input ${error && !newProjectUrl.trim() ? 'input-error' : ''}`}
                    value={newProjectUrl}
                    onChange={(e) => setNewProjectUrl(e.target.value)}
                    disabled={isCreating}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Project Name</label>
                  <input
                    type="text"
                    placeholder="Enter project name"
                    className={`project-input ${error && !newProjectName.trim() ? 'input-error' : ''}`}
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    disabled={isCreating}
                  />
                </div>

                <button 
                  className="btn btn-primary setup-button"
                  onClick={createProject}
                  disabled={isCreating || !newProjectName.trim() || !newProjectUrl.trim()}
                >
                  {isCreating ? (
                    <>
                      <div className="button-spinner"></div>
                      Creating Project...
                    </>
                  ) : (
                    'Setup Project'
                  )}
                </button>
              </div>

              <div className="setup-info">
                <div className="info-title">How it works:</div>
                <div className="info-steps">
                  <div className="info-step">1. Paste your Speckle project URL</div>
                  <div className="info-step">2. Give your project a name</div>
                  <div className="info-step">3. Start inspecting BIM elements</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteModalOpen && projectToDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Project</h3>
              <button onClick={closeDeleteModal} className="modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>

              <p className="warning-text">
                Are you sure you want to delete <strong>"{projectToDelete.name}"</strong>?
              </p>

              <p className="warning-subtext">
                This action cannot be undone. All inspection data and project settings will be permanently deleted.
              </p>

              <div className="confirmation-input">
                <label htmlFor="delete-confirm">
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="delete-input"
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeDeleteModal} className="btn btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleDeleteProject}
                disabled={deleteConfirmText !== "DELETE"}
                className="btn btn-error"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .header-top {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-name {
          font-size: var(--font-size-sm);
          color: var(--color-gray-300);
          font-weight: 500;
        }

        .btn-sm {
          padding: var(--space-sm) var(--space-md);
          font-size: var(--font-size-sm);
        }

        .home-container {
          width: 100%;
          min-height: 100vh;
          background: var(--color-dark);
          color: var(--color-white);
          padding: var(--space-2xl) var(--space-xl);
          box-sizing: border-box;
        }

        .home-content {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-2xl);
        }

        .home-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-lg);
          margin-bottom: var(--space-lg);
        }

        .app-description {
          font-size: var(--font-size-lg);
          color: var(--color-gray-400);
          margin: 0;
          line-height: 1.6;
          font-weight: 500;
        }

        .project-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .section-title {
          font-size: var(--font-size-2xl);
          font-weight: 600;
          color: var(--color-white);
          margin: 0;
        }

        .project-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .project-item-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .project-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-lg);
          background: var(--color-gray-800);
          border: var(--border-width) solid var(--color-gray-700);
          border-radius: var(--border-radius-lg);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          flex: 1;
        }

        .project-item:hover:not(:disabled) {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
        }

        .project-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
          flex: 1;
        }

        .project-name {
          font-size: var(--font-size-base);
          font-weight: 500;
          color: var(--color-white);
        }

        .project-status {
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }

        .project-status.active {
          background: var(--color-success);
          color: var(--color-white);
        }

        .project-status.pending {
          background: var(--color-warning);
          color: var(--color-white);
        }

        .project-arrow {
          font-size: var(--font-size-lg);
          color: var(--color-gray-500);
          transition: transform 0.15s ease;
        }

        .project-item:hover .project-arrow {
          transform: translateX(4px);
          color: var(--color-gray-400);
        }

        .project-actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          min-height: 32px;
        }

        .delete-button {
          padding: var(--space-sm);
          background: transparent;
          border: none;
          color: var(--color-gray-500);
          cursor: pointer;
          border-radius: var(--border-radius);
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-button:hover {
          background: var(--color-error);
          color: var(--color-white);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-2xl);
          color: var(--color-gray-400);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-gray-700);
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .error-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-lg);
          background: var(--color-gray-800);
          border: var(--border-width) solid var(--color-error);
          border-radius: var(--border-radius-lg);
          margin-bottom: var(--space-lg);
        }

        .error-message p {
          color: var(--color-error);
          margin: 0;
          text-align: center;
        }

        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
          color: var(--color-gray-500);
          background: var(--color-gray-800);
          border: 2px dashed var(--color-gray-700);
          border-radius: var(--border-radius-lg);
        }

        .empty-state p {
          margin: 0;
        }

        .new-project-section {
          margin-top: var(--space-xl);
          padding-top: var(--space-xl);
          border-top: var(--border-width) solid var(--color-gray-700);
        }

        .new-project-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-white);
          margin: 0 0 var(--space-lg) 0;
        }

        .project-setup {
          background: var(--color-gray-800);
          border: var(--border-width) solid var(--color-gray-700);
          border-radius: var(--border-radius-lg);
          padding: var(--space-xl);
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .setup-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .form-error {
          padding: var(--space-md);
          background: var(--color-gray-700);
          border: var(--border-width) solid var(--color-error);
          border-radius: var(--border-radius);
          margin-bottom: var(--space-md);
        }

        .form-error p {
          color: var(--color-error);
          margin: 0;
          font-size: var(--font-size-sm);
          text-align: center;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .input-label {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-gray-300);
        }

        .speckle-input,
        .project-input {
          padding: var(--space-md);
          border: var(--border-width) solid var(--color-gray-600);
          border-radius: var(--border-radius);
          background: var(--color-gray-700);
          color: var(--color-white);
          font-size: var(--font-size-base);
          transition: border-color 0.15s ease;
        }

        .speckle-input:focus,
        .project-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .speckle-input:disabled,
        .project-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .input-error {
          border-color: var(--color-error) !important;
        }

        .input-error:focus {
          border-color: var(--color-error) !important;
        }

        .speckle-input::placeholder,
        .project-input::placeholder {
          color: var(--color-gray-400);
        }

        .setup-button {
          width: 100%;
          justify-content: center;
          padding: var(--space-lg);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .setup-info {
          padding: var(--space-lg);
          background: var(--color-gray-700);
          border-radius: var(--border-radius);
        }

        .info-title {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-white);
          margin-bottom: var(--space-md);
        }

        .info-steps {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .info-step {
          font-size: var(--font-size-sm);
          color: var(--color-gray-300);
          padding-left: var(--space-md);
          position: relative;
        }

        .info-step::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 4px;
          background: var(--color-primary);
          border-radius: 50%;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-lg);
        }

        .modal-content {
          background: var(--color-white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: var(--border-width) solid var(--color-gray-200);
        }

        .modal-header h3 {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-gray-900);
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--color-gray-500);
          cursor: pointer;
          padding: var(--space-xs);
          border-radius: var(--border-radius);
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          background: var(--color-gray-100);
          color: var(--color-gray-700);
        }

        .modal-body {
          padding: var(--space-lg);
          text-align: center;
        }

        .warning-icon {
          color: var(--color-warning);
          margin-bottom: var(--space-lg);
        }

        .warning-text {
          font-size: var(--font-size-base);
          color: var(--color-gray-900);
          margin-bottom: var(--space-md);
          line-height: 1.5;
        }

        .warning-subtext {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          margin-bottom: var(--space-xl);
          line-height: 1.5;
        }

        .confirmation-input {
          text-align: left;
          margin-bottom: var(--space-lg);
        }

        .confirmation-input label {
          display: block;
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-gray-700);
          margin-bottom: var(--space-sm);
        }

        .delete-input {
          width: 100%;
          padding: var(--space-md);
          border: 2px solid var(--color-gray-300);
          border-radius: var(--border-radius);
          font-size: var(--font-size-base);
          background: var(--color-white);
          color: var(--color-gray-900);
          transition: border-color 0.15s ease;
        }

        .delete-input:focus {
          outline: none;
          border-color: var(--color-error);
        }

        .delete-input::placeholder {
          color: var(--color-gray-400);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-sm);
          padding: var(--space-lg);
          border-top: var(--border-width) solid var(--color-gray-200);
          background: var(--color-gray-50);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .home-container {
            padding: var(--space-md);
            padding-top: var(--space-2xl);
          }

          .home-content {
            max-width: none;
            gap: var(--space-xl);
          }

          .section-title {
            font-size: var(--font-size-xl);
          }

          .project-item {
            padding: var(--space-md);
          }

          .project-item-wrapper {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-xs);
          }

          .project-actions {
            justify-content: flex-end;
            padding: 0 var(--space-sm);
          }

          .modal-overlay {
            padding: var(--space-md);
          }

          .modal-content {
            max-height: 95vh;
          }

          .project-setup {
            padding: var(--space-lg);
          }

          .setup-form {
            gap: var(--space-md);
          }

          .setup-info {
            padding: var(--space-md);
          }
        }
      `}</style>
    </div>
  );
}