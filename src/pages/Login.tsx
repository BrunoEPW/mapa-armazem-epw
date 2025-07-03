import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Home, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EPWLogo from '@/components/ui/epw-logo';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, requestPasswordReset } = useAuth();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/produtos');
    } else {
      setError('Password incorreta');
    }
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    requestPasswordReset(email);
    setShowReset(false);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-warehouse-bg flex items-center justify-center p-8">
      <div className="absolute top-8 left-8">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/ce6ad3d6-6728-414c-b327-428c5cd38f81.png" 
              alt="EPW Logo" 
              className="h-8 sm:h-10"
            />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Lock className="w-6 h-6" />
            Gestão de Produtos
          </CardTitle>
          <p className="text-muted-foreground">Acesso restrito - Introduza a password</p>
        </CardHeader>
        
        <CardContent>
          {!showReset ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Introduza a password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <Button type="submit" className="w-full">
                Entrar
              </Button>

              <Button 
                type="button" 
                variant="link" 
                className="w-full text-sm"
                onClick={() => setShowReset(true)}
              >
                Esqueci-me da password
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label htmlFor="email">Email para reset</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@epw.pt"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Enviar Reset
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowReset(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;