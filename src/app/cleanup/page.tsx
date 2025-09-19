'use client';

import { useState } from 'react';

export default function SimpleCleanupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [adminKey, setAdminKey] = useState('');

  const quickCleanup = async () => {
    if (!adminKey.trim()) {
      setResult('❌ Please enter your admin key');
      return;
    }

    setLoading(true);
    setResult('🔄 Cleaning up old appointments...');

    try {
      const response = await fetch('/api/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cleanup-completed',
          hoursOld: 2,
          adminKey: adminKey.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(`✅ Success! Deleted ${data.result.deletedCount} old appointments.`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: Please try again`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Quick Cleanup
          </h1>
          <p className="text-gray-600">
            Remove old completed appointments to keep your database clean
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Key
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your admin key"
              onKeyPress={(e) => e.key === 'Enter' && quickCleanup()}
            />
          </div>

          <button
            onClick={quickCleanup}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Cleaning...
              </div>
            ) : (
              '🧹 Clean Old Appointments'
            )}
          </button>

          {result && (
            <div className={`p-3 rounded-md text-sm ${
              result.startsWith('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : result.startsWith('❌')
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {result}
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium text-gray-900 mb-2">What this does:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Removes appointments that finished 2+ hours ago</li>
            <li>• Keeps your database clean and fast</li>
            <li>• Safe - only removes truly completed appointments</li>
            <li>• Run this weekly for best results</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/admin"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}