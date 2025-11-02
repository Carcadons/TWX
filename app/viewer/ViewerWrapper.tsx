"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const ViewerCore = dynamic(() => import("./ViewerCore"), { 
  ssr: false,
  loading: () => (
    <div className="wrapper-loading">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p>Initializing 3D viewer...</p>
      </div>

      <style jsx>{`
        .wrapper-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: var(--color-white);
        }

        .loading-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-lg);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
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
  )
});

export default function ViewerWrapper() {
  const router = useRouter();
  const { project: projectId } = router.query;

  // Show loading while router is not ready
  if (!router.isReady) {
    return (
      <div className="wrapper-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>

        <style jsx>{`
          .wrapper-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: var(--color-white);
          }

          .loading-content {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-lg);
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
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

  return <ViewerCore projectId={projectId as string} />;
}