'use client';

import { UserType } from '@/types';

interface UserTypeSelectionProps {
  selectedType: UserType;
  onSelect: (type: UserType) => void;
}

export default function UserTypeSelection({
  selectedType,
  onSelect,
}: UserTypeSelectionProps) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-8">Choose your account type</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
        <div
          className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
            selectedType === 'creator'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200'
          }`}
          onClick={() => onSelect('creator')}
        >
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Creator</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Influencers, content creators, and artists
            </p>
          </div>
        </div>

        <div
          className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
            selectedType === 'business'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200'
          }`}
          onClick={() => onSelect('business')}
        >
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Business Owner</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Brands, companies, and entrepreneurs
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <button
          onClick={() => onSelect(selectedType)}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
