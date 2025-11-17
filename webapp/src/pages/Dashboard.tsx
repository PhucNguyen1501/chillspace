import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Zap, FileText, Calendar, BarChart3, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { profile } = useAuth()

  const stats = [
    { title: 'API Connections', value: '0', icon: Zap, color: 'text-blue-600' },
    { title: 'Saved Queries', value: '0', icon: FileText, color: 'text-green-600' },
    { title: 'Active Jobs', value: '0', icon: Calendar, color: 'text-orange-600' },
    { title: 'API Calls This Month', value: '0', icon: BarChart3, color: 'text-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your API integrations.
          </p>
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

        {/* Quick Actions */}
        <Card className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/connections/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-5 h-5" />
                Add API Connection
              </Button>
            </Link>
            <Link to="/queries/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-5 h-5" />
                Create Query
              </Button>
            </Link>
            <Link to="/jobs/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-5 h-5" />
                Schedule Job
              </Button>
            </Link>
          </div>
        </Card>

        {/* Getting Started */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-accent-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Connect your first API</h3>
                <p className="text-gray-600 text-sm">
                  Add an API connection to start extracting data with natural language.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-accent-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Create your first query</h3>
                <p className="text-gray-600 text-sm">
                  Use natural language to generate API calls automatically.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-accent-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Automate with scheduling</h3>
                <p className="text-gray-600 text-sm">
                  Set up scheduled jobs to extract data automatically on your terms.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
