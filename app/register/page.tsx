'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import UserTypeSelection from '@/components/register/UserTypeSelection';
import BasicInfoForm from '@/components/register/BasicInfoForm';
import CreatorInfoForm from '@/components/register/CreatorInfoForm';
import { RegistrationFormData, UserType } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<RegistrationFormData>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    profilePhoto: null,
    city: '',
    country: '',
    userType: 'creator',
    isPublic: false,
    isCollaborated: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Redirect to login if not authenticated
        router.push('/');
        return;
      }

      // Pre-fill email from OAuth
      if (session.user.email) {
        setUserData((prev) => ({
          ...prev,
          email: session.user.email || '',
        }));
      }
    };

    checkAuth();
  }, [router, supabase]);

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleUserTypeSelection = (type: UserType) => {
    setUserData((prev) => ({
      ...prev,
      userType: type,
    }));
    handleNext();
  };

  const handleFormChange = (data: Partial<RegistrationFormData>) => {
    setUserData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload profile photo if provided
      let profilePhotoUrl = null;
      if (userData.profilePhoto) {
        const fileExt = userData.profilePhoto.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, userData.profilePhoto);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('profile-photos').getPublicUrl(fileName);

        profilePhotoUrl = publicUrl;
      }

      // Save user data to profiles table
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        username: userData.username,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone_number: userData.phoneNumber,
        profile_photo_url: profilePhotoUrl,
        city: userData.city,
        country: userData.country,
        user_type: userData.userType,
        instagram_url: userData.instagramUrl,
        tiktok_url: userData.tiktokUrl,
        youtube_url: userData.youtubeUrl,
        is_public: userData.isPublic,
        is_collaborated: userData.isCollaborated,
      });

      if (insertError) {
        throw insertError;
      }

      // Redirect to dashboard after successful registration
      router.push('/dashboard');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(
        err.message || 'Failed to complete registration. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <UserTypeSelection
            selectedType={userData.userType}
            onSelect={handleUserTypeSelection}
          />
        );
      case 1:
        return (
          <BasicInfoForm
            data={userData}
            onChange={handleFormChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 2:
        return userData.userType === 'creator' ? (
          <CreatorInfoForm
            data={userData}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            loading={loading}
          />
        ) : (
          // For business owners, we skip the creator-specific step and proceed to submit
          <div className="flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-6">Review & Submit</h2>
            <p className="mb-6">
              Please review your information before submitting.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handlePrevious}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            {error && <p className="mt-4 text-red-600">{error}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center mb-8">
            Complete Your Registration
          </h1>

          {/* Step indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 0 ? 'bg-blue-600 text-white' : 'bg-gray-300'
                }`}
              >
                1
              </div>
              <div
                className={`w-16 h-1 ${
                  currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'
                }`}
              >
                2
              </div>
              <div
                className={`w-16 h-1 ${
                  currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'
                }`}
              >
                3
              </div>
            </div>
          </div>

          {renderStep()}
        </div>
      </div>
    </div>
  );
}
