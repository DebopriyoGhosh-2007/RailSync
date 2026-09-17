import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from './PasswordInput';
import { DepartmentSelector } from './DepartmentSelector';
import { DESIGNATIONS } from '@/domain/departments';
import { Department } from '@/auth/types';

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  employeeId: z.string().min(1, "Employee ID is required").regex(/^[a-zA-Z0-9]+$/, "Must be alphanumeric"),
  department: z.enum(["ENGINEERING", "SIGNAL_TELECOM", "TRACTION"] as const, { required_error: "Please select a department" }),
  designation: z.string().optional(),
  otherDesignation: z.string().optional(),
  zoneOrDivision: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[0-9]/, "Must contain a number").regex(/[A-Z]/, "Must contain an uppercase letter"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.designation === "Other" && (!data.otherDesignation || data.otherDesignation.trim() === "")) return false;
  return true;
}, {
  message: "Please specify your designation",
  path: ["otherDesignation"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      designation: DESIGNATIONS[0]
    }
  });

  const selectedDesignation = watch('designation');
  const watchPassword = watch('password');

  const onSubmit = async (data: RegisterFormValues) => {
    setGlobalError(null);
    try {
      const finalDesignation = data.designation === 'Other' ? data.otherDesignation : data.designation;
      
      await signUp(data.email, data.password, {
        fullName: data.fullName,
        employeeId: data.employeeId,
        department: data.department as Department,
        designation: finalDesignation,
        zoneOrDivision: data.zoneOrDivision,
      });
      
      // On success, redirect to raise-token
      navigate('/raise-token');
    } catch (error: any) {
      setGlobalError(error.message || "An unexpected error occurred during registration.");
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join RailSync to participate in operational planning.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {globalError && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {globalError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Full Name" required {...register("fullName")} error={errors.fullName?.message} />
          <Input label="Employee ID" required {...register("employeeId")} error={errors.employeeId?.message} />
        </div>

        <Controller
          name="department"
          control={control}
          render={({ field }) => (
            <DepartmentSelector value={field.value as Department} onChange={field.onChange} error={errors.department?.message} />
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="w-full">
            <label className="block text-sm font-medium mb-1 text-slate-700">Designation</label>
            <select
              className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.designation ? 'border-destructive' : ''}`}
              {...register("designation")}
            >
              {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {selectedDesignation === 'Other' ? (
            <Input label="Specify Designation" required {...register("otherDesignation")} error={errors.otherDesignation?.message} />
          ) : (
            <Input label="Zone / Division" {...register("zoneOrDivision")} error={errors.zoneOrDivision?.message} />
          )}
        </div>
        
        {selectedDesignation === 'Other' && (
          <div className="w-full">
            <Input label="Zone / Division" {...register("zoneOrDivision")} error={errors.zoneOrDivision?.message} />
          </div>
        )}

        <Input label="Work Email Address" type="email" required {...register("email")} error={errors.email?.message} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <PasswordInput 
            label="Password" 
            required 
            showStrength 
            value={watchPassword} 
            {...register("password")} 
            error={errors.password?.message} 
          />
          <PasswordInput 
            label="Confirm Password" 
            required 
            {...register("confirmPassword")} 
            error={errors.confirmPassword?.message} 
          />
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-11 text-base" isLoading={isSubmitting}>
            Create Account
          </Button>
        </div>
        
        <div className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
