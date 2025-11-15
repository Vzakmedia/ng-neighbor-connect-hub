import { useMemo } from 'react';
import { 
  UserIcon, 
  MapPinIcon, 
  HomeIcon, 
  PhoneIcon, 
  PhotoIcon,
  DocumentTextIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface ProfileSection {
  id: string;
  label: string;
  field: string;
  weight: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface ProfileCompletionStatus {
  percentage: number;
  completedSections: ProfileSection[];
  missingSections: ProfileSection[];
  isComplete: boolean;
  getColorClass: () => string;
  getStatusText: () => string;
}

const PROFILE_SECTIONS: ProfileSection[] = [
  {
    id: 'full_name',
    label: 'Full Name',
    field: 'full_name',
    weight: 15,
    icon: UserIcon,
    description: 'Add your name to personalize your profile'
  },
  {
    id: 'state',
    label: 'State',
    field: 'state',
    weight: 10,
    icon: MapPinIcon,
    description: 'Select your state'
  },
  {
    id: 'city',
    label: 'City',
    field: 'city',
    weight: 10,
    icon: MapPinIcon,
    description: 'Select your city'
  },
  {
    id: 'neighborhood',
    label: 'Neighborhood',
    field: 'neighborhood',
    weight: 10,
    icon: MapPinIcon,
    description: 'Select your neighborhood'
  },
  {
    id: 'address',
    label: 'Address',
    field: 'address',
    weight: 15,
    icon: HomeIcon,
    description: 'Add your street address'
  },
  {
    id: 'avatar_url',
    label: 'Profile Photo',
    field: 'avatar_url',
    weight: 15,
    icon: PhotoIcon,
    description: 'Upload a profile picture'
  },
  {
    id: 'phone',
    label: 'Phone Number',
    field: 'phone',
    weight: 10,
    icon: PhoneIcon,
    description: 'Add your contact number'
  },
  {
    id: 'bio',
    label: 'Bio',
    field: 'bio',
    weight: 10,
    icon: DocumentTextIcon,
    description: 'Tell us about yourself'
  },
  {
    id: 'email',
    label: 'Email',
    field: 'email',
    weight: 5,
    icon: EnvelopeIcon,
    description: 'Confirm your email address'
  }
];

export function useProfileCompletion(profile: any | null): ProfileCompletionStatus {
  const completionStatus = useMemo(() => {
    if (!profile) {
      return {
        percentage: 0,
        completedSections: [],
        missingSections: PROFILE_SECTIONS,
        isComplete: false,
        getColorClass: () => 'text-destructive',
        getStatusText: () => 'Not started'
      };
    }

    const completedSections: ProfileSection[] = [];
    const missingSections: ProfileSection[] = [];
    let totalWeight = 0;

    PROFILE_SECTIONS.forEach(section => {
      const value = profile[section.field];
      const isComplete = value !== null && value !== undefined && value !== '';
      
      if (isComplete) {
        completedSections.push(section);
        totalWeight += section.weight;
      } else {
        missingSections.push(section);
      }
    });

    const percentage = Math.round(totalWeight);
    const isComplete = percentage === 100;

    const getColorClass = () => {
      if (percentage >= 80) return 'text-green-500';
      if (percentage >= 50) return 'text-yellow-500';
      return 'text-destructive';
    };

    const getStatusText = () => {
      if (percentage === 100) return 'Complete';
      if (percentage >= 80) return 'Almost there';
      if (percentage >= 50) return 'In progress';
      return 'Just started';
    };

    return {
      percentage,
      completedSections,
      missingSections,
      isComplete,
      getColorClass,
      getStatusText
    };
  }, [profile]);

  return completionStatus;
}
