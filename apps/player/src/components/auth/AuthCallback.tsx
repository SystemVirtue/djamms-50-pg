import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { toast } from 'sonner';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { auth } = useAppwrite();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const secret = searchParams.get('secret');
    const userId = searchParams.get('userId');

    if (!secret || !userId) {
      setError('Invalid magic link');
      return;
    }

    auth
      .handleMagicLinkCallback(secret, userId)
      .then((session) => {
        toast.success('Logged in successfully');
        
        // Redirect to player for now (dashboard not deployed yet)
        const redirectUrl = '/player/venue-001';
        window.location.href = redirectUrl;
      })
      .catch((err) => {
        setError(err.message);
        toast.error(err.message);
      });
  }, [searchParams, auth]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <a
            href="/auth/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl mb-4">Authenticating...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
};
