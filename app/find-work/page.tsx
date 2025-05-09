/* eslint-disable @typescript-eslint/no-explicit-any */
// app/find-work/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, X, Bookmark, CheckCircle, Briefcase } from 'lucide-react';
import { getData } from 'country-list';
import JobPostingModal from '@/components/find-work/JobPostingModal';
import JobPostingCard from '@/components/find-work/JobPostingCard';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
  created_at: string;
  profile_id: string;
  username: string;
  profile_photo_url: string | null;
  city: string;
  country: string;
  user_id: string;
  first_name: string;
  last_name: string;
  user_type: string;
  slug: string;
  is_saved?: boolean;
}

interface CountryOption {
  code: string;
  name: string;
}

export type JobPostingFormData = {
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
};

export default function FindWorkPage() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allJobPostings, setAllJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobPostings, setFilteredJobPostings] = useState<JobPosting[]>(
    []
  );
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlySaved, setShowOnlySaved] = useState(false);
  const [showMyPostingsOnly, setShowMyPostingsOnly] = useState(false);
  const [currentEditJob, setCurrentEditJob] = useState<JobPosting | null>(null);
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

  // Get session and user
  useEffect(() => {
    const getSessionAndUser = async () => {
      // Get the session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);

      if (currentSession?.user?.id) {
        try {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          } else {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error in getSessionAndUser:', error);
        }
      }
    };

    getSessionAndUser();
  }, [supabase]);

  // Fetch job postings and saved jobs
  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        setLoading(true);

        // Fetch all job postings with creator profiles joined
        const { data: jobsData, error: jobsError } = await supabase
          .from('job_postings')
          .select(
            `
            *,
            profiles!job_postings_profile_id_fkey (
              id,
              username,
              profile_photo_url,
              city,
              country,
              first_name,
              last_name,
              user_type
            )
          `
          )
          .order('created_at', { ascending: false });

        if (jobsError) throw jobsError;

        // Transform the nested data
        const transformedJobs = jobsData.map((posting: any) => ({
          ...posting,
          profile_id: posting.profile_id,
          username: posting.profiles.username,
          profile_photo_url: posting.profiles.profile_photo_url,
          city: posting.profiles.city,
          country: posting.profiles.country,
          user_id: posting.profiles.id, // This is the profile ID from the profiles table
          first_name: posting.profiles.first_name,
          last_name: posting.profiles.last_name,
          user_type: posting.profiles.user_type,
          is_saved: false, // Default to not saved
        }));

        setAllJobPostings(transformedJobs);
        setFilteredJobPostings(transformedJobs);

        // If user is logged in and is a content creator, fetch their saved jobs
        if (session?.user && userProfile?.user_type === 'creator') {
          const { data: savedJobsData, error: savedJobsError } = await supabase
            .from('saved_jobs')
            .select('job_posting_id')
            .eq('profile_id', userProfile.id);

          if (savedJobsError) throw savedJobsError;

          // Create a Set of saved job IDs for efficient lookup
          const savedIds = new Set(
            savedJobsData.map((item) => item.job_posting_id)
          );
          setSavedJobIds(savedIds);

          // Mark jobs as saved
          const jobsWithSavedFlag = transformedJobs.map((job) => ({
            ...job,
            is_saved: savedIds.has(job.id),
          }));

          setAllJobPostings(jobsWithSavedFlag);
          setFilteredJobPostings(jobsWithSavedFlag);
        }
      } catch (err: any) {
        console.error('Error fetching job postings:', err);
        setError(err.message || 'Failed to load job postings');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchJobPostings();
    } else if (session === null) {
      // Session check has completed (not loading anymore)
      fetchJobPostings(); // Fetch jobs even if not logged in
    }
  }, [session, userProfile, supabase]);

  // Apply filters
  useEffect(() => {
    if (!allJobPostings.length) return;

    let filtered = [...allJobPostings];

    // Apply saved jobs filter
    if (showOnlySaved) {
      filtered = filtered.filter((job) => job.is_saved);
    }

    // Apply my postings filter for business owners
    if (showMyPostingsOnly && session?.user) {
      filtered = filtered.filter((job) => job.user_id === userProfile?.id);
    }

    // Apply country filter
    if (selectedCountry) {
      filtered = filtered.filter((job) => job.country === selectedCountry);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.city.toLowerCase().includes(query) ||
          `${job.first_name} ${job.last_name}`.toLowerCase().includes(query)
      );
    }

    setFilteredJobPostings(filtered);
  }, [
    selectedCountry,
    searchQuery,
    showOnlySaved,
    showMyPostingsOnly,
    allJobPostings,
    session,
    userProfile,
  ]);

  // Helper function to generate a slug from title
  const generateSlug = (title: string): string => {
    // Convert to lowercase, replace spaces with hyphens, remove special characters
    const baseSlug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');

    // Add random characters to ensure uniqueness
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomStr}`;
  };

  const handleCreateJobPosting = async (jobData: JobPostingFormData) => {
    if (!session?.user || !userProfile) return;

    try {
      if (currentEditJob) {
        // Update existing job posting
        const { error } = await supabase
          .from('job_postings')
          .update({
            title: jobData.title,
            description: jobData.description,
            has_deadline: jobData.has_deadline,
            deadline_date: jobData.deadline_date,
            deadline_time: jobData.deadline_time,
          })
          .eq('id', currentEditJob.id);

        if (error) throw error;

        // Update job listings in state
        const updatedJobPostings = allJobPostings.map((job) =>
          job.id === currentEditJob.id
            ? {
                ...job,
                title: jobData.title,
                description: jobData.description,
                has_deadline: jobData.has_deadline,
                deadline_date: jobData.deadline_date,
                deadline_time: jobData.deadline_time,
              }
            : job
        );

        setAllJobPostings(updatedJobPostings);
        setFilteredJobPostings(
          filteredJobPostings.map((job) =>
            job.id === currentEditJob.id
              ? {
                  ...job,
                  title: jobData.title,
                  description: jobData.description,
                  has_deadline: jobData.has_deadline,
                  deadline_date: jobData.deadline_date,
                  deadline_time: jobData.deadline_time,
                }
              : job
          )
        );
      } else {
        // Create new job posting
        // Generate slug from title
        const slug = generateSlug(jobData.title);

        // Use the profile's id column as the foreign key
        const { data, error } = await supabase
          .from('job_postings')
          .insert({
            profile_id: userProfile.id, // This uses the id from profiles table
            title: jobData.title,
            description: jobData.description,
            has_deadline: jobData.has_deadline,
            deadline_date: jobData.deadline_date,
            deadline_time: jobData.deadline_time,
            slug: slug,
          })
          .select();

        if (error) throw error;

        if (data && data[0]) {
          // Create a complete job posting object with profile data
          const newJobPosting = {
            ...data[0],
            username: userProfile.username,
            profile_photo_url: userProfile.profile_photo_url,
            city: userProfile.city,
            country: userProfile.country,
            user_id: userProfile.id,
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            user_type: userProfile.user_type,
            is_saved: false,
          };

          // Add the new job posting to the state
          const updatedJobPostings = [
            newJobPosting as JobPosting,
            ...allJobPostings,
          ];
          setAllJobPostings(updatedJobPostings);
          setFilteredJobPostings(updatedJobPostings);
        }
      }

      setIsModalOpen(false);
      setCurrentEditJob(null);
    } catch (err: any) {
      console.error('Error creating/updating job posting:', err);
      alert(
        `Failed to ${currentEditJob ? 'update' : 'create'} job posting: ${
          err.message
        }`
      );
    }
  };

  const handleDeleteJobPosting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update both job posting lists
      const updatedJobPostings = allJobPostings.filter((job) => job.id !== id);
      setAllJobPostings(updatedJobPostings);
      setFilteredJobPostings(
        filteredJobPostings.filter((job) => job.id !== id)
      );
    } catch (err: any) {
      console.error('Error deleting job posting:', err);
      alert(`Failed to delete job posting: ${err.message}`);
    }
  };

  const handleEditJobPosting = (job: JobPosting) => {
    setCurrentEditJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditJob(null);
  };

  const handleSaveJob = async (jobId: string, isSaved: boolean) => {
    if (!userProfile) return;

    try {
      if (isSaved) {
        // Unsave the job
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('profile_id', userProfile.id)
          .eq('job_posting_id', jobId);

        if (error) throw error;

        // Update saved jobs set
        const newSavedIds = new Set(savedJobIds);
        newSavedIds.delete(jobId);
        setSavedJobIds(newSavedIds);

        // Update job postings
        const updatedAll = allJobPostings.map((job) =>
          job.id === jobId ? { ...job, is_saved: false } : job
        );
        setAllJobPostings(updatedAll);

        // Update filtered job postings
        setFilteredJobPostings((prevFiltered) => {
          // If we're showing only saved, remove this job from the filtered list
          if (showOnlySaved) {
            return prevFiltered.filter((job) => job.id !== jobId);
          }
          // Otherwise, update it to show as not saved
          return prevFiltered.map((job) =>
            job.id === jobId ? { ...job, is_saved: false } : job
          );
        });
      } else {
        // Save the job
        const { error } = await supabase.from('saved_jobs').insert({
          profile_id: userProfile.id,
          job_posting_id: jobId,
        });

        if (error) throw error;

        // Update saved jobs set
        const newSavedIds = new Set(savedJobIds);
        newSavedIds.add(jobId);
        setSavedJobIds(newSavedIds);

        // Update job postings
        const updatedAll = allJobPostings.map((job) =>
          job.id === jobId ? { ...job, is_saved: true } : job
        );
        setAllJobPostings(updatedAll);

        // Update filtered job postings
        setFilteredJobPostings((prevFiltered) =>
          prevFiltered.map((job) =>
            job.id === jobId ? { ...job, is_saved: true } : job
          )
        );
      }
    } catch (err: any) {
      console.error('Error saving/unsaving job:', err);
      alert(`Failed to save/unsave job: ${err.message}`);
    }
  };

  const clearFilters = () => {
    setSelectedCountry('');
    setSearchQuery('');
    setShowOnlySaved(false);
    setShowMyPostingsOnly(false);
    setFilteredJobPostings(allJobPostings);
  };

  const toggleSavedFilter = () => {
    setShowOnlySaved(!showOnlySaved);
    // Turn off "My Postings" filter if turning on "Saved" filter
    if (!showOnlySaved) {
      setShowMyPostingsOnly(false);
    }
  };

  const toggleMyPostingsFilter = () => {
    setShowMyPostingsOnly(!showMyPostingsOnly);
    // Turn off "Saved" filter if turning on "My Postings" filter
    if (!showMyPostingsOnly) {
      setShowOnlySaved(false);
    }
  };

  const isBusinessOwner = userProfile?.user_type === 'business';
  const isContentCreator = userProfile?.user_type === 'creator';

  // Count how many postings are created by the business owner
  const myPostingsCount = userProfile
    ? allJobPostings.filter((job) => job.user_id === userProfile.id).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Work</h1>
            <p className="mt-2 text-lg text-gray-600">
              Discover collaboration opportunities with businesses
            </p>
          </div>

          {isBusinessOwner && (
            <button
              onClick={() => {
                setCurrentEditJob(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Job Posting
            </button>
          )}
        </div>

        {/* Filter Section */}
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
                  placeholder="Search job title, description, or location..."
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
          </div>

          {/* Second row for filters */}
          <div className="flex flex-wrap items-center mt-4 gap-2">
            {/* Saved Jobs Filter for Content Creators */}
            {isContentCreator && (
              <button
                onClick={toggleSavedFilter}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                  showOnlySaved
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {showOnlySaved ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {showOnlySaved ? 'Showing Saved Jobs' : 'Show Saved Jobs'}
              </button>
            )}

            {/* My Postings Filter for Business Owners */}
            {isBusinessOwner && (
              <button
                onClick={toggleMyPostingsFilter}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                  showMyPostingsOnly
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {showMyPostingsOnly ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Briefcase className="h-4 w-4" />
                )}
                {showMyPostingsOnly ? 'Showing My Postings' : 'My Postings'} (
                {myPostingsCount})
              </button>
            )}

            {/* Clear filters button - only show if filters are active */}
            {(selectedCountry ||
              searchQuery ||
              showOnlySaved ||
              showMyPostingsOnly) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm font-medium"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            )}

            {/* Filter stats */}
            <div className="text-sm text-gray-500 ml-auto">
              Showing {filteredJobPostings.length} of {allJobPostings.length}{' '}
              job postings
              {selectedCountry && ` in ${selectedCountry}`}
              {searchQuery && ` matching "${searchQuery}"`}
              {showOnlySaved && ` you've saved`}
              {showMyPostingsOnly && ` you've created`}
            </div>
          </div>
        </div>

        {/* Job Listings */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm underline"
            >
              Try again
            </button>
          </div>
        ) : filteredJobPostings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {allJobPostings.length === 0 ? (
              <>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No job postings yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isBusinessOwner
                    ? 'Get started by creating your first job posting.'
                    : 'Check back later for new opportunities.'}
                </p>
              </>
            ) : showMyPostingsOnly && myPostingsCount === 0 ? (
              <>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  You haven&apos;t created any job postings yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first job posting.
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No matching job postings
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search filters to see more results.
                </p>
              </>
            )}
            {isBusinessOwner &&
              (allJobPostings.length === 0 ||
                (showMyPostingsOnly && myPostingsCount === 0)) && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  >
                    Create Job Posting
                  </button>
                </div>
              )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobPostings.map((job) => (
              <JobPostingCard
                key={job.id}
                job={job}
                isOwner={job.user_id === userProfile?.id}
                onDelete={handleDeleteJobPosting}
                onEdit={handleEditJobPosting}
                onSaveToggle={(isSaved) => handleSaveJob(job.id, isSaved)}
                isSaved={job.is_saved || false}
                isContentCreator={isContentCreator}
              />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <JobPostingModal
          onClose={handleCloseModal}
          onCreate={handleCreateJobPosting}
          initialData={currentEditJob}
        />
      )}
    </div>
  );
}
