import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { serviceRegistry } from './service-registry' // Added import for service registry

export const auth0 = new Auth0Client({
    // this is required to get federated access tokens from services like Google
    authorizationParameters: {
        access_type: 'offline',
        prompt: 'consent',
    },
})

export const getGoogleAccessToken = async () => {
    const { token } = await auth0.getAccessTokenForConnection({
        connection: 'google-oauth2',
    })
    serviceRegistry.register('google', token); // Register Google service
    return token
}

export const getMicrosoftAccessToken = async () => {
    // Get access token for Microsoft social connection.
    const { token } = await auth0.getAccessTokenForConnection({
        connection: "windowslive",
    })
    serviceRegistry.register('microsoft', token); // Register Microsoft service
    return token
}

export const getSalesforceAccessToken = async () => {
    // Get access token for Salesforce connection.
    const { token } = await auth0.getAccessTokenForConnection({
        connection: "salesforce-dev",
    })
    serviceRegistry.register('salesforce', token); // Register Salesforce service
    return token
}


// Placeholder for service-registry.js -  This needs to be implemented separately.
// This is a basic example and error handling would need to be added in a real application
// This file should be created in the same directory.
//  './service-registry.js'
/*
export const serviceRegistry = {
  services: {},
  register: function(serviceName, token) {
    this.services[serviceName] = token;
  },
  isAvailable: function(serviceName) {
    return this.services.hasOwnProperty(serviceName);
  },
  getToken: function(serviceName) {
    return this.services[serviceName];
  }
};
*/