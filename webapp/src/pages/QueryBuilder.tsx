import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Send, Play, Save, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ApiConnection, ApiEndpoint } from '@/types/database'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'

export default function QueryBuilder() {
  const { connectionId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [connection, setConnection] = useState<ApiConnection | null>(null)
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  
  // Query state
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('')
  const [generatedRequest, setGeneratedRequest] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (user && connectionId) {
      loadData()
    }
  }, [user, connectionId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load connection
      const { data: connData, error: connError } = await supabase
        .from('api_connections')
        .select('*')
        .eq('id', connectionId)
        .single()

      if (connError) throw connError
      setConnection(connData)

      // Load endpoints
      const { data: endpointsData, error: endpointsError } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('connection_id', connectionId)

      if (endpointsError) throw endpointsError
      setEndpoints(endpointsData || [])

      // Load specific endpoint if provided
      const endpointId = searchParams.get('endpoint')
      if (endpointId && endpointsData) {
        const endpoint = endpointsData.find((e) => e.id === endpointId)
        if (endpoint) {
          setSelectedEndpoint(endpoint)
        }
      }
    } catch (err: any) {
      alert(`Error loading data: ${err.message}`)
      navigate('/connections')
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
        execution_time_ms: 0, // TODO: Track actual time
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!connection) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/connections/${connectionId}/endpoints`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Endpoints
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Query Builder</h1>
        <p className="mt-2 text-gray-600">Describe what you want in natural language</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* Connection Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection</h2>
            <p className="text-sm text-gray-600">{connection.name}</p>
            <p className="text-xs text-gray-500 mt-1">{connection.base_url}</p>
          </Card>

          {/* Endpoint Selection */}
          {endpoints.length > 0 && (
            <Card>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Endpoint (Optional)
              </label>
              <select
                value={selectedEndpoint?.id || ''}
                onChange={(e) => {
                  const endpoint = endpoints.find((ep) => ep.id === e.target.value)
                  setSelectedEndpoint(endpoint || null)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">-- Choose an endpoint --</option>
                {endpoints.map((endpoint) => (
                  <option key={endpoint.id} value={endpoint.id}>
                    {endpoint.method} {endpoint.path}
                  </option>
                ))}
              </select>
            </Card>
          )}

          {/* Natural Language Input */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe Your Query
            </label>
            <textarea
              value={naturalLanguageQuery}
              onChange={(e) => setNaturalLanguageQuery(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Get all users with role 'admin' created in the last 7 days..."
            />
            <div className="mt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={generateQuery}
                disabled={processing || !naturalLanguageQuery.trim()}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Generate Request
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Generated Request */}
          {generatedRequest && (
            <Card>
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Generated Request</h2>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(generatedRequest, null, 2))}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {copySuccess ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(generatedRequest, null, 2)}
              </pre>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="primary"
                  onClick={executeQuery}
                  disabled={executing}
                  className="flex-1"
                >
                  {executing ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Executing...
                    </>
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
            </Card>
          )}
        </div>

        {/* Right Column - Output */}
        <div className="space-y-6">
          {/* Execution Result */}
          {executionResult && (
            <Card>
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Response</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    executionResult.success
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {executionResult.status || 'Error'}
                </span>
              </div>

              {executionResult.error ? (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800 text-sm">{executionResult.error}</p>
                </div>
              ) : (
                <>
                  {/* Response Data */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Data</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                      {JSON.stringify(executionResult.data, null, 2)}
                    </pre>
                  </div>

                  {/* Response Headers */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Headers</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-32">
                      {JSON.stringify(executionResult.headers, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </Card>
          )}

          {/* Helper Tips */}
          {!executionResult && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">💡 Tips</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Be specific about what data you want to retrieve or modify</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Mention filters, sorting, or pagination requirements</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Include authentication details if needed</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Test your query before saving it for reuse</span>
                </li>
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
