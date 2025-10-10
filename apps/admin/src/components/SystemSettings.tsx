import { useState, useEffect } from 'react';
import { useAppwrite } from '@appwrite/AppwriteContext';
import { Key, DollarSign, Info, Save, AlertCircle } from 'lucide-react';
import { Button, Input } from '@shared/components';
import { toast } from 'sonner';

interface SystemSettingsProps {
  venueId: string;
  databaseId: string;
}

interface VenueSettings {
  mode: 'FREEPLAY' | 'PAID';
  youtubeApiKey: string;
  creditCost: number;
  priorityCost: number;
  venueName: string;
}

export function SystemSettings({ venueId, databaseId }: SystemSettingsProps) {
  const { databases } = useAppwrite();
  const [settings, setSettings] = useState<VenueSettings>({
    mode: 'FREEPLAY',
    youtubeApiKey: '',
    creditCost: 1,
    priorityCost: 2,
    venueName: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load venue settings
  useEffect(() => {
    loadSettings();
  }, [venueId]);

  const loadSettings = async () => {
    try {
      // Try to load from venues collection
      const response = await databases.listDocuments(
        databaseId,
        'venues',
        [`venueId=${venueId}`]
      );

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        setSettings({
          mode: doc.mode || 'FREEPLAY',
          youtubeApiKey: doc.youtubeApiKey || '',
          creditCost: doc.creditCost || 1,
          priorityCost: doc.priorityCost || 2,
          venueName: doc.name || venueId,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load venue settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof VenueSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to venues collection
      const response = await databases.listDocuments(
        databaseId,
        'venues',
        [`venueId=${venueId}`]
      );

      if (response.documents.length > 0) {
        // Update existing
        await databases.updateDocument(
          databaseId,
          'venues',
          response.documents[0].$id,
          {
            mode: settings.mode,
            youtubeApiKey: settings.youtubeApiKey,
            creditCost: settings.creditCost,
            priorityCost: settings.priorityCost,
            name: settings.venueName,
          }
        );
      } else {
        // Create new
        await databases.createDocument(
          databaseId,
          'venues',
          'unique()',
          {
            venueId,
            mode: settings.mode,
            youtubeApiKey: settings.youtubeApiKey,
            creditCost: settings.creditCost,
            priorityCost: settings.priorityCost,
            name: settings.venueName,
          }
        );
      }

      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-4">
            <div className="h-20 bg-gray-700 rounded" />
            <div className="h-20 bg-gray-700 rounded" />
            <div className="h-20 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">System Settings</h2>
        {hasChanges && (
          <div className="flex items-center gap-2 text-orange-500 text-sm">
            <AlertCircle size={16} />
            Unsaved changes
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Venue Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Info size={16} className="inline mr-2" />
            Venue Name
          </label>
          <Input
            type="text"
            value={settings.venueName}
            onChange={(e) => handleChange('venueName', e.target.value)}
            placeholder="Enter venue name"
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            Display name for your venue
          </p>
        </div>

        {/* Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <DollarSign size={16} className="inline mr-2" />
            Operating Mode
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleChange('mode', 'FREEPLAY')}
              className={`p-4 rounded-lg border-2 transition ${
                settings.mode === 'FREEPLAY'
                  ? 'border-orange-500 bg-orange-500/20 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-semibold text-lg mb-1">Freeplay</div>
              <div className="text-xs">Unlimited requests</div>
            </button>
            <button
              onClick={() => handleChange('mode', 'PAID')}
              className={`p-4 rounded-lg border-2 transition ${
                settings.mode === 'PAID'
                  ? 'border-orange-500 bg-orange-500/20 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-semibold text-lg mb-1">Paid</div>
              <div className="text-xs">Credit-based system</div>
            </button>
          </div>
        </div>

        {/* Credit Costs (shown only in PAID mode) */}
        {settings.mode === 'PAID' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Standard Cost
              </label>
              <Input
                type="number"
                min="1"
                value={settings.creditCost}
                onChange={(e) => handleChange('creditCost', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Credits per request
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority Cost
              </label>
              <Input
                type="number"
                min="1"
                value={settings.priorityCost}
                onChange={(e) => handleChange('priorityCost', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Credits for priority queue
              </p>
            </div>
          </div>
        )}

        {/* YouTube API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Key size={16} className="inline mr-2" />
            YouTube API Key
          </label>
          <Input
            type="password"
            value={settings.youtubeApiKey}
            onChange={(e) => handleChange('youtubeApiKey', e.target.value)}
            placeholder="Enter YouTube Data API v3 key"
            className="w-full font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Required for video search. Get one from{' '}
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full"
          size="lg"
        >
          <Save size={20} className="mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
