'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get the returnUrl from search params if present
  const returnUrl = searchParams.get('returnUrl');

  // Check for the authentication state when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      // If user is logged in and there's a returnUrl, redirect to it
      if (session && returnUrl) {
        router.push(returnUrl);
      }
    };

    checkAuth();
  }, [supabase, router, returnUrl]);

  return (
    <div className="relative isolate overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Connect with Amazing Content Creators
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Find the perfect creator for your brand or showcase your talent to
            potential partners. Our platform connects businesses and content
            creators for amazing collaborations.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/creators"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Discover Creators
            </Link>
            <Link href="/auth">
              <button className="text-sm font-semibold leading-6 text-gray-900 hover:opacity-70">
                Join Us <span aria-hidden="true">→</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
