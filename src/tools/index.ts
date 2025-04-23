// import { MicrosoftCalendarTool } from './microsoft/calendar'
// import { MicrosoftMailTool } from './microsoft/mail'
// import { MicrosoftFilesTool } from './microsoft/files'

// // You can add more tools here as you develop additional features (e.g., tasks, contacts, etc.)

import { SalesforceQueryTool, SalesforceCreateTool, SalesforceSearchTool } from './salesforce'

export const tools = [
    SalesforceQueryTool,
    SalesforceCreateTool,
    SalesforceSearchTool
]
