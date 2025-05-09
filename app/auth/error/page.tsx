// app/auth/error/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Extract any error information from the URL
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error && errorDescription) {
      setErrorMessage(`${error}: ${errorDescription}`);
    } else if (error) {
      setErrorMessage(error);
    } else {
      setErrorMessage('An unknown authentication error occurred');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Authentication Error
        </h1>

        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            There was a problem during the authentication process. This could be
            due to:
          </p>

          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li>Mismatched redirect URLs</li>
            <li>Canceled authentication</li>
            <li>Expired or invalid tokens</li>
            <li>Server configuration issues</li>
          </ul>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
