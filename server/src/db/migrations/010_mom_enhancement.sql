-- Enhanced MoM (Minutes of Meeting) Schema
-- This migration enhances the meetings table to support comprehensive MoM functionality

-- Add new columns to meetings table (MySQL doesn't support IF NOT EXISTS in ALTER TABLE)
-- These will fail if columns already exist - that's expected
ALTER TABLE meetings 
  ADD COLUMN meeting_type VARCHAR(50) DEFAULT 'Internal',
  ADD COLUMN agenda TEXT,
  ADD COLUMN discussion_points TEXT,
  ADD COLUMN decisions_taken TEXT,
  ADD COLUMN next_meeting_date DATE,
  ADD COLUMN status ENUM('draft', 'published', 'archived') DEFAULT 'draft';

-- Create meeting_participants table for many-to-many relationship
CREATE TABLE IF NOT EXISTS meeting_participants (
  id CHAR(36) PRIMARY KEY,
  meeting_id CHAR(36) NOT NULL,
  participant_id CHAR(36) NOT NULL,
  participant_type ENUM('user', 'customer', 'vendor', 'employee') DEFAULT 'user',
  role VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mp_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participant (meeting_id, participant_id, participant_type)
);

-- Enhance meeting_minutes table (action items)
-- Note: These will fail if columns already exist
ALTER TABLE meeting_minutes
  ADD COLUMN task TEXT,
  ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium';

-- Update status enum if needed (this may fail if already updated)
-- Note: MODIFY COLUMN will change the enum values
ALTER TABLE meeting_minutes
  MODIFY COLUMN status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending';

-- Create indexes for better query performance (MySQL does not support IF NOT EXISTS for indexes)
CREATE INDEX idx_meetings_date ON meetings(meeting_date);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_type ON meetings(meeting_type);
CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_participant ON meeting_participants(participant_id);
CREATE INDEX idx_meeting_minutes_meeting ON meeting_minutes(meeting_id);
CREATE INDEX idx_meeting_minutes_status ON meeting_minutes(status);
