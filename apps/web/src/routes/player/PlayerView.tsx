import { useParams } from 'react-router-dom';

export function PlayerView() {
  const { venueId } = useParams<{ venueId: string }>();
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">🎵 Player View</h1>
      <p className="text-gray-400">Venue ID: {venueId}</p>
    </div>
  );
}
