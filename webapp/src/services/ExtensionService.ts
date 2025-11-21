import { ParsedDocumentation } from '@/types/database'

const STORAGE_KEY = 'chillspace_parsed_docs'
const MESSAGE_TYPE = 'CHILLSPACE_PARSED_DOCS'
const POLLING_INTERVAL = 2000 // Check every 2 seconds

export interface ParsedDocWithMetadata extends ParsedDocumentation {
  id: string
  timestamp: number
  source: 'extension'
  processed: boolean
}

class ExtensionService {
  private pollingTimer: NodeJS.Timeout | null = null
  private listeners: ((docs: ParsedDocWithMetadata[]) => void)[] = []
  private isExtensionContext = false
  private supabaseUrl: string
  private supabaseAnonKey: string

  constructor() {
    // Check if we're running in extension context
    this.isExtensionContext = typeof chrome !== 'undefined' && 
                              chrome.runtime && 
                              !!chrome.runtime.id
    
    // Use Supabase Edge Functions
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!
    
    if (this.isExtensionContext) {
      this.setupMessageListener()
    }
  }

  // Setup message listener for extension context
  private setupMessageListener() {
    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === MESSAGE_TYPE) {
          this.notifyListeners(message.docs)
          sendResponse({ success: true })
        }
      })
    }
  }

  // Start polling for new parsed documentation (webapp context)
  startPolling() {
    if (this.pollingTimer || this.isExtensionContext) return

    this.pollingTimer = setInterval(() => {
      this.checkForNewDocs()
    }, POLLING_INTERVAL)
  }

  // Stop polling
  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  }

  // Check for new documentation from Supabase Edge Functions (webapp context)
  private async checkForNewDocs() {
    try {
      // In webapp context, check Supabase Edge Functions for parsed docs
      const response = await fetch(`${this.supabaseUrl}/functions/v1/extension-parsed-docs`, {
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
      })
      if (response.ok) {
        const docs: ParsedDocWithMetadata[] = await response.json()
        this.notifyListeners(docs)
      }
    } catch (error) {
      console.error('Error checking for parsed docs:', error)
    }
  }

  // Notify all listeners
  private notifyListeners(docs: ParsedDocWithMetadata[]) {
    this.listeners.forEach(listener => listener(docs))
  }

  // Save parsed documentation (extension context)
  async saveParsedDocs(docs: ParsedDocumentation[]) {
    const docsWithMetadata: ParsedDocWithMetadata[] = docs.map(doc => ({
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      source: 'extension' as const,
      processed: false
    }))

    if (this.isExtensionContext) {
      // Save to chrome.storage
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: docsWithMetadata })
        
        // Send message to webapp if it's open
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.url && tab.url.includes('localhost:5173')) {
              chrome.tabs.sendMessage(tab.id!, {
                type: MESSAGE_TYPE,
                docs: docsWithMetadata
              })
            }
          })
        })
        
        // Also send to backend API
        await this.sendToBackend(docsWithMetadata)
      } catch (error) {
        console.error('Error saving parsed docs:', error)
      }
    } else {
      // Webapp context - send to backend
      await this.sendToBackend(docsWithMetadata)
    }
  }

  // Send parsed docs to Supabase Edge Functions
  private async sendToBackend(docs: ParsedDocWithMetadata[]) {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/extension-parsed-docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({ docs }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save docs to backend')
      }
    } catch (error) {
      console.error('Error sending docs to backend:', error)
    }
  }

  // Subscribe to parsed documentation updates
  subscribe(listener: (docs: ParsedDocWithMetadata[]) => void) {
    this.listeners.push(listener)
    
    // Initial check
    if (!this.isExtensionContext) {
      this.checkForNewDocs()
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Mark documentation as processed
  async markAsProcessed(docId: string) {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/extension-parsed-docs/${docId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to mark doc as processed')
      }
    } catch (error) {
      console.error('Error marking doc as processed:', error)
    }
  }

  // Clear all parsed documentation
  async clearParsedDocs() {
    try {
      await fetch(`${this.supabaseUrl}/functions/v1/extension-parsed-docs`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
      })
    } catch (error) {
      console.error('Error clearing parsed docs:', error)
    }
  }

  // Get unprocessed documentation count
  async getUnprocessedCount(): Promise<number> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/extension-parsed-docs/count`, {
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        return data.count || 0
      }
    } catch (error) {
      console.error('Error getting unprocessed count:', error)
    }
    return 0
  }
}

export const extensionService = new ExtensionService()
