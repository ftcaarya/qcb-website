'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// In a real app, you would use a more robust authentication system
// Use environment variable for the admin password
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Cloudy@69'; // Fallback for local development

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // Check if user is already authenticated (using localStorage)
  useEffect(() => {
    const checkAuth = () => {
      const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('qcb_admin_auth') : null;
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('qcb_admin_auth', 'true');
    } else {
      setError('Invalid password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('qcb_admin_auth');
    router.push('/');
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold italic text-purple-900 tracking-tight">Queen City Blends</h1>
            <p className="text-purple-600 font-medium">Admin Login</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-gray-700 mb-2 font-medium" htmlFor="password">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render children with logout button if authenticated
  return (
    <div>
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white py-2 px-4 flex justify-between items-center">
        <span className="text-sm">Queen City Blends Admin</span>
        <button
          onClick={handleLogout}
          className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
        >
          Logout
        </button>
      </div>
      {children}
    </div>
  );
} 
