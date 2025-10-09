import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">DJAMMS</h1>
          <p className="text-xl text-blue-200">Music Request System for Bars & Venues</p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-4">🎵 Real-Time Queue</h3>
            <p className="text-blue-100">Customers request songs via QR code.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-4">🎛️ DJ Control</h3>
            <p className="text-blue-100">Full control over queue management.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-4">📊 Analytics</h3>
            <p className="text-blue-100">Track popular songs and metrics.</p>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/auth"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            Get Started →
          </Link>
        </div>
      </div>
    </div>
  );
}
