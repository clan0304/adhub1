/* eslint-disable @typescript-eslint/no-explicit-any */
// app/creators/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getData } from 'country-list';
import { Search, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Instagram from '@/public/assets/instagram.png';
import Youtube from '@/public/assets/youtube.png';
import Tiktok from '@/public/assets/tiktok.png';

interface Creator {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  city: string;
  country: string;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  is_collaborated: boolean;
  is_public: boolean;
  user_type: string;
}

interface CountryOption {
  code: string;
  name: string;
}

export default function CreatorsPage() {
  const [allCreators, setAllCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const supabase = createClient();

  // Load country list
  useEffect(() => {
    const countryData = getData();

    // Modify the list to ensure Taiwan is displayed correctly
    const modifiedCountries = countryData.map((country: any) => {
      if (country.code === 'TW') {
        return { ...country, name: 'Taiwan' };
      }
      return country;
    });

    // Sort countries alphabetically
    modifiedCountries.sort((a: any, b: any) => a.name.localeCompare(b.name));

    setCountries(modifiedCountries);
  }, []);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        // Fetch all public content creators
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_public', true)
          .eq('user_type', 'creator')
          .order('username');

        if (error) {
          throw error;
        }

        setAllCreators(data || []);
        setFilteredCreators(data || []);
      } catch (err: any) {
        console.error('Error fetching creators:', err);
        setError(err.message || 'Failed to load creators');
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, [supabase]);

  // Apply filters when search or country changes
  useEffect(() => {
    if (!allCreators.length) return;

    let filtered = [...allCreators];

    // Apply country filter
    if (selectedCountry) {
      filtered = filtered.filter(
        (creator) => creator.country === selectedCountry
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (creator) =>
          creator.username.toLowerCase().includes(query) ||
          creator.first_name.toLowerCase().includes(query) ||
          creator.last_name.toLowerCase().includes(query) ||
          `${creator.first_name} ${creator.last_name}`
            .toLowerCase()
            .includes(query) ||
          creator.city.toLowerCase().includes(query)
      );
    }

    setFilteredCreators(filtered);
  }, [selectedCountry, searchQuery, allCreators]);

  const clearFilters = () => {
    setSelectedCountry('');
    setSearchQuery('');
    setFilteredCreators(allCreators);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading creators...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Content Creators
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Discover amazing content creators ready to collaborate
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search bar */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, username, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3"
                />
              </div>
            </div>

            {/* Country filter */}
            <div className="w-full md:w-64">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters button - only show if filters are active */}
            {(selectedCountry || searchQuery) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Filter stats */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredCreators.length} of {allCreators.length} creators
            {selectedCountry && ` in ${selectedCountry}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>

        {filteredCreators.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            {allCreators.length === 0 ? (
              <p className="text-gray-500">No content creators found.</p>
            ) : (
              <>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No matching creators
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search filters to see more results.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {creator.profile_photo_url ? (
              <Image
                src={creator.profile_photo_url}
                alt={creator.username}
                className="h-full w-full object-cover"
                width={60}
                height={60}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                <span className="text-xl font-bold">
                  {creator.first_name.charAt(0)}
                  {creator.last_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-gray-900">
              {creator.username}
            </h2>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            {creator.city}, {creator.country}
          </p>
        </div>

        <div className="flex space-x-2 mb-4">
          {creator.instagram_url && (
            <Link href={creator.instagram_url} target="_blank">
              <Image
                src={Instagram}
                alt="Instagram"
                height={30}
                width={30}
                className="hover:scale-110"
              />
            </Link>
          )}

          {creator.youtube_url && (
            <Link href={creator.youtube_url} target="_blank">
              <Image
                src={Youtube}
                alt="Youtube"
                height={30}
                width={30}
                className="hover:scale-110"
              />
            </Link>
          )}

          {creator.tiktok_url && (
            <Link href={creator.tiktok_url} target="_blank">
              <Image
                src={Tiktok}
                alt="Tiktok"
                height={30}
                width={30}
                className="hover:scale-110"
              />
            </Link>
          )}
        </div>

        {creator.is_collaborated && (
          <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full inline-block">
            Open to collaborate
          </div>
        )}

        <div className="mt-4">
          <Link
            href={`/creators/${creator.username}`}
            className="block w-full bg-blue-600 text-white text-center py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
