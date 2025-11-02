"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import TopBar from "../../components/TopBar";

const ViewerWrapper = dynamic(() => import("../../app/viewer/ViewerWrapper"), { 
  ssr: false,
  loading: () => (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p>Loading viewer...</p>
      </div>
    </div>
  )
});

export default function ProjectPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="page-container">
        <TopBar />
        <main className="page-main">
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        </main>

        <style jsx>{`
          .page-container {
            height: 100vh;
            width: 100vw;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .page-main {
            flex: 1;
            margin-top: var(--header-height);
            position: relative;
          }

          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: var(--color-gray-50);
          }

          .loading-content {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-lg);
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--color-gray-200);
            border-top: 3px solid var(--color-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .loading-content p {
            font-size: var(--font-size-base);
            color: var(--color-gray-600);
            margin: 0;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      <TopBar />
      <main className="page-main">
        <ViewerWrapper />
      </main>

      <style jsx>{`
        .page-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .page-main {
          flex: 1;
          margin-top: var(--header-height);
          position: relative;
        }
      `}</style>
    </div>
  );
}