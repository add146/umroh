-- Migration: Package Enhancements
-- Add duration and serviceType columns to packages table

ALTER TABLE packages ADD COLUMN duration TEXT;
ALTER TABLE packages ADD COLUMN service_type TEXT;
