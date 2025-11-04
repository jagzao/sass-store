import { getTenantContext } from '@/lib/tenant/tenant-resolver';

interface ApiOptions {
  tenant?: string;
  headers?: Record<string, string>;
}

class ApiClient {
  private getBaseUrl(): string {
    // Use API_URL if defined, otherwise default to localhost:4000 for development
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  }

  private async buildUrl(endpoint: string, tenant: string, searchParams?: Record<string, string>): Promise<string> {
    const url = new URL(endpoint, this.getBaseUrl());
    
    // Add tenant to query params if not already present
    if (tenant) {
      url.searchParams.set('tenant', tenant);
    }
    
    // Add any additional search params
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    return url.toString();
  }

  async get<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const tenant = options.tenant || getTenantContext();
    const url = await this.buildUrl(endpoint, tenant, undefined);
    
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant': tenant,
      ...options.headers,
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
  
  async getWithParams<T>(endpoint: string, searchParams?: Record<string, string>, options: ApiOptions = {}): Promise<T> {
    const tenant = options.tenant || getTenantContext();
    const url = await this.buildUrl(endpoint, tenant, searchParams);
    
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant': tenant,
      ...options.headers,
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

export const apiClient = new ApiClient();