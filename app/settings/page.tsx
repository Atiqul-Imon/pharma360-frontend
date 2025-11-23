'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGuard from '@/components/RoleGuard';
import { api } from '@/lib/api';
import {
  Store,
  RefreshCcw,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  Trash2,
} from 'lucide-react';

interface Counter {
  _id: string;
  name: string;
  status: 'active' | 'inactive';
  isDefault: boolean;
  lastSessionAt?: string;
}

type Feedback = { type: 'success' | 'error'; message: string } | null;

const formatTimestamp = (value?: string) => {
  if (!value) return 'Never used';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never used';
  return date.toLocaleString();
};

const parseApiError = (error: any): string => {
  const details = error?.response?.data?.error?.details;
  if (typeof details === 'string') return details;
  if (details && typeof details === 'object') {
    const firstKey = Object.keys(details)[0];
    if (firstKey) {
      const errorMsg = Array.isArray(details[firstKey])
        ? details[firstKey][0]
        : details[firstKey];
      // Capitalize first letter for better UX
      return errorMsg.charAt(0).toUpperCase() + errorMsg.slice(1);
    }
  }
  return error?.response?.data?.error?.message || 'Something went wrong. Please try again.';
};

export default function SettingsPage() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formName, setFormName] = useState('');
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [formError, setFormError] = useState<string>('');

  const loadCounters = async () => {
    try {
      setLoading(true);
      // Clear any previous loading errors
      if (feedback?.type === 'error' && feedback.message.includes('load counters')) {
        setFeedback(null);
      }
      const response = await api.getCounters();
      const payload = response?.data ?? response;
      const list: Counter[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setCounters(list);
    } catch (error) {
      console.error('Failed to load counters', error);
      // Only show error in feedback if it's not a form-related error
      if (!formError) {
        setFeedback({ type: 'error', message: 'Could not load counters. Please refresh the page.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounters();
  }, []);

  const activeCount = useMemo(
    () => counters.filter((counter) => counter.status === 'active').length,
    [counters]
  );

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Clear previous errors
    setFormError('');
    setFeedback(null);

    // Validate form
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Counter name is required.');
      return;
    }

    if (trimmedName.length < 2) {
      setFormError('Counter name must be at least 2 characters long.');
      return;
    }

    if (trimmedName.length > 50) {
      setFormError('Counter name must be less than 50 characters.');
      return;
    }

    setCreating(true);

    try {
      await api.createCounter({ name: trimmedName });
      setFormName('');
      setFormError('');
      setFeedback({ type: 'success', message: 'Counter created successfully.' });
      await loadCounters();
    } catch (error) {
      const errorMessage = parseApiError(error);
      setFormError(errorMessage);
      // Also show in feedback if it's a general error
      if (!errorMessage.includes('name')) {
        setFeedback({ type: 'error', message: errorMessage });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setFeedback(null);
      await loadCounters();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (counter: Counter) => {
    const nextStatus = counter.status === 'active' ? 'inactive' : 'active';
    setFeedback(null);
    try {
      await api.updateCounter(counter._id, { status: nextStatus });
      setFeedback({
        type: 'success',
        message: `Counter ${counter.name} ${nextStatus === 'active' ? 'activated' : 'deactivated'}.`,
      });
      await loadCounters();
    } catch (error) {
      setFeedback({ type: 'error', message: parseApiError(error) });
    }
  };

  const handleSetDefault = async (counter: Counter) => {
    if (counter.isDefault) return;
    setFeedback(null);
    try {
      await api.updateCounter(counter._id, { isDefault: true });
      setFeedback({ type: 'success', message: `${counter.name} is now the default counter.` });
      await loadCounters();
    } catch (error) {
      setFeedback({ type: 'error', message: parseApiError(error) });
    }
  };

  const handleDelete = async (counter: Counter) => {
    if (counter.isDefault) {
      setFeedback({ type: 'error', message: 'Default counter cannot be deleted. Set another default first.' });
      return;
    }

    if (!confirm(`Delete counter "${counter.name}"? This action cannot be undone.`)) {
      return;
    }

    setFeedback(null);
    try {
      await api.deleteCounter(counter._id);
      setFeedback({ type: 'success', message: 'Counter deleted successfully.' });
      await loadCounters();
    } catch (error) {
      setFeedback({ type: 'error', message: parseApiError(error) });
    }
  };

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['owner', 'admin']}>
        <div className="p-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Store size={28} className="text-primary-600" />
                Counter Management
              </h1>
              <p className="text-sm text-gray-600">
                Configure sales counters for your pharmacy. Active counters can process POS sales.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={refreshing}
            >
              <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Counters</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <CircleDot size={14} className="text-primary-500" /> Active: {activeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle size={14} className="text-amber-500" /> Total: {counters.length}
                  </span>
                </div>
              </div>

              {feedback && (
                <div
                  className={`mb-4 rounded-md border px-4 py-3 text-sm ${
                    feedback.type === 'success'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              {loading ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
                  Loading counters...
                </div>
              ) : counters.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-600">
                  No counters configured yet. Use the form on the right to add your first counter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Default
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Last Session
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {counters.map((counter) => (
                        <tr key={counter._id}>
                          <td className="px-4 py-3 font-medium text-gray-900">{counter.name}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                counter.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {counter.status === 'active' ? (
                                <CheckCircle2 size={14} className="mr-1" />
                              ) : (
                                <AlertTriangle size={14} className="mr-1" />
                              )}
                              {counter.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {counter.isDefault ? (
                              <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                                Default
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatTimestamp(counter.lastSessionAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(counter)}
                                className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                              >
                                {counter.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetDefault(counter)}
                                className="rounded-md border border-primary-200 px-3 py-2 text-sm font-medium text-primary-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={counter.isDefault}
                              >
                                Set Default
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(counter)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card h-fit">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Counter</h2>
              <p className="text-sm text-gray-600 mb-4">
                Create counters for each POS terminal. The first counter becomes the default automatically.
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label htmlFor="counter-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Counter Name
                  </label>
                  <input
                    id="counter-name"
                    type="text"
                    value={formName}
                    onChange={(event) => {
                      setFormName(event.target.value);
                      // Clear error when user starts typing
                      if (formError) {
                        setFormError('');
                      }
                    }}
                    placeholder="e.g., Front Counter, Counter 2"
                    className={`input ${formError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    maxLength={50}
                    required
                  />
                  {formError && (
                    <p className="mt-1 text-sm text-red-600">{formError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={creating || !formName.trim()}
                >
                  <PlusCircle size={18} />
                  {creating ? 'Creating...' : 'Create Counter'}
                </button>
              </form>

              <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">Tips</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Keep counter names short and descriptive.</li>
                  <li>Deactivate counters temporarily when a terminal is offline.</li>
                  <li>Update the default counter when shifting staff.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}

