'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookmarkIcon, TrashIcon, PencilIcon } from 'lucide-react';

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

interface JobPostingCardProps {
  job: JobPosting;
  isOwner: boolean;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (job: JobPosting) => void;
  onSaveToggle: (isSaved: boolean) => void;
  isSaved: boolean;
  isContentCreator: boolean;
}

export default function JobPostingCard({
  job,
  isOwner,
  onDelete,
  onEdit,
  onSaveToggle,
  isSaved,
  isContentCreator,
}: JobPostingCardProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format deadline
  const formatDeadline = (
    dateString: string | null,
    timeString: string | null
  ) => {
    if (!dateString) return null;

    let result = formatDate(dateString);
    if (timeString) {
      result += ` at ${timeString}`;
    }
    return result;
  };

  // Check if deadline has passed
  const isDeadlinePassed = () => {
    if (!job.has_deadline || !job.deadline_date) return false;

    const today = new Date();
    const deadline = new Date(job.deadline_date);

    // Add time if provided
    if (job.deadline_time) {
      const [hours, minutes] = job.deadline_time.split(':').map(Number);
      deadline.setHours(hours, minutes);
    } else {
      deadline.setHours(23, 59, 59);
    }

    return today > deadline;
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Handle delete with confirmation
  const handleDelete = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete this job posting?'
    );
    if (confirmed) {
      await onDelete(job.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        {/* Job title and save button */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600">
            <Link href={`/find-work/${job.slug}`}>
              {truncateText(job.title, 60)}
            </Link>
          </h2>

          {isContentCreator && !isOwner && (
            <button
              onClick={() => onSaveToggle(isSaved)}
              className={`p-2 rounded-full ${
                isSaved
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
              <BookmarkIcon
                className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Creator info */}
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {job.profile_photo_url ? (
              <Image
                src={job.profile_photo_url}
                alt={job.username}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                <span className="font-bold">
                  {job.first_name.charAt(0)}
                  {job.last_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{job.username}</p>
            <p className="text-xs text-gray-500">
              {job.city}, {job.country}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-gray-600">{truncateText(job.description, 150)}</p>
        </div>

        {/* Deadline */}
        {job.has_deadline && (
          <div
            className={`${
              isDeadlinePassed() ? 'text-red-600' : 'text-blue-600'
            } text-sm p-2 rounded-md mb-4 ${
              isDeadlinePassed() ? 'bg-red-50' : 'bg-blue-50'
            }`}
          >
            <span className="font-medium">Deadline:</span>{' '}
            {formatDeadline(job.deadline_date, job.deadline_time)}
            {isDeadlinePassed() && ' (Expired)'}
          </div>
        )}

        {/* Date posted */}
        <div className="text-xs text-gray-500 mb-4">
          Posted on {formatDate(job.created_at)}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center mt-4">
          <Link
            href={`/find-work/${job.slug}`}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            View Details
          </Link>

          {isOwner && (
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit && onEdit(job)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                aria-label="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                aria-label="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
