
export type SupportedService = 'microsoft' | 'salesforce' | 'google'

class ServiceRegistry {
    private static instance: ServiceRegistry
    private activeServices: Set<SupportedService>

    private constructor() {
        this.activeServices = new Set()
    }

    static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry()
        }
        return ServiceRegistry.instance
    }

    registerService(service: SupportedService) {
        this.activeServices.add(service)
    }

    unregisterService(service: SupportedService) {
        this.activeServices.delete(service)
    }

    isServiceActive(service: SupportedService): boolean {
        return this.activeServices.has(service)
    }

    getActiveServices(): SupportedService[] {
        return Array.from(this.activeServices)
    }
}

export const serviceRegistry = ServiceRegistry.getInstance()
