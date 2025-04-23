
import { Auth0Client } from '@auth0/nextjs-auth0/server';

export type SupportedService = 'microsoft' | 'salesforce' | 'google';

interface ServiceConfig {
  connection: string;
  scope?: string;
}

const SERVICE_CONFIGS: Record<SupportedService, ServiceConfig> = {
  microsoft: { connection: 'windowslive', scope: 'openid profile email offline_access' },
  salesforce: { connection: 'salesforce-dev', scope: 'openid profile email offline_access' },
  google: { connection: 'google-oauth2', scope: 'openid profile email offline_access' }
};

export class ServiceManager {
  private static instance: ServiceManager;
  private activeServices: Set<SupportedService>;
  private auth0: Auth0Client;

  private constructor(auth0: Auth0Client) {
    this.activeServices = new Set();
    this.auth0 = auth0;
  }

  static initialize(auth0: Auth0Client): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager(auth0);
    }
    return ServiceManager.instance;
  }

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      throw new Error('ServiceManager not initialized');
    }
    return ServiceManager.instance;
  }

  async getAccessToken(service: SupportedService): Promise<string> {
    const config = SERVICE_CONFIGS[service];
    if (!config) {
      throw new Error(`Unsupported service: ${service}`);
    }

    const { token } = await this.auth0.getAccessTokenForConnection({
      connection: config.connection,
    });

    this.registerService(service);
    return token;
  }

  registerService(service: SupportedService): void {
    this.activeServices.add(service);
  }

  unregisterService(service: SupportedService): void {
    this.activeServices.delete(service);
  }

  isServiceActive(service: SupportedService): boolean {
    return this.activeServices.has(service);
  }

  getActiveServices(): SupportedService[] {
    return Array.from(this.activeServices);
  }
}
