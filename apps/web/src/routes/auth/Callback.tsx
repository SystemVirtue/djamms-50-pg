import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Client, Account } from 'appwrite';

// Initialize AppWrite Client
const client = new Client();
const account = new Account(client);

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'setup' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [venueId, setVenueId] = useState('');

  useEffect(() => {
    const verifyMagicLink = async () => {
      try {
        // FIRST: Check if user already has an active session
        try {
          const existingUser = await account.get();
          if (existingUser) {
            console.log('User already authenticated, redirecting to dashboard:', existingUser);
            setStatus('success');
            setTimeout(() => {
              navigate(`/dashboard/${existingUser.$id}`);
            }, 1000);
            return; // Exit early - user is already logged in
          }
        } catch (existingSessionError) {
          // No existing session, continue with magic link verification
          console.log('No existing session, proceeding with magic link verification');
        }

        // Get the userId and secret from URL parameters
        const authUserId = searchParams.get('userId');
        const secret = searchParams.get('secret');

        if (!authUserId || !secret) {
          throw new Error('Missing authentication parameters. Please try logging in again.');
        }

        // Update the magic URL session to complete authentication
        await account.updateMagicURLSession(authUserId, secret);

        // Get the current user to verify authentication
        const user = await account.get();
        console.log('Authenticated user:', user);

        // Check if this is a new user (needs profile setup)
        await checkAndSetupUserProfile(user.$id);

      } catch (err: any) {
        console.error('Magic link verification error:', err);
        setStatus('error');
        
        // Check if error is due to active session
        if (err.message && err.message.includes('session is active')) {
          setHasActiveSession(true);
          setErrorMessage('Creation of a session is prohibited when a session is active.');
        } else {
          setErrorMessage(err.message || 'Failed to verify magic link. Please try again.');
        }
      }
    };

    verifyMagicLink();
  }, [searchParams, navigate]);

  const checkAndSetupUserProfile = async (_authUserId: string) => {
    // TODO: Re-implement user profile setup once setupUserProfile function is deployed
    // For now, just redirect to dashboard
    try {
      const user = await account.get();
      console.log('User authenticated:', user);
      
      // Simple redirect to dashboard (using userId)
      setStatus('success');
      setTimeout(() => {
        navigate(`/dashboard`);
      }, 1500);
    } catch (err: any) {
      console.error('Profile check error:', err);
      setStatus('error');
      setErrorMessage('Failed to verify user profile. Please try again.');
    }
  };

  const handleVenueSetup = async () => {
    // TODO: Re-implement venue setup once setupUserProfile function is deployed
    // For now, just redirect to dashboard
    if (!venueId || venueId.trim().length === 0) {
      alert('Please enter a Venue ID');
      return;
    }

    try {
      setStatus('verifying');
      
      // Simple redirect to dashboard
      setStatus('success');
      setTimeout(() => {
        navigate(`/dashboard`);
      }, 1500);
    } catch (err: any) {
      console.error('Venue setup error:', err);
      alert('Failed to setup venue. Please try again.');
      setStatus('setup');
    }
  };

  const handleCloseSessionAndContinue = async () => {
    setIsClosingSession(true);
    try {
      // Delete all active sessions
      await account.deleteSessions();
      console.log('All sessions closed successfully');

      // Now retry the magic URL authentication
      const userId = searchParams.get('userId');
      const secret = searchParams.get('secret');

      if (!userId || !secret) {
        throw new Error('Missing authentication parameters.');
      }

      // Update the magic URL session to complete authentication
      await account.updateMagicURLSession(userId, secret);

      // Get the current user to verify authentication
      const user = await account.get();
      console.log('Authenticated user after session cleanup:', user);

      setStatus('success');

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate(`/dashboard/${user.$id}`);
      }, 1000);

    } catch (err: any) {
      console.error('Error closing session and continuing:', err);
      setIsClosingSession(false);
      setErrorMessage(err.message || 'Failed to close session and continue. Please try again.');
    }
  };

  if (status === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <svg
              className="w-16 h-16 text-purple-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to DJAMMS!</h2>
            <p className="text-gray-600">Let's set up your venue</p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="venueId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Venue ID (unique name for your venue)
              </label>
              <input
                id="venueId"
                type="text"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                placeholder="e.g., my-awesome-bar"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Use lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <button
              onClick={handleVenueSetup}
              disabled={!venueId || venueId.trim().length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="relative mb-6">
            <svg
              className="animate-spin h-16 w-16 text-purple-600 mx-auto"
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
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying your magic link...</h2>
          <p className="text-gray-600">Please wait while we authenticate you.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <svg
            className="w-20 h-20 text-green-500 mx-auto mb-6"
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Successfully authenticated!</h2>
          <p className="text-gray-600 mb-4">Redirecting you to your dashboard...</p>
          <div className="animate-pulse text-purple-600 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <svg
          className="w-20 h-20 text-red-500 mx-auto mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Failed</h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        
        <div className="space-y-3">
          {/* Show "Close Active Session" button if there's an active session */}
          {hasActiveSession && (
            <button
              onClick={handleCloseSessionAndContinue}
              disabled={isClosingSession}
              className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClosingSession ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Closing Session...
                </span>
              ) : (
                'Close Active Session & Continue'
              )}
            </button>
          )}
          
          {/* Try Again button */}
          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
