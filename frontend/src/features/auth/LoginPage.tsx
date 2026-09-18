import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/auth/firebase';
import { useAuth, mapAuthError } from '@/auth/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from './PasswordInput';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError(null);
    try {
      await signIn(data.email, data.password);
      // On success, redirect to raise-token
      navigate('/raise-token');
    } catch (error: any) {
      setGlobalError(error.message || "Invalid credentials.");
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues("email");
    if (!email || errors.email) {
      setGlobalError("Please enter a valid email address first to reset your password.");
      return;
    }
    
    setIsResetting(true);
    setGlobalError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error) {
      setGlobalError(mapAuthError(error));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AuthLayout title="Sign In" subtitle="Access the RailSync operational intake.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {globalError && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {globalError}
          </div>
        )}
        
        {resetSent && (
          <div className="p-3 bg-green-50 text-green-800 text-sm rounded-md border border-green-200">
            Password reset email sent! Check your inbox.
          </div>
        )}

        <Input label="Work Email Address" type="email" required {...register("email")} error={errors.email?.message} />

        <div>
          <PasswordInput 
            label="Password" 
            required 
            {...register("password")} 
            error={errors.password?.message} 
          />
          <div className="flex justify-end mt-2">
            <button 
              type="button" 
              onClick={handleForgotPassword}
              disabled={isResetting}
              className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
            >
              {isResetting ? "Sending..." : "Forgot password?"}
            </button>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-11 text-base" isLoading={isSubmitting}>
            Sign In
          </Button>
        </div>
        
        <div className="text-center text-sm text-slate-500 mt-6">
          Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Register now</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
