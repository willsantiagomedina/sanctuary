import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Church, Sparkles } from 'lucide-react';
import { Button, Input, Label, cn, Card, CardContent } from '@sanctuary/ui';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../stores/app';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuth();
  const { resolvedTheme } = useStore();
  
  const isSignup = location.pathname === '/auth/signup';
  const [mode, setMode] = useState<'login' | 'signup'>(isSignup ? 'signup' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, formData.name);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logoSrc = resolvedTheme === 'dark' 
    ? '/sanctuary-icon-dark.png' 
    : '/sanctuary-icon-light.png';

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

      {/* Right side - Auth form */}
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

          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold">
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {mode === 'login' ? 'Sign in to your account' : 'Get started with Sanctuary'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@church.org"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10 h-11"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="org" className="text-sm font-medium">Church / Organization <span className="text-muted-foreground">(Optional)</span></Label>
                    <div className="relative mt-1.5">
                      <Church className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="org"
                        type="text"
                        placeholder="Community Church"
                        value={formData.organizationName}
                        onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? (
                    <div className="spinner mr-2" />
                  ) : null}
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                {mode === 'login' ? (
                  <p className="text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => setMode('signup')}
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => setMode('login')}
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Demo mode notice */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Demo mode: Use any email and password (min 6 chars) to sign in
          </p>
        </div>
      </div>
    </div>
  );
}
