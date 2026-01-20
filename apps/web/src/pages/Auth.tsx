import { SignIn, SignUp } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useStore } from '../stores/app';
import { isClerkConfigured } from '../lib/auth/client';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useStore();
  
  const isSignup = location.pathname === '/auth/signup';

  const logoSrc = resolvedTheme === 'dark' 
    ? '/sanctuary-icon-dark.png' 
    : '/sanctuary-icon-light.png';

  // If Clerk is not configured, show demo mode message
  if (!isClerkConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Demo Mode</h1>
          <p className="text-muted-foreground mb-6">
            Authentication is not configured. Running in demo mode with automatic login.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        <div className="relative z-10 max-w-lg text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Sanctuary</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Create beautiful worship presentations with ease. Scripture, songs, and slides — all in one place.
          </p>
          <div className="flex justify-center gap-8 mt-12 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">10+</div>
              <div>Bible Versions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">100+</div>
              <div>Worship Songs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">∞</div>
              <div>Presentations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Clerk Auth */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src={logoSrc}
                alt="Sanctuary" 
                className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-2xl font-bold">Sanctuary</h1>
          </div>

          {/* Clerk Sign In / Sign Up */}
          <div className="flex justify-center">
            {isSignup ? (
              <SignUp 
                routing="path" 
                path="/auth/signup"
                signInUrl="/auth"
                fallbackRedirectUrl="/"
                appearance={{
                  baseTheme: undefined,
                  variables: {
                    colorBackground: '#ffffff',
                    colorText: '#000000',
                    colorPrimary: '#6366f1',
                  },
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-xl border bg-white',
                    headerTitle: 'text-2xl font-semibold text-gray-900',
                    headerSubtitle: 'text-gray-600',
                    socialButtonsBlockButton: 'border border-gray-200 hover:bg-gray-50 text-gray-700',
                    formButtonPrimary: 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20',
                    footerActionLink: 'text-primary hover:text-primary/80',
                    formFieldInput: 'bg-white border-gray-300 text-gray-900',
                    formFieldLabel: 'text-gray-700',
                    dividerLine: 'bg-gray-200',
                    dividerText: 'text-gray-500',
                  },
                }}
              />
            ) : (
              <SignIn 
                routing="path" 
                path="/auth"
                signUpUrl="/auth/signup"
                fallbackRedirectUrl="/"
                appearance={{
                  baseTheme: undefined,
                  variables: {
                    colorBackground: '#ffffff',
                    colorText: '#000000',
                    colorPrimary: '#6366f1',
                  },
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-xl border bg-white',
                    headerTitle: 'text-2xl font-semibold text-gray-900',
                    headerSubtitle: 'text-gray-600',
                    socialButtonsBlockButton: 'border border-gray-200 hover:bg-gray-50 text-gray-700',
                    formButtonPrimary: 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20',
                    footerActionLink: 'text-primary hover:text-primary/80',
                    formFieldInput: 'bg-white border-gray-300 text-gray-900',
                    formFieldLabel: 'text-gray-700',
                    dividerLine: 'bg-gray-200',
                    dividerText: 'text-gray-500',
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
