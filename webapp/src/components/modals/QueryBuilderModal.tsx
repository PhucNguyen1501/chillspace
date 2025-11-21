import { useEffect, useState } from 'react'
import { X, Send, Play, Save, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ApiConnection, ApiEndpoint } from '@/types/database'
import Button from '@/components/ui/Button'
import HintText from '@/components/ui/HintText'
import HintTooltip from '@/components/ui/HintTooltip'

interface QueryBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  connection: ApiConnection | null
  endpoint?: ApiEndpoint | null
}

export default function QueryBuilderModal({ isOpen, onClose, connection, endpoint }: QueryBuilderModalProps) {
  const { user } = useAuth()
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [loading, setLoading] = useState(false)
  
  // Query state
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(endpoint || null)
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('')
  const [generatedRequest, setGeneratedRequest] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (isOpen && connection) {
      loadEndpoints()
    }
  }, [isOpen, connection])

  const loadEndpoints = async () => {
    if (!connection) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('connection_id', connection.id)

      if (error) throw error
      setEndpoints(data || [])
    } catch (err: any) {
      console.error('Error loading endpoints:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateQuery = async () => {
    if (!naturalLanguageQuery.trim()) return

    setProcessing(true)
    setExecutionResult(null)

    try {
      // TODO: In a real app, this would call an AI service to generate the request
      // For now, we'll create a mock generated request
      const mockRequest = {
        method: selectedEndpoint?.method || 'GET',
        path: selectedEndpoint?.path || '/',
        headers: connection?.auth_headers || {},
        query_params: {},
        body: null,
      }

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setGeneratedRequest(mockRequest)
    } catch (err: any) {
      alert(`Error generating query: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const executeQuery = async () => {
    if (!generatedRequest || !connection) return

    setExecuting(true)
    setExecutionResult(null)

    try {
      const url = new URL(generatedRequest.path, connection.base_url)
      
      // Add query params if any
      if (generatedRequest.query_params) {
        Object.entries(generatedRequest.query_params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }

      const response = await fetch(url.toString(), {
        method: generatedRequest.method,
        headers: {
          ...generatedRequest.headers,
          'Content-Type': 'application/json',
        },
        body: generatedRequest.body ? JSON.stringify(generatedRequest.body) : undefined,
      })

      const data = await response.json()

      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        success: response.ok,
      }

      setExecutionResult(result)

      // Save to execution history
      await supabase.from('execution_history').insert({
        user_id: user?.id,
        request_url: url.toString(),
        request_method: generatedRequest.method,
        request_headers: generatedRequest.headers,
        request_body: generatedRequest.body ? JSON.stringify(generatedRequest.body) : null,
        response_status: response.status,
        response_headers: result.headers,
        response_body: JSON.stringify(data),
        execution_time_ms: 0,
        success: response.ok,
        error_message: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
      })
    } catch (err: any) {
      setExecutionResult({
        success: false,
        error: err.message,
      })
    } finally {
      setExecuting(false)
    }
  }

  const saveQuery = async () => {
    if (!naturalLanguageQuery.trim() || !generatedRequest || !connection) return

    const queryName = prompt('Enter a name for this query:')
    if (!queryName) return

    try {
      await supabase.from('saved_queries').insert({
        user_id: user?.id,
        connection_id: connection.id,
        endpoint_id: selectedEndpoint?.id || null,
        name: queryName,
        natural_language_query: naturalLanguageQuery,
        generated_request: generatedRequest,
        parameters: {},
      })

      alert('Query saved successfully!')
    } catch (err: any) {
      alert(`Error saving query: ${err.message}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  if (!isOpen || !connection) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Query Builder</h2>
            <p className="text-sm text-gray-600 mt-1">{connection.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Input */}
            <div className="space-y-6">
              {/* Endpoint Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select <HintText termKey="endpoint" className="inline" showIcon={false} /> (Optional)
                </label>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading endpoints...</span>
                  </div>
                ) : endpoints.length > 0 ? (
                  <select
                    value={selectedEndpoint?.id || ''}
                    onChange={(e) => {
                      const endpoint = endpoints.find((ep) => ep.id === e.target.value)
                      setSelectedEndpoint(endpoint || null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">-- Choose an endpoint --</option>
                    {endpoints.map((endpoint) => (
                      <option key={endpoint.id} value={endpoint.id}>
                        {endpoint.method} {endpoint.path}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500 py-2">No endpoints available for this connection</p>
                )}
              </div>

              {/* Natural Language Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe Your <HintText termKey="natural language query" className="inline" showIcon={false} />
                </label>
                <textarea
                  value={naturalLanguageQuery}
                  onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Get all users with role 'admin' created in the last 7 days..."
                />
                <Button
                  variant="primary"
                  onClick={generateQuery}
                  disabled={processing || !naturalLanguageQuery.trim()}
                  className="w-full mt-4"
                >
                  {processing ? (
                    'Processing...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Generate Request
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Request */}
              {generatedRequest && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Generated Request</h3>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(generatedRequest, null, 2))}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {copySuccess ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <pre className="bg-gray-50 p-4 text-xs overflow-auto max-h-64">
                    {JSON.stringify(generatedRequest, null, 2)}
                  </pre>
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="primary"
                      onClick={executeQuery}
                      disabled={executing}
                      className="flex-1"
                    >
                      {executing ? (
                        'Executing...'
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Execute
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={saveQuery}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Output */}
            <div className="space-y-6">
              {/* Execution Result */}
              {executionResult && (
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Response</h3>
                    <span
                      className={`px-3 py-1 text-sm font-medium ${
                        executionResult.success
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <HintText termKey="status code" className="inline" showIcon={false} />: {executionResult.status || 'Error'}
                    </span>
                  </div>

                  {executionResult.error ? (
                    <div className="bg-red-50 p-4">
                      <p className="text-red-800 text-sm">{executionResult.error}</p>
                    </div>
                  ) : (
                    <>
                      {/* Response Data */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Data <HintTooltip term="JSON" hint="JavaScript Object Notation - A lightweight format for storing and transporting data." size="sm" />
                        </h4>
                        <pre className="bg-gray-50 p-4 text-xs overflow-auto max-h-96">
                          {JSON.stringify(executionResult.data, null, 2)}
                        </pre>
                      </div>

                      {/* Response Headers */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Headers</h4>
                        <pre className="bg-gray-50 p-4 text-xs overflow-auto max-h-32">
                          {JSON.stringify(executionResult.headers, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Helper Tips */}
              {!executionResult && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">💡 Tips</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Be specific about what data you want to retrieve or modify</li>
                    <li>• Mention filters, sorting, or pagination requirements</li>
                    <li>• Include authentication details if needed</li>
                    <li>• Test your query before saving it for reuse</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
