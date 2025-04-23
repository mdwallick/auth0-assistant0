
import jsforce from 'jsforce';
import { serviceManager } from '@/lib/auth0';

export async function getSalesforceClient() {
    const token = await serviceManager.getAccessToken('salesforce');

    const conn = new jsforce.Connection({
        instanceUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
        accessToken: token,
    });

    return conn;
}
