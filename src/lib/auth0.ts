import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { ServiceManager } from './service-manager';

export const auth0 = new Auth0Client({
    // this is required to get federated access tokens from services like Google
    // authorizationParameters: {
    //     access_type: 'offline',
    //     prompt: 'consent',
    // },
    routes: {
        callback: '/api/auth/callback',
    },
})

// Initialize the service manager with auth0 client
export const serviceManager = ServiceManager.initialize(auth0);

// Helper functions for getting access tokens
export const getGoogleAccessToken = () => serviceManager.getAccessToken('google');
export const getMicrosoftAccessToken = () => serviceManager.getAccessToken('microsoft');
export const getSalesforceAccessToken = () => serviceManager.getAccessToken('salesforce');