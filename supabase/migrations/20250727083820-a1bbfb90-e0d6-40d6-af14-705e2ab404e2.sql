-- Add additional fields to event_rsvps table for detailed registration info
ALTER TABLE event_rsvps ADD COLUMN full_name TEXT;
ALTER TABLE event_rsvps ADD COLUMN phone_number TEXT;
ALTER TABLE event_rsvps ADD COLUMN email_address TEXT;