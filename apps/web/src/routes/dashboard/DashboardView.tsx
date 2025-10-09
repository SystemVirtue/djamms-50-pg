import { useParams } from 'react-router-dom';

export function DashboardView() {
  const { userId } = useParams<{ userId: string }>();
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">📊 Dashboard</h1>
      <p className="text-gray-400">User ID: {userId}</p>
    </div>
  );
}
