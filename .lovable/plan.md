
# Privacy Policy Page Redesign for App Store Compliance

## Overview
This plan creates a comprehensive, legally-compliant privacy policy page that meets both Google Play Store and Apple App Store requirements for mobile app submission.

## Why This is Needed
Both app stores require detailed privacy policies that disclose:
- What data is collected
- How data is used
- Third-party data sharing
- User rights and controls
- Data retention and deletion policies
- Children's privacy (COPPA compliance)
- Security measures
- Contact information

---

## What Will Be Created

### Complete Restructured Privacy Policy Page (`src/pages/PrivacyPolicy.tsx`)

The new page will include these mandatory sections:

### 1. Header Section
- Effective date: January 27, 2026
- App name and developer info
- Quick summary of key points
- Table of contents for easy navigation

### 2. Data Collection Section
**Personal Information:**
- Account data (name, email, phone, profile photo)
- Profile information (bio, interests, preferences)
- Location data (state, city, neighborhood, address)
- Emergency contact information

**Automatically Collected Data:**
- Device information (device type, OS, unique identifiers)
- Usage data (features used, interaction patterns, timestamps)
- Log data (IP address, access times, pages viewed, crash logs)
- Location services (GPS, network-based location with consent)

**Permissions Used (App Store Requirement):**
- Camera: For uploading photos to posts, profile pictures, marketplace listings
- Microphone: For voice calls and video calls
- Location: For neighborhood-based features, emergency alerts, nearby content
- Contacts: For finding friends who use NeighborLink (optional)
- Push Notifications: For emergency alerts, messages, community updates
- Photos/Media: For uploading images from gallery

### 3. How We Use Your Data Section
- Providing neighborhood networking services
- Connecting users with local community
- Enabling messaging and communication
- Emergency safety features (Panic Button, safety alerts)
- Marketplace functionality
- Personalized content and recommendations
- Service improvement and analytics
- Security and fraud prevention

### 4. Data Sharing and Third Parties Section
**With Other Users:**
- Profile information visible based on privacy settings
- Posts and comments visible to community
- Location shared with emergency contacts when enabled

**Third-Party Services:**
- Supabase (database and authentication)
- Google Maps (location services)
- Push notification services (Apple APNs, Google FCM)
- No data sold to advertisers

**Legal Requirements:**
- Law enforcement with valid legal process
- Emergency situations affecting user safety

### 5. User Rights and Controls Section
- Access and download personal data
- Correct inaccurate information
- Delete account and all associated data
- Control privacy settings (profile visibility, location sharing, messaging preferences)
- Opt-out of non-essential communications
- Withdraw consent for specific features
- How to exercise these rights (in-app settings, email contact)

### 6. Data Security Section
- Encryption (data in transit and at rest)
- Secure authentication (password hashing, MFA support)
- Access controls and monitoring
- Regular security assessments
- Incident response procedures

### 7. Data Retention Section
- Active account: Data retained while account is active
- Deleted account: Personal data deleted within 30 days
- Legal holds: Data may be retained for legal compliance
- Anonymized data: May be retained for analytics

### 8. Children's Privacy (COPPA/App Store Requirement)
- App not intended for users under 13
- No knowing collection of children's data
- Parental notification and deletion procedures

### 9. International Data Transfers
- Data stored on servers in secure locations
- Compliance with Nigerian data protection regulations (NDPR)
- Cross-border transfer safeguards

### 10. Cookies and Tracking
- Session cookies for authentication
- No third-party advertising cookies
- Analytics for service improvement only

### 11. Changes to Privacy Policy
- Notification of material changes
- Continued use constitutes acceptance
- Prior versions available upon request

### 12. Contact Information
- Data Protection Officer email
- Physical address
- Response timeframe (within 30 days)

---

## Technical Implementation Details

### File Changes:
1. **`src/pages/PrivacyPolicy.tsx`** - Complete rewrite with expanded sections

### Component Structure:
```text
PrivacyPolicyPage
+-- Header (sticky navigation)
+-- HeroSection (title, effective date, summary)
+-- TableOfContents (linked navigation)
+-- Section Cards:
    +-- DataCollectionSection
    +-- PermissionsSection (camera, location, etc.)
    +-- DataUsageSection
    +-- DataSharingSection
    +-- UserRightsSection
    +-- SecuritySection
    +-- RetentionSection
    +-- ChildrenPrivacySection
    +-- InternationalTransfersSection
    +-- CookiesSection
    +-- UpdatesSection
    +-- ContactSection
+-- Footer
```

### Design Approach:
- Expandable accordion sections for easy reading
- Clear visual hierarchy with icons for each section
- Highlighted permission boxes explaining why each permission is needed
- Mobile-friendly layout (important for app store reviewers)
- Print-friendly version link
- Last updated date prominently displayed

### App Store Specific Requirements Met:
| Requirement | Implementation |
|-------------|----------------|
| Google Play Data Safety | Permissions section with purpose |
| Apple App Privacy Labels | Data types with collection purposes |
| COPPA Compliance | Children's privacy section |
| GDPR Rights | User rights and controls section |
| California CCPA | Right to delete, access, know |
| Nigerian NDPR | Data protection compliance mention |

---

## Additional Updates Needed

### 1. Fix Build Error
The Supabase realtime-js dependency error needs to be resolved by updating the Supabase edge function import syntax.

### 2. Update Copyright Year
Change all "2024" references to "2026" throughout the privacy policy.

### 3. Update Component Reference
Also update `src/components/legal/PrivacyPolicy.tsx` (used in modals) to be consistent with the main page.

---

## Summary

This comprehensive privacy policy will:
- Pass Google Play Store review requirements
- Meet Apple App Store privacy guidelines
- Comply with Nigerian NDPR regulations
- Address all permission usage clearly
- Provide users with clear rights and controls
- Build trust with transparent data practices

The implementation will take the existing basic privacy policy and expand it into a full legal document that covers all aspects required for mobile app store submissions.
