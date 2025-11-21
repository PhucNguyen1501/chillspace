import { useState, useRef, useEffect } from 'react'
import { LogOut, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export default function UserProfileDropdown() {
  const { user, profile, signOut } = useAuth()
  const { addToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setIsOpen(false)
    const { error } = await signOut()
    if (error) {
      addToast('Error signing out. Please try again.', 'error')
    } else {
      addToast('Successfully signed out!', 'success')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center">
          {profile?.full_name ? (
            profile.full_name.charAt(0).toUpperCase()
          ) : (
            user.email?.charAt(0).toUpperCase()
          )}
        </div>

        {/* User Info */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {profile?.full_name || 'User'}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-32">
            {user.email}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
            {profile?.company && (
              <p className="text-xs text-gray-400 mt-1">
                {profile.company}
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false)
                // TODO: Open settings modal or navigate to settings
                console.log('Settings clicked')
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
