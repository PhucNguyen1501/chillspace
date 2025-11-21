import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ApiConnection } from '@/types/database'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'

export default function Connections() {
  const { user } = useAuth()
  const [connections, setConnections] = useState<ApiConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadConnections()
    }
  }, [user])

  const loadConnections = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('api_connections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setConnections(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection? All associated endpoints and queries will also be deleted.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('api_connections')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadConnections()
    } catch (err: any) {
      alert(`Error deleting connection: ${err.message}`)
    }
  }

  const getAuthTypeBadge = (authType: string) => {
    const colors: Record<string, string> = {
      none: 'bg-gray-100 text-gray-700',
      bearer: 'bg-blue-100 text-blue-700',
      basic: 'bg-green-100 text-green-700',
      api_key: 'bg-purple-100 text-purple-700',
      oauth2: 'bg-orange-100 text-orange-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[authType] || colors.none}`}>
        {authType.toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Connections</h1>
          <p className="mt-2 text-gray-600">Manage your API connections and authentication</p>
        </div>
        <Link to="/connections/new">
          <Button variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Connection
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Connections Grid */}
      {connections.length === 0 ? (
        <Card className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No API Connections Yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first API connection. Connect to REST APIs, GraphQL endpoints, and more.
            </p>
            <Link to="/connections/new">
              <Button variant="primary" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Connection
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((connection) => (
            <Card key={connection.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col h-full">
                {/* Connection Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {connection.name}
                    </h3>
                    <p className="text-sm text-gray-500 break-all">
                      {connection.base_url}
                    </p>
                  </div>
                  {getAuthTypeBadge(connection.auth_type)}
                </div>

                {/* Description */}
                {connection.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {connection.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="text-xs text-gray-500 mb-4 mt-auto">
                  Created {new Date(connection.created_at).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Link to={`/connections/${connection.id}/endpoints`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Endpoints
                    </Button>
                  </Link>
                  <Link to={`/connections/${connection.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteConnection(connection.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
