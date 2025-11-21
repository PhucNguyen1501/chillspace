import { useState, useEffect } from 'react'
import { X, Download, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { ApiConnection } from '@/types/database'
import { extensionService, ParsedDocWithMetadata } from '@/services/ExtensionService'
import { claudeService, GeneratedApiCall } from '@/services/ClaudeService'
import Button from '@/components/ui/Button'
import HintText from '@/components/ui/HintText'

interface EnhancedConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (connection: ApiConnection) => void
}

export default function EnhancedConnectionModal({ isOpen, onClose, onSuccess }: EnhancedConnectionModalProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [parsedDocs, setParsedDocs] = useState<ParsedDocWithMetadata[]>([])
  const [selectedDoc, setSelectedDoc] = useState<ParsedDocWithMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatingConnection, setGeneratingConnection] = useState(false)
  const [generatedConnection, setGeneratedConnection] = useState<Partial<ApiConnection> | null>(null)
  const [userIntent, setUserIntent] = useState('')
  const [testResults, setTestResults] = useState<{ success: boolean; message: string } | null>(null)

  // Listen for parsed documentation from extension
  useEffect(() => {
    if (!isOpen) return

    const unsubscribe = extensionService.subscribe((docs) => {
      setParsedDocs(docs.filter(doc => !doc.processed))
    })

    extensionService.startPolling()

    return () => {
      unsubscribe()
      extensionService.stopPolling()
    }
  }, [isOpen])

  // Generate connection from parsed documentation
  const handleGenerateFromDoc = async () => {
    if (!selectedDoc || !userIntent.trim()) {
      addToast('Please select documentation and describe what you want to do', 'error')
      return
    }

    setGeneratingConnection(true)
    try {
      // Generate API call using Claude
      const claudeRequest = {
        apiSpec: {
          type: selectedDoc.type,
          schema: selectedDoc.schema
        },
        userIntent: userIntent.trim(),
        authType: 'none' as const
      }

      const claudeResponse = await claudeService.generateApiCall(claudeRequest)
      
      if (!claudeResponse.success || !claudeResponse.data) {
        throw new Error(claudeResponse.error || 'Failed to generate API call')
      }

      const generatedCall = claudeResponse.data

      // Create connection from generated call
      const connection: Partial<ApiConnection> = {
        name: `${selectedDoc.schema.title} - ${userIntent.substring(0, 50)}...`,
        base_url: selectedDoc.schema.baseUrl || selectedDoc.schema.url,
        auth_type: 'none',
        description: `Generated from ${selectedDoc.schema.title} documentation. ${generatedCall.description}`
      }

      setGeneratedConnection(connection)

      // Test the connection
      await testGeneratedCall(generatedCall, selectedDoc.schema.baseUrl || selectedDoc.schema.url)

      addToast('Successfully generated API connection!', 'success')
    } catch (error) {
      console.error('Error generating connection:', error)
      addToast(error instanceof Error ? error.message : 'Failed to generate connection', 'error')
    } finally {
      setGeneratingConnection(false)
    }
  }

  // Test the generated API call
  const testGeneratedCall = async (generatedCall: GeneratedApiCall, baseUrl: string) => {
    try {
      const testResult = await claudeService.testApiCall(generatedCall, baseUrl)
      
      if (testResult.success) {
        setTestResults({
          success: true,
          message: `API test successful! Status: ${testResult.status}`
        })
      } else {
        setTestResults({
          success: false,
          message: testResult.error || 'API test failed'
        })
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      })
    }
  }

  // Save the generated connection
  const handleSaveConnection = async () => {
    if (!generatedConnection || !user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('api_connections')
        .insert({
          ...generatedConnection,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Mark the parsed doc as processed
      if (selectedDoc) {
        await extensionService.markAsProcessed(selectedDoc.id)
      }

      addToast('Connection saved successfully!', 'success')
      onSuccess?.(data)
      onClose()
    } catch (error) {
      console.error('Error saving connection:', error)
      addToast('Failed to save connection', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Clear parsed documentation
  const handleClearParsedDocs = async () => {
    await extensionService.clearParsedDocs()
    setParsedDocs([])
    setSelectedDoc(null)
    addToast('Cleared parsed documentation', 'info')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create API Connection
              </h2>
              <p className="text-sm text-gray-600">
                Import from Chrome extension and generate with AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Parsed Documentation Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                <HintText termKey="API documentation" className="inline" showIcon={false} /> from Extension
              </h3>
              {parsedDocs.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearParsedDocs}
                >
                  Clear All
                </Button>
              )}
            </div>

            {parsedDocs.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Download className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">
                  No API documentation found from Chrome extension
                </p>
                <p className="text-sm text-gray-500">
                  Open an API documentation page (Swagger, OpenAPI, etc.) and use the Chrome extension to parse it
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {parsedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedDoc?.id === doc.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {doc.schema.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {doc.schema.endpoints.length} endpoints • {doc.type}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {doc.schema.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                          New
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Intent Section */}
          {selectedDoc && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                What do you want to do with this API?
              </h3>
              <textarea
                value={userIntent}
                onChange={(e) => setUserIntent(e.target.value)}
                placeholder="e.g., Get all users from the API, Create a new product, Update customer information..."
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
              />
              <Button
                variant="primary"
                onClick={handleGenerateFromDoc}
                disabled={!userIntent.trim() || generatingConnection}
                className="mt-3"
              >
                {generatingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate API Connection
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated Connection Section */}
          {generatedConnection && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Generated Connection
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Connection Name
                    </label>
                    <input
                      type="text"
                      value={generatedConnection.name}
                      onChange={(e) => setGeneratedConnection({
                        ...generatedConnection,
                        name: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base URL
                    </label>
                    <input
                      type="url"
                      value={generatedConnection.base_url}
                      onChange={(e) => setGeneratedConnection({
                        ...generatedConnection,
                        base_url: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={generatedConnection.description}
                      onChange={(e) => setGeneratedConnection({
                        ...generatedConnection,
                        description: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Test Results */}
                {testResults && (
                  <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                    testResults.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {testResults.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">{testResults.message}</span>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveConnection}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Connection'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setGeneratedConnection(null)
                      setTestResults(null)
                    }}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
