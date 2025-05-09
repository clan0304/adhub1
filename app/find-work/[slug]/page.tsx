/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { BookmarkIcon, Loader2 } from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
  created_at: string;
  profile_id: string;
  slug: string;
  user_id: string;
  username: string;
  profile_photo_url: string | null;
  city: string;
  country: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

interface Applicant {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  city: string;
  country: string;
  created_at: string;
}

// Interface for the profile data structure returned by Supabase
interface ProfileData {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  city: string;
  country: string;
}

// Interface for application data with profiles
interface ApplicationData {
  id: string;
  created_at: string;
  profiles: ProfileData | any;
}

export default function JobPostingDetailPage() {
  const { slug } = useParams();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [showApplicants, setShowApplicants] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Fetch session, user profile, job posting, and check saved/applied status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get the current session
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession);

        // Fetch job posting by slug with join to profiles
        const { data: jobData, error: jobError } = await supabase
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
          .eq('slug', slug)
          .single();

        if (jobError) {
          throw jobError;
        }

        if (jobData) {
          // Transform the nested data
          const transformedJob = {
            ...jobData,
            user_id: jobData.profiles.id,
            username: jobData.profiles.username,
            profile_photo_url: jobData.profiles.profile_photo_url,
            city: jobData.profiles.city,
            country: jobData.profiles.country,
            first_name: jobData.profiles.first_name,
            last_name: jobData.profiles.last_name,
            user_type: jobData.profiles.user_type,
          };

          setJobPosting(transformedJob as JobPosting);

          // If user is logged in, get their profile and check if they saved/applied
          if (currentSession?.user?.id) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();

            if (profileError) {
              console.error('Error fetching profile:', profileError);
            } else {
              setUserProfile(profileData);

              // Check if job is saved
              const { data: savedData } = await supabase
                .from('saved_jobs')
                .select('*')
                .eq('profile_id', profileData.id)
                .eq('job_posting_id', jobData.id)
                .single();

              setIsSaved(!!savedData);

              // Check if user has applied for this job
              const { data: appliedData } = await supabase
                .from('job_applications')
                .select('*')
                .eq('profile_id', profileData.id)
                .eq('job_posting_id', jobData.id)
                .single();

              setIsApplied(!!appliedData);

              // If the user is the job owner, fetch applicants
              if (jobData.profile_id === profileData.id) {
                const { data: applicantsData, error: applicantsError } =
                  await supabase
                    .from('job_applications')
                    .select(
                      `
                    id,
                    created_at,
                    profiles!job_applications_profile_id_fkey (
                      id,
                      username,
                      first_name,
                      last_name,
                      profile_photo_url,
                      city,
                      country
                    )
                  `
                    )
                    .eq('job_posting_id', jobData.id)
                    .order('created_at', { ascending: false });

                if (applicantsError) {
                  console.error('Error fetching applicants:', applicantsError);
                } else if (applicantsData && applicantsData.length > 0) {
                  // For debugging, log the shape of the first item
                  if (applicantsData[0]) {
                    console.log(
                      'First applicant data structure:',
                      JSON.stringify(applicantsData[0], null, 2)
                    );
                  }

                  // Transform the applicant data with type handling
                  const transformedApplicants: Applicant[] = [];

                  applicantsData.forEach((item: ApplicationData) => {
                    let profileData: ProfileData | null = null;

                    // Handle different possible shapes of the data
                    if (item && item.profiles) {
                      if (Array.isArray(item.profiles)) {
                        // If profiles is an array, take the first item
                        profileData = item.profiles[0] as ProfileData;
                      } else if (typeof item.profiles === 'object') {
                        // If profiles is an object, use it directly
                        profileData = item.profiles as ProfileData;
                      }
                    }

                    // Only proceed if we have valid profile data
                    if (profileData) {
                      transformedApplicants.push({
                        id: profileData.id || '',
                        username: profileData.username || '',
                        first_name: profileData.first_name || '',
                        last_name: profileData.last_name || '',
                        profile_photo_url: profileData.profile_photo_url,
                        city: profileData.city || '',
                        country: profileData.country || '',
                        created_at: item.created_at || '',
                      });
                    }
                  });

                  setApplicants(transformedApplicants);
                }
              }
            }
          }
        } else {
          setError('Job posting not found');
        }
      } catch (err: any) {
        console.error('Error fetching job posting:', err);
        setError(err.message || 'Failed to load job posting');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug, supabase]);

  // Handle save/unsave job
  const handleSaveJob = async () => {
    if (!session?.user?.id || !userProfile || !jobPosting) return;

    setIsActionLoading(true);

    try {
      if (isSaved) {
        // Unsave the job
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('profile_id', userProfile.id)
          .eq('job_posting_id', jobPosting.id);

        if (error) throw error;
        setIsSaved(false);
      } else {
        // Save the job
        const { error } = await supabase.from('saved_jobs').insert({
          profile_id: userProfile.id,
          job_posting_id: jobPosting.id,
        });

        if (error) throw error;
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error saving/unsaving job:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle apply for job
  const handleApplyForJob = async () => {
    if (!session?.user?.id || !userProfile || !jobPosting) return;

    setIsActionLoading(true);

    try {
      // Create job application
      const { error } = await supabase.from('job_applications').insert({
        profile_id: userProfile.id,
        job_posting_id: jobPosting.id,
      });

      if (error) throw error;

      setIsApplied(true);
    } catch (err) {
      console.error('Error applying for job:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Format deadline
  const formatDeadline = (
    dateString: string | null,
    timeString: string | null
  ) => {
    if (!dateString) return 'No deadline';

    const date = new Date(dateString);
    let formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);

    if (timeString) {
      formattedDate += ` at ${timeString}`;
    }

    return formattedDate;
  };

  // Check if deadline has passed
  const isDeadlinePassed = () => {
    if (!jobPosting?.has_deadline || !jobPosting?.deadline_date) return false;

    const today = new Date();
    const deadline = new Date(jobPosting.deadline_date);

    if (jobPosting.deadline_time) {
      const [hours, minutes] = jobPosting.deadline_time.split(':').map(Number);
      deadline.setHours(hours, minutes);
    } else {
      deadline.setHours(23, 59, 59);
    }

    return today > deadline;
  };

  // Handle delete
  const handleDelete = async () => {
    if (!jobPosting || userProfile?.id !== jobPosting.profile_id) return;

    const confirmed = confirm(
      'Are you sure you want to delete this job posting?'
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobPosting.id);

      if (error) throw error;

      // Redirect back to listings page
      router.push('/find-work');
    } catch (err: any) {
      console.error('Error deleting job posting:', err);
      setError(err.message || 'Failed to delete job posting');
      setLoading(false);
    }
  };

  // Check if the current user is the owner of this job posting
  const isOwner =
    userProfile && jobPosting && userProfile.id === jobPosting.profile_id;

  // Check if the current user is a content creator (can apply/save)
  const isContentCreator = userProfile?.user_type === 'creator';

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !jobPosting) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error || 'Job posting not found'}</p>
          <Link href="/find-work">
            <button className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Back to Listings
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Link href="/find-work">
          <button className="mb-6 hover:cursor-pointer flex items-center text-gray-600 hover:text-gray-900">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Back to Listings
          </button>
        </Link>

        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">{jobPosting.title}</h1>

          {/* Save button for content creators */}
          {isContentCreator && !isOwner && (
            <button
              onClick={handleSaveJob}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none transition-colors"
              disabled={isActionLoading}
              aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
              {isActionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              ) : (
                <BookmarkIcon
                  className={`h-5 w-5 ${
                    isSaved ? 'fill-current text-blue-600' : 'text-gray-600'
                  }`}
                />
              )}
            </button>
          )}
        </div>

        <div className="flex items-center mt-4">
          <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {jobPosting.profile_photo_url ? (
              <Image
                src={jobPosting.profile_photo_url}
                alt={jobPosting.username}
                width={60}
                height={60}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                <span className="font-bold">
                  {jobPosting.first_name.charAt(0)}
                  {jobPosting.last_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <p className="font-medium">{jobPosting.username}</p>
            <p className="text-sm text-gray-500">
              Posted on {formatDate(jobPosting.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Job Details</h2>
          <p className="text-gray-500 mt-1">
            {jobPosting.city}, {jobPosting.country}
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {jobPosting.has_deadline && (
              <div
                className={`${
                  isDeadlinePassed()
                    ? 'text-red-600 bg-red-50'
                    : 'text-blue-600 bg-blue-50'
                } p-4 rounded-lg`}
              >
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span className="font-medium">Deadline:</span>
                  <span className="ml-2">
                    {formatDeadline(
                      jobPosting.deadline_date,
                      jobPosting.deadline_time
                    )}
                  </span>
                </div>
                {isDeadlinePassed() && (
                  <p className="mt-2 text-sm">This job posting has expired.</p>
                )}
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <div className="prose max-w-none">
                {/* Split description into paragraphs */}
                {jobPosting.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">About the Business</h3>
              <Link
                href={`/creators/${jobPosting.username}`}
                className="text-blue-600 hover:underline"
              >
                View {jobPosting.first_name}&apos;s profile
              </Link>
            </div>

            {/* Show applicants list for business owners */}
            {isOwner && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4">Applicants</h3>
                {applicants.length === 0 ? (
                  <p className="text-gray-500">
                    No one has applied for this job posting yet.
                  </p>
                ) : (
                  <>
                    <p className="text-gray-700 mb-4">
                      {applicants.length}{' '}
                      {applicants.length === 1 ? 'person has' : 'people have'}{' '}
                      applied for this job.
                    </p>

                    <button
                      onClick={() => setShowApplicants(!showApplicants)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mb-4"
                    >
                      {showApplicants ? 'Hide Applicants' : 'View Applicants'}
                    </button>

                    {showApplicants && (
                      <div className="space-y-4 mt-4">
                        {applicants.map((applicant) => (
                          <div
                            key={applicant.id}
                            className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                              {applicant.profile_photo_url ? (
                                <Image
                                  src={applicant.profile_photo_url}
                                  alt={applicant.username}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                                  <span className="font-bold">
                                    {applicant.first_name.charAt(0)}
                                    {applicant.last_name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-grow">
                              <h4 className="font-medium">
                                {applicant.first_name} {applicant.last_name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                @{applicant.username} • {applicant.city},{' '}
                                {applicant.country}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Applied on {formatDate(applicant.created_at)}
                              </p>
                            </div>
                            <Link
                              href={`/creators/${applicant.username}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View Profile
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
            {isOwner ? (
              <div className="flex gap-4">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Job Posting
                </button>
              </div>
            ) : isContentCreator ? (
              <>
                {isApplied ? (
                  <div className="flex items-center text-green-700 font-medium">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    You&apos;ve applied for this job
                  </div>
                ) : (
                  <button
                    onClick={handleApplyForJob}
                    disabled={isActionLoading || isDeadlinePassed()}
                    className={`px-4 py-2 rounded-md ${
                      isDeadlinePassed()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {isActionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                        Applying...
                      </>
                    ) : isDeadlinePassed() ? (
                      'Deadline Passed'
                    ) : (
                      'Apply for this Job'
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="text-gray-500">
                {session ? (
                  'Only content creators can apply for jobs'
                ) : (
                  <Link href={`/?redirectTo=/find-work/${slug}`}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Sign in to apply
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
