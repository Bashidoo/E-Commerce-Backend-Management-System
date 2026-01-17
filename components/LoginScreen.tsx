import React, { useState } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Database client not initialized");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        
        showNotification('success', 'Logged in successfully');
    } catch (err: any) {
        showNotification('error', err.message || 'Failed to login');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-8">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">Welcome Back</h2>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">
                    Sign in to access the Order Management System
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                placeholder="admin@store.com"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : "Sign In"}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Protected by Supabase Row Level Security
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LoginScreen;