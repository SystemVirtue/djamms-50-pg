import { useState, FormEvent } from 'react';
import { Client, Functions } from 'appwrite';

// Initialize AppWrite Client
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const functions = new Functions(client);

export function AuthLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Use AppWrite SDK to call the working magic-link function
      // The callback will verify the magic link and then redirect to dashboard
      const redirectUrl = `${window.location.origin}/callback`;
      
      const result = await functions.createExecution(
        '68e5a317003c42c8bb6a', // magic-link function ID
        JSON.stringify({ 
          action: 'create',
          email, 
          redirectUrl 
        }),
        false // not async
      );

      console.log('Magic link execution result:', result);

      // Check if execution succeeded
      if (result.status === 'failed') {
        console.error('Magic link execution failed:', result.responseBody);
        setError('Failed to send magic link. Please try again.');
        return;
      }

      if (result.status === 'completed' && result.responseBody) {
        const data = JSON.parse(result.responseBody);
        
        if (!data.success) {
          // Handle specific error cases
          if (data.error === 'USER_NOT_REGISTERED') {
            alert('Email is not registered - please enter a valid email address!');
            setError('This email is not registered. Please contact your administrator.');
          } else if (data.error === 'RATE_LIMIT') {
            setError('Too many attempts. Please try again in a few minutes.');
          } else {
            setError(data.message || data.error || 'Failed to send magic link. Please try again.');
          }
          return;
        }

        // Success - magic link sent
        setSuccess(true);
        setEmail('');
      }
    } catch (err: any) {
      console.error('Magic link error:', err);
      setError(err.message || 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">DJAMMS</h1>
          <p className="text-gray-600">Sign in with your email</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg
              className="w-16 h-16 text-green-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Check your email!
            </h3>
            <p className="text-green-700 mb-4">
              We've sent a magic link to your email address.
              Click the link to sign in.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Send another link
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                <svg
                  className="w-5 h-5 inline mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending magic link...
                </span>
              ) : (
                'Send Magic Link'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>No password required. We'll email you a secure link.</p>
        </div>
      </div>
    </div>
  );
}
