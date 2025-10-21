-- Phase 1: Clean up orphaned service_bookings records
-- Delete bookings with missing client profiles
DELETE FROM service_bookings
WHERE client_id NOT IN (SELECT id FROM profiles);

-- Delete bookings with missing provider profiles
DELETE FROM service_bookings
WHERE provider_id NOT IN (SELECT id FROM profiles);

-- Delete bookings with missing services
DELETE FROM service_bookings
WHERE service_id NOT IN (SELECT id FROM services);

-- Phase 2: Add proper foreign key constraints with CASCADE delete
-- First, drop existing foreign keys if they exist
ALTER TABLE service_bookings DROP CONSTRAINT IF EXISTS service_bookings_client_id_fkey;
ALTER TABLE service_bookings DROP CONSTRAINT IF EXISTS service_bookings_provider_id_fkey;
ALTER TABLE service_bookings DROP CONSTRAINT IF EXISTS service_bookings_service_id_fkey;

-- Add new foreign keys with ON DELETE CASCADE to prevent orphaned records
ALTER TABLE service_bookings
  ADD CONSTRAINT service_bookings_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE service_bookings
  ADD CONSTRAINT service_bookings_provider_id_fkey 
  FOREIGN KEY (provider_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE service_bookings
  ADD CONSTRAINT service_bookings_service_id_fkey 
  FOREIGN KEY (service_id) 
  REFERENCES services(id) 
  ON DELETE CASCADE;

-- Phase 4: Add check constraint to ensure valid references (fail-fast validation)
-- This prevents creating bookings with invalid IDs
CREATE OR REPLACE FUNCTION validate_booking_references()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify client exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.client_id) THEN
    RAISE EXCEPTION 'Invalid client_id: Profile does not exist';
  END IF;
  
  -- Verify provider exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.provider_id) THEN
    RAISE EXCEPTION 'Invalid provider_id: Profile does not exist';
  END IF;
  
  -- Verify service exists
  IF NOT EXISTS (SELECT 1 FROM services WHERE id = NEW.service_id) THEN
    RAISE EXCEPTION 'Invalid service_id: Service does not exist';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate references before insert
DROP TRIGGER IF EXISTS validate_booking_references_trigger ON service_bookings;
CREATE TRIGGER validate_booking_references_trigger
  BEFORE INSERT ON service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_references();