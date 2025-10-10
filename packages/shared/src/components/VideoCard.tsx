import * as React from 'react';
import { Music, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { formatTime, cleanVideoTitle } from '../lib/utils';

export interface SearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  officialScore?: number; // 0-5, higher means more official (VEVO, artist channel, etc.)
}

interface VideoCardProps {
  video: SearchResult;
  onSelect: () => void;
  mode: 'FREEPLAY' | 'PAID';
  credits: number;
  disabled?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  onSelect, 
  mode, 
  credits,
  disabled = false
}) => {
  const canAdd = mode === 'FREEPLAY' || credits >= 1;
  const isDisabled = disabled || !canAdd;
  
  const cleanTitle = cleanVideoTitle(video.title);
  const isOfficial = video.officialScore && video.officialScore >= 3;
  
  return (
    <div className="group bg-slate-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-900">
        <img 
          src={video.thumbnailUrl} 
          alt={cleanTitle}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Official Badge */}
        {isOfficial && (
          <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded flex items-center gap-1">
            <Music className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white">OFFICIAL</span>
          </div>
        )}
        
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded flex items-center gap-1">
          <Clock className="w-3 h-3 text-white" />
          <span className="text-xs font-medium text-white">
            {formatTime(video.duration)}
          </span>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all pointer-events-none" />
      </div>
      
      {/* Info Section */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-white text-sm line-clamp-2 min-h-[2.5rem] leading-snug">
          {cleanTitle}
        </h3>
        
        {/* Channel */}
        <p className="text-xs text-gray-400 truncate">
          {video.channelTitle}
        </p>
        
        {/* Action Button */}
        <Button
          onClick={onSelect}
          disabled={isDisabled}
          variant={canAdd ? 'default' : 'secondary'}
          className={`w-full ${
            canAdd 
              ? 'bg-orange-600 hover:bg-orange-700' 
              : 'bg-gray-600 cursor-not-allowed'
          }`}
          size="lg"
        >
          {mode === 'PAID' ? (
            <span className="flex items-center justify-center gap-2">
              <span>Request</span>
              <span className="text-xs opacity-80">(1 Credit)</span>
            </span>
          ) : (
            'Add to Queue'
          )}
        </Button>
      </div>
    </div>
  );
};

export default VideoCard;
