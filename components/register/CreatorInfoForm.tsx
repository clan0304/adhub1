'use client';

import { RegistrationFormData } from '@/types';
import { Switch } from '@/components/ui/Switch';
import { useState } from 'react';

interface CreatorInfoFormProps {
  data: RegistrationFormData;
  onChange: (data: Partial<RegistrationFormData>) => void;
  onSubmit: () => void;
  onPrevious: () => void;
  loading: boolean;
}

export default function CreatorInfoForm({
  data,
  onChange,
  onSubmit,
  onPrevious,
  loading,
}: CreatorInfoFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Optional validation for URLs if provided
    if (data.instagramUrl && !data.instagramUrl.includes('instagram.com')) {
      newErrors.instagramUrl = 'Please enter a valid Instagram URL';
    }

    if (data.tiktokUrl && !data.tiktokUrl.includes('tiktok.com')) {
      newErrors.tiktokUrl = 'Please enter a valid TikTok URL';
    }

    if (
      data.youtubeUrl &&
      !data.youtubeUrl.includes('youtube.com') &&
      !data.youtubeUrl.includes('youtu.be')
    ) {
      newErrors.youtubeUrl = 'Please enter a valid YouTube URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Creator Information</h2>

      <div className="space-y-4">
        {/* Instagram URL */}
        <div>
          <label
            htmlFor="instagramUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Instagram URL
          </label>
          <input
            id="instagramUrl"
            type="url"
            value={data.instagramUrl || ''}
            onChange={(e) => onChange({ instagramUrl: e.target.value })}
            placeholder="https://instagram.com/yourusername"
            className={`w-full p-2 border rounded-md ${
              errors.instagramUrl ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.instagramUrl && (
            <p className="mt-1 text-sm text-red-500">{errors.instagramUrl}</p>
          )}
        </div>

        {/* TikTok URL */}
        <div>
          <label
            htmlFor="tiktokUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            TikTok URL
          </label>
          <input
            id="tiktokUrl"
            type="url"
            value={data.tiktokUrl || ''}
            onChange={(e) => onChange({ tiktokUrl: e.target.value })}
            placeholder="https://tiktok.com/@yourusername"
            className={`w-full p-2 border rounded-md ${
              errors.tiktokUrl ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.tiktokUrl && (
            <p className="mt-1 text-sm text-red-500">{errors.tiktokUrl}</p>
          )}
        </div>

        {/* YouTube URL */}
        <div>
          <label
            htmlFor="youtubeUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            YouTube URL (Optional)
          </label>
          <input
            id="youtubeUrl"
            type="url"
            value={data.youtubeUrl || ''}
            onChange={(e) => onChange({ youtubeUrl: e.target.value })}
            placeholder="https://youtube.com/c/yourchannel"
            className={`w-full p-2 border rounded-md ${
              errors.youtubeUrl ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.youtubeUrl && (
            <p className="mt-1 text-sm text-red-500">{errors.youtubeUrl}</p>
          )}
        </div>

        {/* Toggle Switches */}
        <div className="space-y-4 pt-4">
          {/* Is Public */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Exposing to public
              </h3>
              <p className="text-sm text-gray-500">
                Make your profile visible to the public
              </p>
            </div>
            <Switch
              checked={data.isPublic || false}
              onChange={(checked) => onChange({ isPublic: checked })}
            />
          </div>

          {/* Is Collaborated */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Collaborating with others
              </h3>
              <p className="text-sm text-gray-500">
                Allow collaboration requests from others
              </p>
            </div>
            <Switch
              checked={data.isCollaborated || false}
              onChange={(checked) => onChange({ isCollaborated: checked })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrevious}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          disabled={loading}
        >
          Previous
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
