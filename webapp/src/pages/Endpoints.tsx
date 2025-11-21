import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Search, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ApiConnection, ApiEndpoint } from '@/types/database'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'

export default function Endpoints() {
  const { connectionId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [connection, setConnection] = useState<ApiConnection | null>(null)
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user && connectionId) {
      loadConnectionAndEndpoints()
    }
  }, [user, connectionId])

  const loadConnectionAndEndpoints = async () => {
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
        .order('method', { ascending: true })
        .order('path', { ascending: true })

      if (endpointsError) throw endpointsError
      setEndpoints(endpointsData || [])
    } catch (err: any) {
      alert(`Error loading data: ${err.message}`)
      navigate('/connections')
    } finally {
      setLoading(false)
    }
  }

  const filteredEndpoints = endpoints.filter((endpoint) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      endpoint.path.toLowerCase().includes(searchLower) ||
      endpoint.method.toLowerCase().includes(searchLower) ||
      (endpoint.description && endpoint.description.toLowerCase().includes(searchLower))
    )
  })

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-100 text-green-700 border-green-300',
      POST: 'bg-blue-100 text-blue-700 border-blue-300',
      PUT: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      DELETE: 'bg-red-100 text-red-700 border-red-300',
      PATCH: 'bg-purple-100 text-purple-700 border-purple-300',
    }
    return colors[method] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!connection) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <p className="text-gray-600">Connection not found</p>
          <Link to="/connections" className="mt-4 inline-block">
            <Button variant="primary">Back to Connections</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/connections')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Connections
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{connection.name}</h1>
            <p className="mt-2 text-gray-600">{connection.base_url}</p>
          </div>
          <Link to={`/connections/${connectionId}/query`}>
            <Button variant="primary" size="lg">
              <MessageSquare className="w-5 h-5 mr-2" />
              New Query
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Endpoints List */}
      {filteredEndpoints.length === 0 ? (
        <Card className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No endpoints found' : 'No Endpoints Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating your first query using natural language'}
            </p>
            <Link to={`/connections/${connectionId}/query`}>
              <Button variant="primary" size="lg">
                <MessageSquare className="w-5 h-5 mr-2" />
                Create First Query
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEndpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              onClick={() => navigate(`/connections/${connectionId}/query?endpoint=${endpoint.id}`)}
              className="cursor-pointer"
            >
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                {/* Method Badge */}
                <span
                  className={`px-3 py-1 rounded border font-mono text-sm font-semibold ${getMethodColor(
                    endpoint.method
                  )}`}
                >
                  {endpoint.method}
                </span>

                {/* Endpoint Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-gray-900 mb-1 break-all">
                    {endpoint.path}
                  </div>
                  {endpoint.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{endpoint.description}</p>
                  )}
                </div>

                {/* Action Button */}
                <Button variant="outline" size="sm" className="flex-shrink-0">
                  Query
                </Button>
              </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
