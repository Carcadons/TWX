import { useRouter } from "next/router";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  const projects = [
    { id: "123", name: "Project 123", status: "active" },
    { id: "124", name: "Building Complex A", status: "active" },
    { id: "125", name: "Infrastructure Project", status: "pending" },
  ];

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Header */}
        <div className="home-header">
          <div className="logo-section">
            <Image src="/logo-orange.png" alt="TWX" width={80} height={80} />
            <h1 className="app-title">TWX</h1>
          </div>
          <p className="app-description">
            Temporary Works Inspection for BIM Elements
          </p>
        </div>

        {/* Project Selection */}
        <div className="project-section">
          <h2 className="section-title">Select a project</h2>

          <div className="project-list">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => router.push(`/viewer/${project.id}`)}
                className="project-item"
              >
                <div className="project-info">
                  <span className="project-name">{project.name}</span>
                  <span className={`project-status ${project.status}`}>
                    {project.status}
                  </span>
                </div>
                <div className="project-arrow">→</div>
              </button>
            ))}
          </div>

          {/* New Project Section */}
          <div className="new-project-section">
            <h3 className="new-project-title">New project</h3>

            <div className="project-setup">
              <div className="setup-form">
                <div className="input-group">
                  <label className="input-label">Speckle Project URL</label>
                  <input
                    type="text"
                    placeholder="https://app.speckle.systems/projects/..."
                    className="speckle-input"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Project Name</label>
                  <input
                    type="text"
                    placeholder="Enter project name"
                    className="project-input"
                  />
                </div>

                <button 
                  className="btn btn-primary setup-button"
                  onClick={() => {/* Handle project setup */}}
                >
                  Setup Project
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

      <style jsx>{`
        .home-container {
          min-height: 100vh;
          background: var(--color-dark);
          color: var(--color-white);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl);
        }

        .home-content {
          width: 100%;
          max-width: 480px;
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

        .app-title {
          font-size: var(--font-size-3xl);
          font-weight: 700;
          color: var(--color-white);
          margin: 0;
        }

        .app-description {
          font-size: var(--font-size-lg);
          color: var(--color-gray-400);
          margin: 0;
          line-height: 1.6;
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
          width: 100%;
        }

        .project-item:hover {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
        }

        .project-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
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

        .speckle-input::placeholder,
        .project-input::placeholder {
          color: var(--color-gray-400);
        }

        .setup-button {
          width: 100%;
          justify-content: center;
          padding: var(--space-lg);
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

        /* Mobile Styles */
        @media (max-width: 768px) {
          .home-container {
            padding: var(--space-md);
            align-items: flex-start;
            padding-top: var(--space-2xl);
          }

          .home-content {
            max-width: none;
            gap: var(--space-xl);
          }

          .app-title {
            font-size: var(--font-size-2xl);
          }

          .app-description {
            font-size: var(--font-size-base);
          }

          .section-title {
            font-size: var(--font-size-xl);
          }

          .project-item {
            padding: var(--space-md);
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