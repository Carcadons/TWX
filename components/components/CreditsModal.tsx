"use client";

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Credits & Acknowledgments</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <section className="credits-section">
            <h3>Academic Research</h3>
            <p className="intro-text">
              TWX (Digital Temporary Works Inspection) is part of academic research focused on 
              advancing digital construction management and Building Information Modeling (BIM) technologies.
            </p>
          </section>

          <section className="credits-section">
            <h3>Research Programme</h3>
            <div className="research-info">
              <p>
                This application is developed as part of <strong>Francesco Tizzani's PhD research</strong> 
                at the National University of Singapore (NUS), in collaboration with ETH Zürich's 
                Future Cities Laboratory (FCL) programme, specifically within the <strong>Circular 
                Future Cities (CFC)</strong> research group.
              </p>
            </div>
          </section>

          <section className="credits-section">
            <h3>Academic Institutions</h3>
            
            <div className="institution-grid">
              <a 
                href="https://cde.nus.edu.sg/arch/programmes/maarchbyresearch-phdbyresearch/meet-our-research-students/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="institution-card"
              >
                <div className="institution-logo">
                  <img 
                    src="https://www.nus.edu.sg/images/default-source/base/logo.png" 
                    alt="National University of Singapore"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <div className="logo-fallback" style={{ display: 'none' }}>NUS</div>
                </div>
                <div className="institution-info">
                  <h4>National University of Singapore</h4>
                  <p>Leading global university driving research and education</p>
                </div>
              </a>

              <a 
                href="https://ethz.ch/en.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="institution-card"
              >
                <div className="institution-logo">
                  <img 
                    src="https://ethz.ch/etc/designs/ethz/img/header/ethz_logo_black.svg" 
                    alt="ETH Zürich"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <div className="logo-fallback" style={{ display: 'none' }}>ETH</div>
                </div>
                <div className="institution-info">
                  <h4>ETH Zürich</h4>
                  <p>Swiss Federal Institute of Technology in Zürich</p>
                </div>
              </a>

              <a 
                href="https://sec.ethz.ch/research/fcl.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="institution-card"
              >
                <div className="institution-logo">
                  <div className="logo-fallback">FCL</div>
                </div>
                <div className="institution-info">
                  <h4>Future Cities Laboratory (FCL)</h4>
                  <p>ETH Zürich research programme for sustainable urban futures</p>
                </div>
              </a>

              <a 
                href="https://fcl.ethz.ch/research/cycles-and-districts/circular-future-cities.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="institution-card"
              >
                <div className="institution-logo">
                  <div className="logo-fallback">CFC</div>
                </div>
                <div className="institution-info">
                  <h4>Circular Future Cities (CFC)</h4>
                  <p>Research group focused on circular economy and sustainable urban development</p>
                </div>
              </a>
            </div>
          </section>

          <section className="credits-section">
            <h3>Industry Partnership</h3>
            <div className="partnership-info">
              <a 
                href="https://www.leightonasia.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="partnership-card"
              >
                <div className="partnership-logo">
                  <img 
                    src="https://www.leightonasia.com/wp-content/uploads/2023/03/Leighton-Logo.png" 
                    alt="Leighton Asia"
                    className="partnership-logo-img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="logo-fallback partnership-fallback" style={{ display: 'none' }}>
                    Leighton<br/>Asia
                  </div>
                </div>
                <div className="partnership-details">
                  <h4>Leighton Asia</h4>
                  <p className="role-info">
                    Francesco Tizzani holds the position of <strong>Group Manager of Information Systems & Digital</strong> at Leighton Asia.
                  </p>
                  <p className="contribution-info">
                    Leighton Asia is providing real case projects to test the research approach and the inspection 
                    application, enabling practical validation of digital construction management methodologies in 
                    live construction environments.
                  </p>
                </div>
              </a>
            </div>
          </section>

          <section className="credits-section">
            <h3>Technology & Platform</h3>
            <p>
              Built with modern web technologies including Next.js, React, TypeScript, and PostgreSQL. 
              3D visualization powered by <a href="https://speckle.systems" target="_blank" rel="noopener noreferrer">Speckle</a>, 
              an open-source platform for BIM and AEC data.
            </p>
          </section>

          <section className="credits-section footer-section">
            <p className="copyright">
              © {new Date().getFullYear()} Francesco Tizzani - All rights reserved
            </p>
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
          max-width: 900px;
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

        .credits-section {
          margin-bottom: var(--space-2xl);
        }

        .credits-section:last-child {
          margin-bottom: 0;
        }

        .credits-section h3 {
          font-size: var(--font-size-xl);
          color: var(--color-gray-900);
          margin: 0 0 var(--space-md) 0;
          font-weight: 600;
        }

        .intro-text {
          color: var(--color-gray-700);
          line-height: 1.7;
          margin: 0;
          font-size: var(--font-size-base);
        }

        .research-info {
          background: var(--color-gray-50);
          padding: var(--space-lg);
          border-radius: var(--border-radius);
          border-left: 4px solid var(--color-primary);
        }

        .research-info p {
          margin: 0;
          color: var(--color-gray-700);
          line-height: 1.7;
        }

        .institution-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-lg);
          margin-top: var(--space-lg);
        }

        .institution-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-xl);
          background: var(--color-white);
          border: var(--border-width) solid var(--color-gray-200);
          border-radius: var(--border-radius-lg);
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .institution-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .institution-logo {
          width: 100%;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-md);
        }

        .institution-logo img {
          max-width: 120px;
          max-height: 80px;
          object-fit: contain;
        }

        .logo-fallback {
          width: 80px;
          height: 80px;
          background: var(--color-gray-100);
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-2xl);
          font-weight: 700;
          color: var(--color-gray-600);
        }

        .institution-info {
          text-align: center;
        }

        .institution-info h4 {
          margin: 0 0 var(--space-xs) 0;
          font-size: var(--font-size-base);
          color: var(--color-gray-900);
          font-weight: 600;
        }

        .institution-info p {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          line-height: 1.5;
        }

        .credits-section p {
          color: var(--color-gray-700);
          line-height: 1.7;
          margin: 0;
        }

        .credits-section a {
          color: var(--color-primary);
          text-decoration: none;
          font-weight: 500;
        }

        .credits-section a:hover {
          text-decoration: underline;
        }

        .footer-section {
          padding-top: var(--space-lg);
          border-top: var(--border-width) solid var(--color-gray-200);
        }

        .copyright {
          text-align: center;
          color: var(--color-gray-600);
          font-size: var(--font-size-sm);
        }

        .partnership-info {
          margin-top: var(--space-lg);
        }

        .partnership-card {
          display: flex;
          align-items: flex-start;
          gap: var(--space-xl);
          padding: var(--space-xl);
          background: var(--color-gray-50);
          border: var(--border-width) solid var(--color-gray-200);
          border-radius: var(--border-radius-lg);
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .partnership-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-md);
          background: var(--color-white);
        }

        .partnership-logo {
          flex-shrink: 0;
          width: 120px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .partnership-logo-img {
          max-width: 150px;
          max-height: 80px;
          object-fit: contain;
        }

        .partnership-logo .logo-fallback {
          width: 100px;
          height: 100px;
          background: var(--color-primary);
          border-radius: var(--border-radius);
          display: none;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-sm);
          font-weight: 700;
          color: var(--color-white);
          text-align: center;
          padding: var(--space-sm);
          line-height: 1.3;
        }

        .partnership-fallback {
          background: linear-gradient(135deg, #003087 0%, #0055B8 100%);
        }

        .partnership-details {
          flex: 1;
        }

        .partnership-details h4 {
          margin: 0 0 var(--space-md) 0;
          font-size: var(--font-size-xl);
          color: var(--color-gray-900);
          font-weight: 600;
        }

        .role-info {
          margin: 0 0 var(--space-md) 0;
          color: var(--color-gray-700);
          line-height: 1.6;
          font-size: var(--font-size-base);
        }

        .contribution-info {
          margin: 0;
          color: var(--color-gray-600);
          line-height: 1.7;
          font-size: var(--font-size-sm);
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

          .institution-grid {
            grid-template-columns: 1fr;
          }

          .partnership-card {
            flex-direction: column;
            text-align: center;
          }

          .partnership-logo {
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
