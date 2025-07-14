'use client';

import { useState } from 'react';

interface CleanupStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  pastAppointments: number;
}

interface CleanupResult {
  deletedCount: number;
}

export default function CleanupManager() {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState('');

  const fetchStats = async () => {
    if (!adminKey) {
      alert('Please enter admin key');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/cleanup?adminKey=${encodeURIComponent(adminKey)}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Error fetching stats: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const performCleanup = async (action: string, options: any = {}) => {
    if (!adminKey) {
      alert('Please enter admin key');
      return;
    }

    if (!confirm(`Are you sure you want to perform ${action} cleanup?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminKey,
          ...options
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Cleanup completed! Deleted ${data.result.deletedCount} appointments.`);
        setLastCleanup(data.timestamp);
        fetchStats(); // Refresh stats
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Error performing cleanup: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Appointment Cleanup Manager</h2>
      
      {/* Admin Key Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Admin Key
        </label>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter admin key for cleanup operations"
        />
      </div>

      {/* Stats Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Current Statistics</h3>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Stats'}
          </button>
        </div>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-800">{stats.confirmed}</div>
              <div className="text-sm text-green-600">Confirmed</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-800">{stats.cancelled}</div>
              <div className="text-sm text-red-600">Cancelled</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-800">{stats.pastAppointments}</div>
              <div className="text-sm text-orange-600">Past</div>
            </div>
          </div>
        )}
      </div>

      {/* Cleanup Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Cleanup Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Completed Appointments */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Completed Appointments</h4>
            <p className="text-sm text-gray-600 mb-3">
              Remove appointments that finished 2+ hours ago
            </p>
            <button
              onClick={() => performCleanup('cleanup-completed', { hoursOld: 2 })}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Clean Completed
            </button>
          </div>

          {/* Past Appointments */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Past Appointments</h4>
            <p className="text-sm text-gray-600 mb-3">
              Remove all appointments from yesterday and earlier
            </p>
            <button
              onClick={() => performCleanup('cleanup-past', { daysOld: 1 })}
              disabled={loading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              Clean Past
            </button>
          </div>

          {/* Cancelled Appointments */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Old Cancelled</h4>
            <p className="text-sm text-gray-600 mb-3">
              Remove cancelled appointments older than 7 days
            </p>
            <button
              onClick={() => performCleanup('cleanup-by-status', { 
                daysOld: 7, 
                statuses: ['cancelled'] 
              })}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Clean Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Last Cleanup Info */}
      {lastCleanup && (
        <div className="mt-6 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            Last cleanup performed: {new Date(lastCleanup).toLocaleString()}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Cleanup Recommendations</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Completed Appointments:</strong> Safest option - only removes appointments that are truly finished</li>
          <li>• <strong>Past Appointments:</strong> More aggressive - removes all past appointments regardless of status</li>
          <li>• <strong>Old Cancelled:</strong> Good for housekeeping - removes old cancelled appointments</li>
          <li>• Run "Completed Appointments" cleanup daily for best results</li>
        </ul>
      </div>
    </div>
  );
}
