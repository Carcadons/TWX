import { useState, useEffect } from 'react';

interface InspectionData {
  id?: string;
  elementId: string;
  projectId: string;
  inspector: string;
  status: 'ok' | 'issue' | '';
  notes: string;
  date: string;
  lastModifiedBy: string;
}

class TWXApiService {
  private baseUrl: string = '';
  private currentProject: string = 'default-project';

  constructor() {
    console.log('🔗 TWX API Service initialized');

    // Try to restore project from localStorage
    if (typeof window !== 'undefined') {
      const savedProject = localStorage.getItem('twx-current-project');
      if (savedProject) {
        this.currentProject = savedProject;
        console.log(`🔄 Restored project from localStorage: ${this.currentProject}`);
      }
    }
  }

  setProject(projectId: string) {
    console.log(`🆔 Setting API project from "${this.currentProject}" to "${projectId}"`);
    this.currentProject = projectId;

    if (typeof window !== 'undefined') {
      localStorage.setItem('twx-current-project', projectId);
    }
  }

  getCurrentProject(): string {
    return this.currentProject;
  }

  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      console.log('🌐 API Request:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Success:', endpoint);

      return data;
    } catch (error) {
      console.error(`❌ API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      };
    }
  }

  async isServerAvailable(): Promise<boolean> {
    try {
      console.log('🔍 Checking server...');

      const response = await fetch('/api/stats', {
        method: 'GET',
        cache: 'no-cache'
      });

      const result = response.ok;
      console.log('🔍 Server check result:', result);
      return result;
    } catch (error) {
      console.log('🔍 Server check failed:', error);
      return false;
    }
  }

  async getInspections(projectId?: string): Promise<InspectionData[]> {
    const project = projectId || this.currentProject;
    const endpoint = `/api/inspections?projectId=${project}`;

    console.log(`📊 Getting inspections for project: ${project}`);

    const response = await this.fetchApi<InspectionData[]>(endpoint);
    return response.success ? response.data || [] : [];
  }

  async getInspectionByElement(elementId: string, projectId?: string): Promise<InspectionData | null> {
    const project = projectId || this.currentProject;
    const endpoint = `/api/inspections/element/${elementId}?projectId=${project}`;

    console.log(`🔍 Getting inspection for element ${elementId} in project ${project}`);

    const response = await this.fetchApi<InspectionData>(endpoint);
    return response.success ? response.data || null : null;
  }

  async saveInspection(inspectionData: Omit<InspectionData, 'id'>, projectId?: string): Promise<InspectionData | null> {
    const project = projectId || this.currentProject;

    const payload = {
      ...inspectionData,
      projectId: project,
      lastModifiedBy: 'user',
    };

    console.log(`💾 Saving inspection for project ${project}:`, payload);

    const response = await this.fetchApi<InspectionData>('/api/inspections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response.success ? response.data || null : null;
  }

  async deleteInspection(id: string): Promise<boolean> {
    console.log(`🗑️ Deleting inspection ${id}`);

    const response = await this.fetchApi(`/api/inspections/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  async exportData(projectId?: string): Promise<any> {
    const project = projectId || this.currentProject;
    const endpoint = `/api/export?projectId=${project}`;

    console.log(`📁 Exporting data for project: ${project}`);

    const response = await this.fetchApi(endpoint);
    return response.success ? response.data : null;
  }

  async migrateFromLocalStorage(): Promise<{ migrated: number; errors: number }> {
    // Migration functionality removed - everything should use API directly
    console.log("🚫 Migration functionality disabled - use API only");
    return { migrated: 0, errors: 0 };
  }
}

export const twxApi = new TWXApiService();

export function useTWXApi() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const available = await twxApi.isServerAvailable();
        setIsOnline(available);
        console.log('🔄 Status:', available ? 'ONLINE' : 'OFFLINE');
      } catch (error) {
        console.log('🔄 Status check error:', error);
        setIsOnline(false);
      }
    };

    // Initial check
    checkServerStatus();

    // Check every 15 seconds (longer interval)
    const interval = setInterval(checkServerStatus, 15000);

    return () => clearInterval(interval);
  }, []);

  return {
    api: twxApi,  // Return the twxApi instance directly
    isOnline,
    currentProject: twxApi.getCurrentProject(), // Now properly expose current project
    setProject: (id: string) => twxApi.setProject(id)
  };
}

export default twxApi;