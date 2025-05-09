// app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get the user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    // If not authenticated, redirect to home page
    redirect('/');
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    // If there's an error, redirect to registration to recreate profile
    redirect('/register');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">
                  Your App Name
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {profile.profile_photo_url ? (
                    <Image
                      className="h-10 w-10 rounded-full"
                      src={profile.profile_photo_url}
                      alt={`${profile.first_name} ${profile.last_name}`}
                      width={40}
                      height={40}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {profile.first_name.charAt(0)}
                        {profile.last_name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-base font-medium text-gray-800">
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    @{profile.username}
                  </div>
                </div>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="ml-2 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Welcome to Your Dashboard
              </h2>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Thank you for completing your registration as a{' '}
                  <span className="font-medium text-blue-600">
                    {profile.user_type}
                  </span>
                  .
                </p>
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-base font-medium text-gray-900">
                    Your Profile Information
                  </h3>
                  <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        Username
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        @{profile.username}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        Full name
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile.first_name} {profile.last_name}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        Email
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile.email}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        Phone
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile.phone_number || 'Not provided'}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        Location
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile.city}, {profile.country}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        Account type
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">
                        {profile.user_type}
                      </dd>
                    </div>

                    {profile.user_type === 'creator' && (
                      <>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">
                            Instagram
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {profile.instagram_url ? (
                              <a
                                href={profile.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {profile.instagram_url.replace(
                                  'https://instagram.com/',
                                  '@'
                                )}
                              </a>
                            ) : (
                              'Not provided'
                            )}
                          </dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">
                            TikTok
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {profile.tiktok_url ? (
                              <a
                                href={profile.tiktok_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {profile.tiktok_url.replace(
                                  'https://tiktok.com/',
                                  '@'
                                )}
                              </a>
                            ) : (
                              'Not provided'
                            )}
                          </dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">
                            YouTube
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {profile.youtube_url ? (
                              <a
                                href={profile.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Channel
                              </a>
                            ) : (
                              'Not provided'
                            )}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">
                            Profile Settings
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                profile.is_public
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              } mr-2`}
                            >
                              {profile.is_public
                                ? 'Public Profile'
                                : 'Private Profile'}
                            </span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                profile.is_collaborated
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {profile.is_collaborated
                                ? 'Open to Collaboration'
                                : 'Not Collaborating'}
                            </span>
                          </dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
                <div className="mt-8">
                  <Link
                    href="/edit-profile"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
