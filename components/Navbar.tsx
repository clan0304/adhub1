/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        setLoading(true);

        // Use getUser() which is more secure as it validates with Auth server
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error('Error fetching user:', error);
          setUser(null);
          setProfile(null);
          return;
        }

        setUser(user);

        // If user is authenticated, fetch their profile
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            setProfile(null);
            return;
          }

          setProfile(profileData);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();

    // Set up subscription for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // When auth state changes, call getUser() again to validate
      fetchUserAndProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Get initials for the profile button
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;
    }

    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return '?';
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              {/* Replace with your actual logo */}
              <div className="h-8 w-auto">
                <div className="text-blue-600 font-bold text-xl">Your Logo</div>
                {/* If you have an image logo:
                <Image
                  src="/your-logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                />
                */}
              </div>
            </Link>
          </div>

          {/* Right side - Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link
              href="/creators"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Creators
            </Link>
            <Link
              href="/find-work"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Find Work
            </Link>

            {/* Auth buttons */}
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <div className="relative">
                <Link href="/dashboard">
                  {profile?.profile_photo_url ? (
                    <div className="h-8 w-8 rounded-full overflow-hidden">
                      <Image
                        src={profile.profile_photo_url}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                </Link>
              </div>
            ) : (
              <Link
                href="/"
                className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* X icon */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="pt-2 pb-3 space-y-1 px-2">
          <Link
            href="/creators"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            Creators
          </Link>
          <Link
            href="/find-work"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            Find Work
          </Link>

          {/* Show profile link if authenticated */}
          {user && (
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              My Profile
            </Link>
          )}
        </div>

        {/* Auth section in mobile menu */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          {loading ? (
            <div className="flex items-center px-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="ml-3 w-24 h-5 bg-gray-200 animate-pulse rounded"></div>
            </div>
          ) : user ? (
            <div>
              <div className="flex items-center px-4">
                {profile?.profile_photo_url ? (
                  <div className="h-10 w-10 rounded-full overflow-hidden">
                    <Image
                      src={profile.profile_photo_url}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {getInitials()}
                    </span>
                  </div>
                )}
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {profile?.first_name && profile?.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : user.email}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="px-4">
              <Link
                href="/"
                className="block px-4 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 text-center"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
