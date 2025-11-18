import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'

type AuthType = 'none' | 'bearer' | 'basic' | 'api_key' | 'oauth2'

interface ConnectionFormData {
  name: string
  base_url: string
  auth_type: AuthType
  auth_headers: Record<string, string>
  description: string
}

export default function ConnectionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: '',
    base_url: '',
    auth_type: 'none',
    auth_headers: {},
    description: '',
  })
  const [errors, setErrors] = useState<Partial<ConnectionFormData>>({})

  // Auth-specific fields
  const [bearerToken, setBearerToken] = useState('')
  const [basicUsername, setBasicUsername] = useState('')
  const [basicPassword, setBasicPassword] = useState('')
  const [apiKeyName, setApiKeyName] = useState('X-API-Key')
  const [apiKeyValue, setApiKeyValue] = useState('')

  useEffect(() => {
    if (isEdit && id) {
      loadConnection(id)
    }
  }, [isEdit, id])

  const loadConnection = async (connectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('api_connections')
        .select('*')
        .eq('id', connectionId)
        .single()

      if (error) throw error

      setFormData({
        name: data.name,
        base_url: data.base_url,
        auth_type: data.auth_type,
        auth_headers: data.auth_headers || {},
        description: data.description || '',
      })

      // Parse auth headers based on type
      if (data.auth_type === 'bearer' && data.auth_headers?.Authorization) {
        setBearerToken(data.auth_headers.Authorization.replace('Bearer ', ''))
      } else if (data.auth_type === 'basic' && data.auth_headers?.Authorization) {
        const decoded = atob(data.auth_headers.Authorization.replace('Basic ', ''))
        const [username, password] = decoded.split(':')
        setBasicUsername(username)
        setBasicPassword(password)
      } else if (data.auth_type === 'api_key') {
        const key = Object.keys(data.auth_headers || {})[0]
        if (key) {
          setApiKeyName(key)
          setApiKeyValue(data.auth_headers[key])
        }
      }
    } catch (err: any) {
      alert(`Error loading connection: ${err.message}`)
      navigate('/connections')
    } finally {
      setLoading(false)
    }
  }

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
      case 'oauth2':
        // OAuth2 will be handled separately in future
        break
      case 'none':
      default:
        break
    }

    return headers
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ConnectionFormData> = {}

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
        // 404 is ok - it means we reached the server
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
      const headers = updateAuthHeaders()
      const connectionData = {
        user_id: user?.id,
        name: formData.name,
        base_url: formData.base_url,
        auth_type: formData.auth_type,
        auth_headers: headers,
        description: formData.description,
      }

      if (isEdit && id) {
        const { error } = await supabase
          .from('api_connections')
          .update(connectionData)
          .eq('id', id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('api_connections')
          .insert(connectionData)

        if (error) throw error
      }

      navigate('/connections')
    } catch (err: any) {
      alert(`Error saving connection: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/connections')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Connections
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Connection' : 'New API Connection'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit ? 'Update your API connection details' : 'Add a new API to connect to'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
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

              <Input
                label="Base URL"
                type="url"
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                error={errors.base_url}
                placeholder="https://api.example.com"
                helperText="The base URL of your API (without trailing slash)"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe what this API is used for..."
                />
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authentication Type
                </label>
                <select
                  value={formData.auth_type}
                  onChange={(e) => setFormData({ ...formData, auth_type: e.target.value as AuthType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="none">None</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="api_key">API Key</option>
                  <option value="oauth2">OAuth 2.0 (Coming Soon)</option>
                </select>
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
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                className={`mt-4 p-4 rounded-lg flex items-start ${
                  testResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                )}
                <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                  {testResult.message}
                </p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Button type="submit" variant="primary" size="lg">
              {isEdit ? 'Update Connection' : 'Create Connection'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/connections')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
