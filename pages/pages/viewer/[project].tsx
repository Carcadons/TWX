"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import TopBar from "../../components/TopBar";
import InspectionPanel from "../../components/InspectionPanel";

interface Project {
  id: string;
  name: string;
  status: string;
  speckleUrl?: string;
  createdAt?: string;
  lastModified?: string;
}

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

interface SelectedElement {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

export default function ProjectPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);
  const router = useRouter();
  const { project: projectId } = router.query;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load project data
  const loadProject = async (id: string) => {
    try {
      console.log(`🔄 Loading project data for page: ${id}`);

      const response = await fetch(`/api/projects?id=${id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setCurrentProject(result.data);
        console.log(`✅ Loaded project for page:`, result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Project not found');
      }
    } catch (error) {
      console.error(`❌ Failed to load project ${id}:`, error);
      setCurrentProject(null);
      // Optionally redirect to home page on error
      // router.push('/');
    } finally {
      setLoading(false);
    }
  };

  // Load project when projectId changes
  useEffect(() => {
    if (router.isReady && projectId && typeof projectId === 'string') {
      loadProject(projectId);
    } else if (router.isReady && !projectId) {
      setCurrentProject(null);
      setLoading(false);
    }
  }, [router.isReady, projectId]);

  if (!isClient || !router.isReady || loading) {
    return (
      <div className="page-container">
        <TopBar currentProject={currentProject} />
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
      <TopBar currentProject={currentProject} />
      <main className="page-main">
        <div className="main-content">
          <div className="viewer-container">
            <ViewerWrapper
              onSelectionChange={setSelectedElements}
              projectId={projectId as string}
            />
          </div>
          <InspectionPanel
            selectedElements={selectedElements}
            projectId={projectId as string}
            onInspectionChange={() => {
              // Trigger any necessary updates
              console.log("Inspection changed");
            }}
            onClearSelection={() => setSelectedElements([])}
          />
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

        .main-content {
          display: flex;
          height: calc(100vh - var(--header-height));
          overflow: hidden;
        }

        .viewer-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .main-content {
            flex-direction: column;
            height: calc(100vh - var(--header-height));
            overflow: hidden;
          }

          .viewer-container {
            flex: 1;
            min-height: 50vh;
            max-height: 50vh;
            position: relative;
            overflow: hidden;
          }
        }


      `}</style>
    </div>
  );
}