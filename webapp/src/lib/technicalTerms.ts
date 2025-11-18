export interface TechnicalTerm {
  term: string
  hint: string
  alternatives?: string[]
}

export const technicalTerms: Record<string, TechnicalTerm> = {
  // API & Authentication
  'api': {
    term: 'API',
    hint: 'Application Programming Interface - A way for different software applications to communicate with each other, allowing data and functionality to be shared between systems.',
    alternatives: ['Web Service', 'Interface', 'Endpoint']
  },
  'endpoint': {
    term: 'Endpoint',
    hint: 'A specific URL where an API can be accessed. Each endpoint represents a specific function or resource in the API.',
    alternatives: ['URL', 'Route', 'Resource URL', 'API Path']
  },
  'bearer token': {
    term: 'Bearer Token',
    hint: 'An authentication token that proves your identity when making API requests. The token is included in the Authorization header.',
    alternatives: ['Access Token', 'Auth Token', 'JWT Token']
  },
  'basic auth': {
    term: 'Basic Auth',
    hint: 'A simple authentication scheme built into the HTTP protocol. It sends a username and password encoded in base64.',
    alternatives: ['Basic Authentication', 'HTTP Basic Auth']
  },
  'api key': {
    term: 'API Key',
    hint: 'A unique identifier used to authenticate a user, developer, or calling program to an API. Usually sent as a header or query parameter.',
    alternatives: ['Key', 'Access Key', 'Application Key']
  },
  'oauth2': {
    term: 'OAuth 2.0',
    hint: 'An authorization framework that enables applications to obtain limited access to user accounts on an HTTP service.',
    alternatives: ['OAuth', 'Open Authorization', 'OAuth2']
  },

  // HTTP & Requests
  'http': {
    term: 'HTTP',
    hint: 'Hypertext Transfer Protocol - The foundation of data communication on the World Wide Web. It defines how messages are formatted and transmitted.',
    alternatives: ['Hypertext Transfer Protocol']
  },
  'header': {
    term: 'Header',
    hint: 'Additional information sent with HTTP requests, such as authentication tokens, content type, or other metadata.',
    alternatives: ['HTTP Header', 'Request Header', 'Metadata']
  },
  'payload': {
    term: 'Payload',
    hint: 'The data sent in the body of an HTTP request or response. This contains the actual content being transmitted.',
    alternatives: ['Body', 'Request Body', 'Data', 'Content']
  },
  'query params': {
    term: 'Query Parameters',
    hint: 'Key-value pairs appended to a URL after a question mark (?) used to filter, sort, or modify the request.',
    alternatives: ['Query String', 'URL Parameters', 'GET Parameters']
  },

  // API Methods
  'get': {
    term: 'GET',
    hint: 'An HTTP method used to retrieve data from a server. GET requests should only retrieve data and not modify it.',
    alternatives: ['Retrieve', 'Fetch', 'Read']
  },
  'post': {
    term: 'POST',
    hint: 'An HTTP method used to submit data to a server, typically creating a new resource.',
    alternatives: ['Create', 'Submit', 'Add']
  },
  'put': {
    term: 'PUT',
    hint: 'An HTTP method used to update an existing resource or create a new one if it doesn\'t exist.',
    alternatives: ['Update', 'Replace']
  },
  'patch': {
    term: 'PATCH',
    hint: 'An HTTP method used to apply partial modifications to a resource. Unlike PUT, it only updates specific fields.',
    alternatives: ['Partial Update', 'Modify']
  },
  'delete': {
    term: 'DELETE',
    hint: 'An HTTP method used to remove a resource from a server.',
    alternatives: ['Remove', 'Destroy']
  },

  // Response & Status
  'status code': {
    term: 'Status Code',
    hint: 'A 3-digit number returned by an API indicating the result of the request (200 for success, 404 for not found, etc.).',
    alternatives: ['HTTP Status', 'Response Code', 'Status']
  },
  'json': {
    term: 'JSON',
    hint: 'JavaScript Object Notation - A lightweight format for storing and transporting data. Easy for humans to read and write.',
    alternatives: ['JavaScript Object Notation', 'Data Format']
  },

  // Database & Storage
  'database': {
    term: 'Database',
    hint: 'An organized collection of structured information, or data, typically stored electronically in a computer system.',
    alternatives: ['DB', 'Data Store', 'Storage']
  },
  'query': {
    term: 'Query',
    hint: 'A request for information from a database. In our context, it\'s a natural language description of what data you want to retrieve.',
    alternatives: ['Request', 'Search', 'Data Request']
  },

  // Security & Authentication
  'authentication': {
    term: 'Authentication',
    hint: 'The process of verifying who you are, usually by providing credentials like a username/password or token.',
    alternatives: ['Auth', 'Login', 'Verification', 'Identity Verification']
  },
  'authorization': {
    term: 'Authorization',
    hint: 'The process of determining what you\'re allowed to do after you\'ve been authenticated. It\'s about permissions.',
    alternatives: ['Authz', 'Permissions', 'Access Control']
  },

  // Development & Technical
  'webhook': {
    term: 'Webhook',
    hint: 'A way for an app to provide other applications with real-time information. It\'s an API that pushes data when events happen.',
    alternatives: ['HTTP Callback', 'Reverse API', 'Push API']
  },
  'rate limiting': {
    term: 'Rate Limiting',
    hint: 'A technique used by APIs to control the number of requests a user can make in a given time period.',
    alternatives: ['API Limits', 'Request Limits', 'Throttling']
  },
  'cors': {
    term: 'CORS',
    hint: 'Cross-Origin Resource Sharing - A security feature that controls which websites can access resources from other websites.',
    alternatives: ['Cross-Origin Resource Sharing', 'Origin Policy']
  },

  // ChillSpace Specific
  'natural language query': {
    term: 'Natural Language Query',
    hint: 'A request written in plain English that our system converts into a proper API request. No coding required!',
    alternatives: ['Plain English Query', 'Human-Readable Query', 'AI Query']
  },
  'connection': {
    term: 'Connection',
    hint: 'A saved configuration for accessing an API, including the URL, authentication details, and other settings.',
    alternatives: ['API Connection', 'Integration', 'API Config']
  },
  'execution history': {
    term: 'Execution History',
    hint: 'A log of all API requests you\'ve made, including the request details, responses, and timing information.',
    alternatives: ['Request Log', 'API History', 'Query History']
  }
}

// Helper function to get term info
export function getTermInfo(term: string): TechnicalTerm | null {
  const normalizedTerm = term.toLowerCase()
  return technicalTerms[normalizedTerm] || null
}

// Component props helper
export function createHintProps(termKey: string) {
  const term = getTermInfo(termKey)
  if (!term) return null
  
  return {
    term: term.term,
    hint: term.hint,
    alternatives: term.alternatives
  }
}
