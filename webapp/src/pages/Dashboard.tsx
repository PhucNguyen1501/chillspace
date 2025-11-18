import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Zap, FileText, Calendar, BarChart3, Plus, Database, Search, Pause, Play, Square, MessageSquare, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ApiConnection } from '@/types/database'
import ConnectionModal from '@/components/modals/ConnectionModal'
import QueryBuilderModal from '@/components/modals/QueryBuilderModal'
import EnhancedConnectionModal from '@/components/modals/EnhancedConnectionModal'
import UserProfileDropdown from '@/components/user/UserProfileDropdown'
import { extensionService } from '@/services/ExtensionService'

export default function Dashboard() {
  const { profile, user } = useAuth()
  const [connections, setConnections] = useState<ApiConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConnections, setSelectedConnections] = useState<string[]>([])

  // Modal states
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false)
  const [isQueryBuilderModalOpen, setIsQueryBuilderModalOpen] = useState(false)
  const [isEnhancedConnectionModalOpen, setIsEnhancedConnectionModalOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<ApiConnection | null>(null)
  const [selectedConnectionForQuery, setSelectedConnectionForQuery] = useState<ApiConnection | null>(null)
  const [unprocessedDocCount, setUnprocessedDocCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadConnections()
      // Start polling for parsed documentation
      const checkUnprocessedDocs = async () => {
        const count = await extensionService.getUnprocessedCount()
        setUnprocessedDocCount(count)
      }
      
      checkUnprocessedDocs()
      const interval = setInterval(checkUnprocessedDocs, 3000)
      
      return () => clearInterval(interval)
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
      console.error('Error loading connections:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredConnections = connections.filter((connection) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      connection.name.toLowerCase().includes(searchLower) ||
      connection.base_url.toLowerCase().includes(searchLower) ||
      (connection.description && connection.description.toLowerCase().includes(searchLower))
    )
  })

  const toggleConnectionSelection = (connectionId: string) => {
    setSelectedConnections(prev => 
      prev.includes(connectionId) 
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    )
  }

  const selectAllConnections = () => {
    if (selectedConnections.length === filteredConnections.length) {
      setSelectedConnections([])
    } else {
      setSelectedConnections(filteredConnections.map(conn => conn.id))
    }
  }

  const suspendConnections = async () => {
    // TODO: Implement suspend functionality
    alert(`Suspend functionality coming soon for ${selectedConnections.length} connections`)
  }

  const resumeConnections = async () => {
    // TODO: Implement resume functionality
    alert(`Resume functionality coming soon for ${selectedConnections.length} connections`)
  }

  const stopConnections = async () => {
    // TODO: Implement stop functionality
    alert(`Stop functionality coming soon for ${selectedConnections.length} connections`)
  }

  // Modal handlers
  const openConnectionModal = (connection?: ApiConnection) => {
    setEditingConnection(connection || null)
    setIsConnectionModalOpen(true)
  }

  const closeConnectionModal = () => {
    setIsConnectionModalOpen(false)
    setEditingConnection(null)
  }

  const openQueryBuilderModal = (connection: ApiConnection) => {
    setSelectedConnectionForQuery(connection)
    setIsQueryBuilderModalOpen(true)
  }

  const closeQueryBuilderModal = () => {
    setIsQueryBuilderModalOpen(false)
    setSelectedConnectionForQuery(null)
  }

  const onConnectionSuccess = () => {
    loadConnections()
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

  const stats = [
    { title: 'API Connections', value: connections.length.toString(), icon: Zap, color: 'text-blue-600' },
    { title: 'Saved Queries', value: '0', icon: FileText, color: 'text-green-600' },
    { title: 'Active Jobs', value: '0', icon: Calendar, color: 'text-orange-600' },
    { title: 'API Calls This Month', value: '0', icon: BarChart3, color: 'text-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your API integrations.
            </p>
          </div>
          <UserProfileDropdown />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </Card>
            )
          })}
        </div>

        {/* API Connections Management */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">API Connections</h2>
            <div className="flex gap-3">
              {unprocessedDocCount > 0 && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setIsEnhancedConnectionModalOpen(true)}
                  className="relative"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import from Extension
                  {unprocessedDocCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                      {unprocessedDocCount}
                    </span>
                  )}
                </Button>
              )}
              <Button 
                variant="primary" 
                size="sm"
              onClick={() => openConnectionModal()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search connections..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedConnections.length > 0 && (
            <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-700">
                  {selectedConnections.length} connection{selectedConnections.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={suspendConnections}>
                    <Pause className="w-4 h-4 mr-1" />
                    Suspend
                  </Button>
                  <Button variant="outline" size="sm" onClick={resumeConnections}>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                  <Button variant="outline" size="sm" onClick={stopConnections} className="text-red-600 hover:text-red-700">
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Connections List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading connections...</p>
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'No connections found matching your search' : 'No API connections yet'}
              </p>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => openConnectionModal()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Connection
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <div className="flex items-center gap-3 p-2 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedConnections.length === filteredConnections.length && filteredConnections.length > 0}
                  onChange={selectAllConnections}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select all ({filteredConnections.length})
                </span>
              </div>

              {/* Connection Items */}
              {filteredConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedConnections.includes(connection.id)}
                    onChange={() => toggleConnectionSelection(connection.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{connection.name}</h3>
                      {getAuthTypeBadge(connection.auth_type)}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{connection.base_url}</p>
                    {connection.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{connection.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openQueryBuilderModal(connection)}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openConnectionModal(connection)}
                    >
                      <Database className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          </Card>

          {/* Modals */}
          <ConnectionModal
            isOpen={isConnectionModalOpen}
            onClose={closeConnectionModal}
            connection={editingConnection}
            onSuccess={onConnectionSuccess}
          />

          <QueryBuilderModal
            isOpen={isQueryBuilderModalOpen}
            onClose={closeQueryBuilderModal}
            connection={selectedConnectionForQuery}
          />

          <EnhancedConnectionModal
            isOpen={isEnhancedConnectionModalOpen}
            onClose={() => setIsEnhancedConnectionModalOpen(false)}
            onSuccess={onConnectionSuccess}
          />
        </div>
      </div>
    )
}
