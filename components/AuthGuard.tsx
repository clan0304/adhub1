'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          // User is not authenticated, redirect to login
          router.push('/?returnUrl=/find-work');
          return;
        }

        // User is authenticated
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error checking authentication:', error);
        // In case of error, redirect to login
        router.push('/?returnUrl=/find-work');
      }
    };

    checkAuth();
  }, [router, supabase]);

  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If authenticated, show the children
  return <>{children}</>;
}
