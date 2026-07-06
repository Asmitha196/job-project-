import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, AlertCircle } from 'lucide-react';

const Register: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const watchPassword = watch('password');

  const onSubmit = async (data: any) => {
    setLoadingState(true);
    setApiError(null);
    try {
      await registerAuth(data.email, data.fullName, data.password);
      navigate('/');
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail;
      setApiError(
        typeof detail === 'string' 
          ? detail 
          : 'Failed to create account. Please check your credentials or verify if the email is already in use.'
      );
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center space-y-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Cpu className="h-6 w-6 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Get Started</h2>
          <p className="text-sm text-slate-400">Create a premium AI JobMatch account</p>
        </div>

        {apiError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-start space-x-3 mb-6 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              {...register('fullName', { required: 'Full name is required' })}
              className={`w-full bg-slate-950/60 border ${errors.fullName ? 'border-red-500/40' : 'border-slate-800'} focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none`}
              placeholder="Alex Johnson"
            />
            {errors.fullName && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center space-x-1">
                <span>⚠</span> <span>{errors.fullName.message}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address format'
                }
              })}
              className={`w-full bg-slate-950/60 border ${errors.email ? 'border-red-500/40' : 'border-slate-800'} focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none`}
              placeholder="alex@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center space-x-1">
                <span>⚠</span> <span>{errors.email.message}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
              className={`w-full bg-slate-950/60 border ${errors.password ? 'border-red-500/40' : 'border-slate-800'} focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center space-x-1">
                <span>⚠</span> <span>{errors.password.message}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword', { 
                required: 'Confirm password is required',
                validate: value => value === watchPassword || 'Passwords do not match'
              })}
              className={`w-full bg-slate-950/60 border ${errors.confirmPassword ? 'border-red-500/40' : 'border-slate-800'} focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center space-x-1">
                <span>⚠</span> <span>{errors.confirmPassword.message}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loadingState}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl py-3 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:scale-100 flex items-center justify-center mt-6"
          >
            {loadingState ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-all">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
