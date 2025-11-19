import type { ApiSchema, ParsedDocumentation, ApiEndpoint } from '../types';
import { generateId } from '../lib/id';
import * as yaml from 'js-yaml';

export async function parseApiDocumentation(
  document: Document,
  url: string
): Promise<ParsedDocumentation | null> {
  console.log('Starting API documentation parsing for:', url);
  
  // Try different parsing strategies
  const parsers = [
    parseOpenApiSpec,
    parseSwaggerUI,
    parseRedoc,
    parseGraphQL,
    parseRestApiTable,
  ];

  for (const parser of parsers) {
    try {
      console.log('Trying parser:', parser.name);
      const result = await parser(document, url);
      if (result) {
        console.log('Successfully parsed with parser:', parser.name, 'Found', result.schema.endpoints.length, 'endpoints');
        return result;
      }
    } catch (error) {
      console.error('Parser error for', parser.name, ':', error);
    }
  }

  console.log('No API documentation could be parsed from this page');
  return null;
}

// Parse OpenAPI/Swagger JSON or YAML spec
async function parseOpenApiSpec(
  document: Document,
  url: string
): Promise<ParsedDocumentation | null> {
  // Look for spec in script tags or pre tags
  const scriptTags = document.querySelectorAll('script[type="application/json"]');
  const preTags = document.querySelectorAll('pre');

  for (const tag of [...Array.from(scriptTags), ...Array.from(preTags)]) {
    try {
      const content = tag.textContent || '';
      let spec: any;

      // Try parsing as JSON
      try {
        spec = JSON.parse(content);
      } catch {
        // Try parsing as YAML
        spec = yaml.load(content);
      }

      if (spec && (spec.openapi || spec.swagger)) {
        return {
          type: spec.openapi ? 'openapi' : 'swagger',
          schema: convertOpenApiToSchema(spec, url),
        };
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

// Parse Swagger UI page
async function parseSwaggerUI(
  document: Document,
  url: string
): Promise<ParsedDocumentation | null> {
  const swaggerContainer = document.querySelector('.swagger-ui');
  if (!swaggerContainer) {
    console.log('No .swagger-ui container found');
    return null;
  }

  console.log('Found Swagger UI container, attempting to extract spec');
  
  // Try to extract spec from window object
  const win = window as any;
  
  // Method 1: Modern Swagger UI with specSelectors
  if (win.ui && win.ui.specSelectors) {
    try {
      console.log('Trying specSelectors.specJson()');
      const spec = win.ui.specSelectors.specJson().toJS();
      if (spec && (spec.swagger || spec.openapi)) {
        console.log('Successfully extracted spec via specSelectors');
        return {
          type: spec.openapi ? 'openapi' : 'swagger',
          schema: convertOpenApiToSchema(spec, url),
        };
      }
    } catch (error) {
      console.log('specSelectors method failed:', error);
    }
  }

  // Method 2: Check for spec in window.swaggerSpec or window.spec
  if (win.swaggerSpec) {
    console.log('Found window.swaggerSpec');
    return {
      type: win.swaggerSpec.openapi ? 'openapi' : 'swagger',
      schema: convertOpenApiToSchema(win.swaggerSpec, url),
    };
  }

  if (win.spec) {
    console.log('Found window.spec');
    return {
      type: win.spec.openapi ? 'openapi' : 'swagger',
      schema: convertOpenApiToSchema(win.spec, url),
    };
  }

  // Method 3: Try to find spec URL in the page and fetch it
  const specUrlElement = document.querySelector('[data-spec-url]') ||
                         document.querySelector('[spec-url]') ||
                         document.querySelector('link[rel="api-spec"]');
  if (specUrlElement) {
    const specUrl = specUrlElement.getAttribute('data-spec-url') || 
                    specUrlElement.getAttribute('spec-url') ||
                    specUrlElement.getAttribute('href');
    if (specUrl) {
      try {
        console.log('Attempting to fetch spec from:', specUrl);
        const fullUrl = new URL(specUrl, url).href;
        const response = await fetch(fullUrl);
        const spec = await response.json();
        if (spec && (spec.swagger || spec.openapi)) {
          console.log('Successfully fetched spec from URL');
          return {
            type: spec.openapi ? 'openapi' : 'swagger',
            schema: convertOpenApiToSchema(spec, url),
          };
        }
      } catch (error) {
        console.log('Failed to fetch spec from URL:', error);
      }
    }
  }

  // Method 4: Look for common spec URL patterns in page scripts/links
  const possibleSpecUrls = [
    '/swagger.json',
    '/swagger.yaml',
    '/api-docs',
    '/api/swagger.json',
    '/v2/swagger.json',
    '/v3/api-docs',
    '/openapi.json',
    '/openapi.yaml',
  ];

  for (const path of possibleSpecUrls) {
    try {
      const specUrl = new URL(path, url).href;
      console.log(`Trying common spec path: ${specUrl}`);
      const response = await fetch(specUrl);
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let spec;
        
        if (contentType.includes('yaml') || contentType.includes('yml') || path.endsWith('.yaml')) {
          const text = await response.text();
          spec = yaml.load(text);
        } else {
          spec = await response.json();
        }
        
        if (spec && (spec.swagger || spec.openapi)) {
          console.log(`Successfully fetched spec from ${specUrl}`);
          return {
            type: spec.openapi ? 'openapi' : 'swagger',
            schema: convertOpenApiToSchema(spec, url),
          };
        }
      }
    } catch (error) {
      // Silently continue trying other paths
      continue;
    }
  }

  console.log('Could not extract Swagger spec using any method');
  return null;
}

// Parse Redoc page
async function parseRedoc(
  document: Document,
  url: string
): Promise<ParsedDocumentation | null> {
  const redocContainer = document.querySelector('redoc');
  if (!redocContainer) return null;

  const specUrl = redocContainer.getAttribute('spec-url');
  if (specUrl) {
    try {
      const response = await fetch(specUrl);
      const spec = await response.json();
      return {
        type: 'openapi',
        schema: convertOpenApiToSchema(spec, url),
      };
    } catch (error) {
      console.error('Failed to fetch spec:', error);
    }
  }

  return null;
}

// Parse GraphQL API documentation / consoles (GraphiQL, Playground, etc.)
async function parseGraphQL(
  document: Document,
  url: string
): Promise<ParsedDocumentation | null> {
  // Detect common GraphQL UIs
  const graphqlIndicators = [
    document.querySelector('.graphiql-container'),
    document.querySelector('[data-testid="playground"]'),
    document.querySelector('[class*="graphql-playground"]'),
    document.querySelector('[class*="graphiql"]'),
  ];

  const hasGraphQLUI = graphqlIndicators.some(el => el !== null);

  // Fallback: look for GraphQL in title or main headings
  const titleText = (document.title || '').toLowerCase();
  const headingText = Array.from(document.querySelectorAll('h1, h2'))
    .map(h => h.textContent?.toLowerCase() || '')
    .join(' ');

  const mentionsGraphQL = titleText.includes('graphql') || headingText.includes('graphql');

  if (!hasGraphQLUI && !mentionsGraphQL) {
    return null;
  }

  // Try to infer the GraphQL endpoint URL
  const endpointUrl = findGraphQLEndpoint(document, url);

  // Derive base URL + path for our ApiSchema
  const pageUrl = new URL(url);
  const endpoint = endpointUrl ? new URL(endpointUrl, url) : new URL('/graphql', pageUrl.origin);

  const schema = {
    id: generateId(),
    url,
    title: document.title || 'GraphQL API',
    baseUrl: endpoint.origin,
    endpoints: [
      {
        path: endpoint.pathname,
        method: 'POST',
        description:
          'GraphQL endpoint. Send queries and mutations as a JSON body with a `query` field (and optional `variables`).',
      },
    ],
    parsedAt: new Date().toISOString(),
  } satisfies ApiSchema;

  return {
    type: 'graphql',
    schema,
  };
}

// Best-effort detection of the GraphQL HTTP endpoint from the documentation page
function findGraphQLEndpoint(document: Document, pageUrl: string): string | null {
  // 1) Explicit meta tags
  const meta = document.querySelector(
    'meta[name="graphql-endpoint"], meta[name="graphql-url"], meta[name="graphql"]'
  );
  if (meta) {
    const content = meta.getAttribute('content');
    if (content) return content;
  }

  // 2) Link tags
  const link = document.querySelector(
    'link[rel="graphql"], link[rel="graphql-endpoint"], link[rel="api"]'
  );
  if (link) {
    const href = link.getAttribute('href');
    if (href) return href;
  }

  // 3) Elements with data attributes commonly used to store endpoint
  const endpointAttrEl = document.querySelector(
    '[data-endpoint], [data-url], [data-graphql-endpoint], [data-graphql-url]'
  );
  if (endpointAttrEl) {
    const attrNames = ['data-endpoint', 'data-url', 'data-graphql-endpoint', 'data-graphql-url'];
    for (const name of attrNames) {
      const value = endpointAttrEl.getAttribute(name);
      if (value) return value;
    }
  }

  // 4) Forms or buttons that hint at the endpoint
  const form = document.querySelector('form[action*="graphql"]') as HTMLFormElement | null;
  if (form?.action) {
    return form.action;
  }

  // 5) Fallback to common GraphQL paths on the same origin
  try {
    const base = new URL(pageUrl);
    // Prefer common GraphQL endpoints, without doing network requests here
    const commonPaths = ['/graphql', '/api/graphql', '/v1/graphql'];
    for (const path of commonPaths) {
      // Return the first plausible endpoint; user can adjust if needed
      return new URL(path, base.origin).href;
    }
  } catch {
    // Ignore URL parsing errors and fall through
  }

  return null;
}

// Parse REST API documentation tables
async function parseRestApiTable(
  document: Document,
  url: string
): Promise<ParsedDocumentation | null> {
  const tables = document.querySelectorAll('table');
  const endpoints: ApiEndpoint[] = [];

  for (const table of tables) {
    const headers = Array.from(table.querySelectorAll('th')).map(
      th => th.textContent?.toLowerCase() || ''
    );

    // Check if table has endpoint/method columns
    const hasEndpoint = headers.some(h => h.includes('endpoint') || h.includes('path'));
    const hasMethod = headers.some(h => h.includes('method'));

    if (hasEndpoint && hasMethod) {
      const rows = table.querySelectorAll('tbody tr');
      
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length >= 2) {
          const endpoint: ApiEndpoint = {
            path: cells[0].textContent?.trim() || '',
            method: (cells[1].textContent?.trim().toUpperCase() || 'GET') as any,
            description: cells[2]?.textContent?.trim(),
          };
          endpoints.push(endpoint);
        }
      }
    }
  }

  if (endpoints.length > 0) {
    return {
      type: 'rest',
      schema: {
        id: generateId(),
        url,
        title: document.title || 'REST API',
        endpoints,
        parsedAt: new Date().toISOString(),
      },
    };
  }

  return null;
}

// Convert OpenAPI spec to our ApiSchema format
function convertOpenApiToSchema(spec: any, url: string): ApiSchema {
  const endpoints: ApiEndpoint[] = [];

  try {
    if (spec.paths && typeof spec.paths === 'object') {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        if (pathItem && typeof pathItem === 'object') {
          for (const [method, operation] of Object.entries(pathItem)) {
            if (['get', 'post', 'put', 'patch', 'delete'].includes(method) && 
                operation && typeof operation === 'object') {
              endpoints.push({
                path,
                method: method.toUpperCase() as any,
                description: operation.summary || operation.description || '',
                parameters: Array.isArray(operation.parameters) ? operation.parameters : [],
                requestBody: operation.requestBody || null,
                responses: operation.responses || {},
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error converting OpenAPI spec:', error);
    // Return a minimal schema if conversion fails
    return {
      id: generateId(),
      url,
      title: spec.info?.title || 'API Documentation',
      version: spec.info?.version || '1.0.0',
      baseUrl: spec.servers?.[0]?.url || '',
      endpoints: [],
      parsedAt: new Date().toISOString(),
    };
  }

  return {
    id: generateId(),
    url,
    title: spec.info?.title || 'API Documentation',
    version: spec.info?.version || '1.0.0',
    baseUrl: spec.servers?.[0]?.url || '',
    endpoints,
    parsedAt: new Date().toISOString(),
  };
}
