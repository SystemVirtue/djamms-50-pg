import * as React from 'react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Coins, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { 
  SearchResult, 
  useJukeboxState,
  useQueueSync,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  ConfirmationScreen
} from '@djamms/shared';
import { SearchInterface } from './SearchInterface';

export const KioskView: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const { client } = useAppwrite();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<SearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);

  // Get YouTube API key from environment
  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';

  if (!youtubeApiKey) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Configuration Error</h1>
          <p className="text-slate-400">YouTube API key not configured</p>
        </div>
      </div>
    );
  }

  if (!venueId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Invalid URL</h1>
          <p className="text-slate-400">Venue ID not found</p>
        </div>
      </div>
    );
  }

  // Initialize jukebox state
  const {
    state,
    addToQueue: addToLocalQueue,
    addCredits
  } = useJukeboxState(venueId, 'FREEPLAY'); // TODO: Get mode from venue settings

  // Queue sync with AppWrite
  const { addToQueue: addToRemoteQueue } = useQueueSync(client, {
    venueId,
    enabled: true,
    onQueueUpdate: (priorityQueue, mainQueue) => {
      // Update local state when remote queue changes
      console.log('Queue updated:', { priorityQueue, mainQueue });
    },
    onError: (error) => {
      console.error('Queue sync error:', error);
      toast.error('Failed to sync with server');
    }
  });

  const handleVideoSelect = (video: SearchResult) => {
    setSelectedVideo(video);
    setShowConfirmDialog(true);
  };

  const handleConfirmRequest = async () => {
    if (!selectedVideo) return;

    const isPaid = state.mode === 'PAID';

    if (isPaid && state.credits < 1) {
      toast.error('Insufficient credits');
      setShowConfirmDialog(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Add to local queue first (optimistic update)
      addToLocalQueue(selectedVideo, isPaid);

      // Then sync to AppWrite
      await addToRemoteQueue(selectedVideo, isPaid);

      // Calculate queue position
      const position = isPaid 
        ? state.priorityQueue.length + 1
        : state.priorityQueue.length + state.mainQueue.length + 1;
      
      setQueuePosition(position);

      // Show success screen
      setShowConfirmDialog(false);
      setShowSuccessScreen(true);

      // Show toast notification
      toast.success(
        isPaid 
          ? 'Song requested! (1 credit used)' 
          : 'Song added to queue!'
      );

    } catch (error) {
      console.error('Error adding to queue:', error);
      toast.error('Failed to add song. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessScreen = () => {
    setShowSuccessScreen(false);
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Venue Info */}
          <div className="flex items-center gap-3">
            <Music className="w-6 h-6 text-orange-600" />
            <div>
              <h1 className="text-lg font-bold text-white">DJAMMS Kiosk</h1>
              <p className="text-xs text-slate-400">Venue: {venueId}</p>
            </div>
          </div>

          {/* Credits Display */}
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-400">CREDITS</span>
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="text-xl font-bold text-white">{state.credits}</span>
          </div>
        </div>

        {/* Now Playing Banner */}
        {state.nowPlaying && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 px-4 py-3">
            <div className="container mx-auto flex items-center gap-3">
              <Music className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-300">Now Playing:</span>
              <span className="text-base font-medium text-white truncate">
                {state.nowPlaying.title}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search Interface */}
      {!showSuccessScreen && (
        <SearchInterface
          venueId={venueId}
          onVideoSelect={handleVideoSelect}
          credits={state.credits}
          mode={state.mode}
          youtubeApiKey={youtubeApiKey}
        />
      )}

      {/* Success Screen */}
      {showSuccessScreen && selectedVideo && (
        <div className="container mx-auto p-6">
          <ConfirmationScreen
            title={selectedVideo.title}
            artist={selectedVideo.channelTitle}
            duration={selectedVideo.duration}
            thumbnailUrl={selectedVideo.thumbnailUrl}
            queuePosition={queuePosition}
            isPriority={state.mode === 'PAID' && state.credits >= 1}
            estimatedWaitTime={queuePosition * 240} // Rough estimate: 4 min per song
            onClose={handleCloseSuccessScreen}
          />
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Song Request</DialogTitle>
            <DialogDescription>
              {selectedVideo && (
                <div className="space-y-3 mt-4">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <img
                      src={selectedVideo.thumbnailUrl}
                      alt={selectedVideo.title}
                      className="w-full aspect-video object-cover rounded mb-2"
                    />
                    <h3 className="font-semibold text-white">{selectedVideo.title}</h3>
                    <p className="text-sm text-slate-400">{selectedVideo.channelTitle}</p>
                  </div>

                  {state.mode === 'PAID' && state.credits >= 1 && (
                    <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                      <p className="text-yellow-200 text-sm">
                        This will use <strong>1 credit</strong>
                      </p>
                      <p className="text-yellow-300 text-xs mt-1">
                        Remaining after: {state.credits - 1} credits
                      </p>
                    </div>
                  )}

                  {state.mode === 'PAID' && state.credits < 1 && (
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                      <p className="text-red-200 text-sm">
                        <strong>Insufficient credits</strong>
                      </p>
                      <p className="text-red-300 text-xs mt-1">
                        You need 1 credit to request this song
                      </p>
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRequest}
              disabled={
                isSubmitting || 
                (state.mode === 'PAID' && state.credits < 1)
              }
            >
              {isSubmitting 
                ? 'Adding...'
                : state.mode === 'PAID' 
                  ? 'Request (1 Credit)' 
                  : 'Add to Queue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Debug: Add Credits Button (development only) */}
      {import.meta.env.DEV && (
        <button
          onClick={() => addCredits(5)}
          className="fixed bottom-4 right-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          +5 Credits (Dev)
        </button>
      )}
    </div>
  );
};

export default KioskView;
