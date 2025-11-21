import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ApiConnection } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import HintText from '@/components/ui/HintText'
import HintTooltip from '@/components/ui/HintTooltip'

type AuthType = 'none' | 'bearer' | 'basic' | 'api_key' | 'oauth2'

interface ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  connection?: ApiConnection | null
  onSuccess: () => void
}

export default function ConnectionModal({ isOpen, onClose, connection, onSuccess }: ConnectionModalProps) {
  const { user } = useAuth()
  const isEdit = Boolean(connection)

  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    base_url: '',
    auth_type: 'none' as AuthType,
    description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auth-specific fields
  const [bearerToken, setBearerToken] = useState('')
  const [basicUsername, setBasicUsername] = useState('')
  const [basicPassword, setBasicPassword] = useState('')
  const [apiKeyName, setApiKeyName] = useState('X-API-Key')
  const [apiKeyValue, setApiKeyValue] = useState('')

  useEffect(() => {
    if (isOpen && connection) {
      setFormData({
        name: connection.name,
        base_url: connection.base_url,
        auth_type: connection.auth_type,
        description: connection.description || '',
      })

      // Parse auth headers based on type
      const authHeaders = connection.auth_headers || {}
      if (connection.auth_type === 'bearer' && authHeaders.Authorization) {
        setBearerToken(authHeaders.Authorization.replace('Bearer ', ''))
      } else if (connection.auth_type === 'basic' && authHeaders.Authorization) {
        const decoded = atob(authHeaders.Authorization.replace('Basic ', ''))
        const [username, password] = decoded.split(':')
        setBasicUsername(username)
        setBasicPassword(password)
      } else if (connection.auth_type === 'api_key') {
        const key = Object.keys(authHeaders)[0]
        if (key) {
          setApiKeyName(key)
          setApiKeyValue(authHeaders[key])
        }
      }
    } else if (isOpen) {
      // Reset form for new connection
      setFormData({
        name: '',
        base_url: '',
        auth_type: 'none',
        description: '',
      })
      setBearerToken('')
      setBasicUsername('')
      setBasicPassword('')
      setApiKeyName('X-API-Key')
      setApiKeyValue('')
      setTestResult(null)
      setErrors({})
    }
  }, [isOpen, connection])

  const updateAuthHeaders = () => {
    const headers: Record<string, string> = {}

    switch (formData.auth_type) {
      case 'bearer':
        if (bearerToken) {
          headers.Authorization = `Bearer ${bearerToken}`
        }
        break
      case 'basic':
        if (basicUsername && basicPassword) {
          headers.Authorization = `Basic ${btoa(`${basicUsername}:${basicPassword}`)}`
        }
        break
      case 'api_key':
        if (apiKeyName && apiKeyValue) {
          headers[apiKeyName] = apiKeyValue
        }
        break
    }

    return headers
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Connection name is required'
    }

    if (!formData.base_url.trim()) {
      newErrors.base_url = 'Base URL is required'
    } else {
      try {
        new URL(formData.base_url)
      } catch {
        newErrors.base_url = 'Please enter a valid URL'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const testConnection = async () => {
    if (!formData.base_url) {
      setTestResult({ success: false, message: 'Please enter a base URL first' })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const headers = updateAuthHeaders()
      const response = await fetch(formData.base_url, {
        method: 'GET',
        headers: headers,
      })

      if (response.ok || response.status === 404) {
        setTestResult({
          success: true,
          message: `Connection successful! (Status: ${response.status})`,
        })
      } else {
        setTestResult({
          success: false,
          message: `Connection failed with status ${response.status}`,
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection failed: ${err.message}`,
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)
      const headers = updateAuthHeaders()
      const connectionData = {
        user_id: user?.id,
        name: formData.name,
        base_url: formData.base_url,
        auth_type: formData.auth_type,
        auth_headers: headers,
        description: formData.description,
      }

      if (isEdit && connection) {
        const { error } = await supabase
          .from('api_connections')
          .update(connectionData)
          .eq('id', connection.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('api_connections')
          .insert(connectionData)

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      alert(`Error saving connection: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Connection' : 'New API Connection'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <Input
                  label="Connection Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  placeholder="My API"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base URL <HintTooltip term="API" hint="Application Programming Interface - A way for different software applications to communicate with each other." size="sm" />
                  </label>
                  <input
                    type="url"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    placeholder="https://api.example.com"
                    className={`w-full px-3 py-2 border ${errors.base_url ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  />
                  {errors.base_url && (
                    <p className="mt-1 text-sm text-red-600">{errors.base_url}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    The base URL of your API (without trailing slash)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe what this API is used for..."
                  />
                </div>
              </div>
            </div>

            {/* Authentication */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Authentication <HintTooltip term="Authentication" hint="The process of proving your identity to an API using credentials like tokens or keys." size="sm" />
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authentication Type
                  </label>
                  <select
                    value={formData.auth_type}
                    onChange={(e) => setFormData({ ...formData, auth_type: e.target.value as AuthType })}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="api_key">API Key</option>
                    <option value="oauth2">OAuth 2.0 (Coming Soon)</option>
                  </select>
                  <div className="mt-2">
                    {formData.auth_type === 'bearer' && (
                      <HintText termKey="bearer token" className="text-xs" />
                    )}
                    {formData.auth_type === 'basic' && (
                      <HintText termKey="basic auth" className="text-xs" />
                    )}
                    {formData.auth_type === 'api_key' && (
                      <HintText termKey="api key" className="text-xs" />
                    )}
                    {formData.auth_type === 'oauth2' && (
                      <HintText termKey="oauth2" className="text-xs" />
                    )}
                  </div>
                </div>

                {/* Bearer Token */}
                {formData.auth_type === 'bearer' && (
                  <Input
                    label="Bearer Token"
                    type="password"
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    placeholder="your-bearer-token"
                    helperText="Will be sent as: Authorization: Bearer {token}"
                  />
                )}

                {/* Basic Auth */}
                {formData.auth_type === 'basic' && (
                  <>
                    <Input
                      label="Username"
                      type="text"
                      value={basicUsername}
                      onChange={(e) => setBasicUsername(e.target.value)}
                      placeholder="username"
                    />
                    <Input
                      label="Password"
                      type="password"
                      value={basicPassword}
                      onChange={(e) => setBasicPassword(e.target.value)}
                      placeholder="password"
                    />
                  </>
                )}

                {/* API Key */}
                {formData.auth_type === 'api_key' && (
                  <>
                    <Input
                      label="Header Name"
                      type="text"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                      placeholder="X-API-Key"
                      helperText="The name of the header to send the API key in"
                    />
                    <Input
                      label="API Key"
                      type="password"
                      value={apiKeyValue}
                      onChange={(e) => setApiKeyValue(e.target.value)}
                      placeholder="your-api-key"
                    />
                  </>
                )}

                {/* OAuth2 placeholder */}
                {formData.auth_type === 'oauth2' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      OAuth 2.0 authentication is coming soon! For now, please use one of the other authentication methods.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Test Connection */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={testing || !formData.base_url}
              >
                {testing ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>

              {testResult && (
                <div
                  className={`mt-4 p-4 flex items-start gap-3 ${
                    testResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testResult.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update Connection' : 'Create Connection')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
