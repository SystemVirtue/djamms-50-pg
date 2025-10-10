import * as React from 'react';
import { CheckCircle, Music, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { formatTime } from '../lib/utils';

interface ConfirmationScreenProps {
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string;
  queuePosition: number;
  isPriority: boolean;
  estimatedWaitTime?: number;
  onClose: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  title,
  artist,
  duration,
  thumbnailUrl,
  queuePosition,
  isPriority,
  estimatedWaitTime,
  onClose
}) => {
  return (
    <div className="bg-slate-900 rounded-lg p-6 max-w-lg mx-auto">
      {/* Success Icon */}
      <div className="flex justify-center mb-4">
        <div className="bg-green-600 rounded-full p-3">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-white text-center mb-2">
        {isPriority ? 'Request Confirmed!' : 'Added to Queue!'}
      </h2>
      <p className="text-slate-400 text-center mb-6">
        {isPriority 
          ? 'Your song will play soon' 
          : 'Your song has been added to the queue'}
      </p>

      {/* Song Details */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-24 h-24 object-cover rounded"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white mb-1 line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-slate-400 mb-2">
              {artist}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Info */}
      <div className="space-y-3 mb-6">
        {isPriority && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Music className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-yellow-200">Priority Request</span>
            </div>
            <p className="text-sm text-yellow-300">
              Your song will play after the current track finishes
            </p>
          </div>
        )}

        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-sm">Queue Position</span>
            <span className="font-bold text-white text-lg">#{queuePosition}</span>
          </div>
          
          {estimatedWaitTime && estimatedWaitTime > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Estimated Wait</span>
              <span className="text-slate-300 text-sm">
                ~{Math.ceil(estimatedWaitTime / 60)} minutes
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Close Button */}
      <Button
        onClick={onClose}
        className="w-full bg-orange-600 hover:bg-orange-700"
        size="lg"
      >
        Add Another Song
      </Button>
    </div>
  );
};

export default ConfirmationScreen;
