import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { LogOut, Settings, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    setIsOpen(false);
    const toastId = toast.loading('Signing out...');
    
    try {
      const { error } = await signOut();
      
      if (error) {
        toast.error('Sign out failed', {
          id: toastId,
          description: error.message,
        });
      } else {
        toast.success('Signed out successfully', {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error('Sign out failed', {
        id: toastId,
        description: 'An unexpected error occurred',
      });
    }
  };

  const getUserEmail = () => {
    return user?.email || 'user@example.com';
  };

  const getUserInitial = () => {
    const email = getUserEmail();
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors"
      >
        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
          {getUserInitial()}
        </div>
        <span className="text-sm truncate max-w-[120px]">{getUserEmail()}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-20">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium truncate">{getUserEmail()}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Open settings modal or navigate to settings
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Settings
              </button>
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent/50 transition-colors text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
