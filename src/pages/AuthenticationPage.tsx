import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/redux';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/firebaseService';
import { setUser, setError } from '../store/userSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';

interface AuthFormData {
  email: string;
  password: string;
}

const AuthenticationPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AuthFormData>();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const user = await signInWithGoogle();
      dispatch(setUser({ uid: user.uid, email: user.email || '' }));
      navigate('/onboarding');
    } catch (error) {
      dispatch(setError('Failed to sign in with Google'));
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    try {
      setIsLoading(true);
      let user;
      
      if (isSignUp) {
        user = await signUpWithEmail(data.email, data.password);
      } else {
        user = await signInWithEmail(data.email, data.password);
      }
      
      dispatch(setUser({ uid: user.uid, email: user.email || '' }));
      navigate('/onboarding');
    } catch (error: any) {
      let errorMessage = 'Authentication failed';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
    dispatch(setError(''));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">
                      {isSignUp ? 'Create an account' : 'Welcome back'}
                    </h1>
                    <p className="text-muted-foreground text-balance">
                      {isSignUp ? 'Enter your email below to create your account' : 'Login to your Evolve Study account'}
                    </p>
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      {!isSignUp && (
                        <a
                          href="#"
                          className="ml-auto text-sm underline-offset-2 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      )}
                    </div>
                    <Input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      id="password"
                      type="password"
                      required
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Login')}
                  </Button>
                  
                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Button 
                      variant="outline" 
                      type="button" 
                      className="w-full"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      Google
                    </Button>
                  </div>
                  
                  <div className="text-center text-sm">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      {isSignUp ? 'Sign in' : 'Sign up'}
                    </button>
                  </div>
                </div>
              </form>
              
              <div className="bg-muted relative hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Evolve Study Platform</h3>
                    <p className="text-white/80">
                      "This study platform has provided invaluable insights into user behavior and preferences, helping us deliver better experiences to our participants." - Sofia Davis
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-muted-foreground text-center text-xs text-balance">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationPage;
