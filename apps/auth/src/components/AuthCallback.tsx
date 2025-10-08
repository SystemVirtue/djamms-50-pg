import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { toast } from 'sonner';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
        const redirectTo = session.user.venueId
          ? `/admin/${session.user.venueId}`
          : '/dashboard';
        navigate(redirectTo);
      })
      .catch((err) => {
        setError(err.message);
        toast.error(err.message);
      });
  }, [searchParams, auth, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-xl">Authenticating...</div>
    </div>
  );
};
