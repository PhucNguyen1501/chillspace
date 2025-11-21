import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  if (!isOpen) return null;

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-sm mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-accent/50 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {mode === 'login' ? (
          <LoginForm onToggleMode={handleToggleMode} onClose={onClose} />
        ) : (
          <SignupForm onToggleMode={handleToggleMode} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
