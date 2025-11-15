import { parseApiDocumentation } from './parser';

console.log('Content script loaded');

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message:', message.type);
  
  if (message.type === 'PARSE_CURRENT_PAGE') {
    console.log('Handling PARSE_CURRENT_PAGE message');
    handleParsePage().then(result => {
      console.log('Parse result:', result);
      sendResponse(result);
    }).catch(error => {
      console.error('Parse page error:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to parse page' 
      });
    });
    return true; // Keep message channel open for async response
  }
});

async function handleParsePage() {
  try {
    console.log('Starting page parsing for:', window.location.href);
    
    const result = await parseApiDocumentation(document, window.location.href);
    
    if (result) {
      console.log('Successfully parsed API documentation');
      
      // Store in chrome.storage
      const { schemas = [] } = await chrome.storage.local.get('schemas');
      schemas.push(result.schema);
      await chrome.storage.local.set({ schemas });
      
      return { success: true, data: result };
    }
    
    console.log('No API documentation found on page');
    return { success: false, error: 'No API documentation detected on this page' };
  } catch (error) {
    console.error('Error in handleParsePage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse page' 
    };
  }
}

// Auto-detect API documentation on page load
window.addEventListener('load', () => {
  console.log('Page loaded, checking for API documentation');
  detectApiDocumentation();
});

function detectApiDocumentation() {
  console.log('Detecting API documentation on:', window.location.href);
  
  // Check for common API documentation indicators
  const indicators = [
    // OpenAPI/Swagger
    'swagger-ui',
    'redoc',
    // Common API doc frameworks
    'api-documentation',
    'rest-api',
    'graphql',
    // Common meta tags
    document.querySelector('meta[name="api-documentation"]'),
    // JSON/YAML files
    window.location.href.match(/\.(json|yaml|yml)$/),
  ];

  const hasApiDoc = indicators.some(indicator => {
    if (typeof indicator === 'string') {
      return document.body.className.includes(indicator) || 
             document.getElementById(indicator) !== null;
    }
    return indicator !== null;
  });

  console.log('API documentation detected:', hasApiDoc);

  if (hasApiDoc) {
    // Show a badge or notification that API docs were detected
    chrome.runtime.sendMessage({ 
      type: 'API_DOCS_DETECTED', 
      payload: { url: window.location.href } 
    });
  }
}
