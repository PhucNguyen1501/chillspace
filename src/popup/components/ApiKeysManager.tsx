import { useState, useEffect } from 'react';
import { Key, Plus, Edit2, Trash2, Copy, Check } from 'lucide-react';
import { ApiKeysService, type ApiKey } from '../../lib/apiKeys';

export default function ApiKeysManager(): JSX.Element {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'bearer' as ApiKey['type'],
    value: '',
    headerName: 'X-API-Key',
    domain: '',
  });

  const apiKeysService = ApiKeysService.getInstance();

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const keys = await apiKeysService.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = apiKeysService.validateApiKey(formData);
      if (validation.length > 0) {
        alert('Please fix the following errors:\n' + validation.join('\n'));
        return;
      }

      if (editingKey) {
        await apiKeysService.updateApiKey(editingKey.id, formData);
      } else {
        await apiKeysService.saveApiKey(formData);
      }

      await loadApiKeys();
      resetForm();
    } catch (error) {
      console.error('Error saving API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (apiKey: ApiKey) => {
    setEditingKey(apiKey);
    setFormData({
      name: apiKey.name,
      type: apiKey.type,
      value: apiKey.value,
      headerName: apiKey.headerName || 'X-API-Key',
      domain: apiKey.domain || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    
    try {
      await apiKeysService.deleteApiKey(id);
      await loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const handleCopy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bearer',
      value: '',
      headerName: 'X-API-Key',
      domain: '',
    });
    setEditingKey(null);
    setShowAddForm(false);
  };

  const maskValue = (value: string) => {
    if (value.length <= 8) return '•'.repeat(value.length);
    return value.slice(0, 4) + '•'.repeat(value.length - 8) + value.slice(-4);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Key
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              {editingKey ? 'Edit API Key' : 'Add API Key'}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                placeholder="e.g., OpenAI API Key"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ApiKey['type'] })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                disabled={loading}
              >
                <option value="bearer">Bearer Token</option>
                <option value="apikey">API Key (Header)</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            {formData.type === 'apikey' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Header Name
                </label>
                <input
                  type="text"
                  value={formData.headerName}
                  onChange={(e) => setFormData({ ...formData, headerName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                  placeholder="e.g., X-API-Key"
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {formData.type === 'basic' ? 'Credentials (username:password)' : 'API Key Value'}
              </label>
              <input
                type="password"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                placeholder={formData.type === 'basic' ? 'username:password' : 'sk-...'}
                disabled={loading}
              />
              {formData.type === 'basic' && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter credentials in format: username:password
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Domain (Optional)
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                placeholder="api.example.com"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Only use this key for requests to this domain
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingKey ? 'Update' : 'Save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* API Keys List */}
      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-4">
              No API keys configured yet
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-md transition-colors"
            >
              Add Your First API Key
            </button>
          </div>
        ) : (
          apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="bg-white border border-gray-200 rounded-md p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                  <p className="text-xs text-gray-500">
                    {apiKey.type.toUpperCase()} • Created {new Date(apiKey.createdAt).toLocaleDateString()}
                  </p>
                  {apiKey.domain && (
                    <p className="text-xs text-gray-500">Domain: {apiKey.domain}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(apiKey.value, apiKey.id)}
                    className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
                    title="Copy value"
                  >
                    {copiedId === apiKey.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(apiKey)}
                    className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(apiKey.id)}
                    className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                {maskValue(apiKey.value)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• API keys are stored locally in your browser (not in the cloud)</li>
          <li>• When you execute a query, matching keys are automatically added as headers</li>
          <li>• Domain restrictions ensure keys are only sent to specific APIs</li>
          <li>• Support for Bearer tokens, API keys, and Basic authentication</li>
        </ul>
      </div>
    </div>
  );
}
