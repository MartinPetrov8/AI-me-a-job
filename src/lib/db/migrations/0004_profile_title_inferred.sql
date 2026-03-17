-- Migration: 0004_profile_title_inferred.sql
-- Add title_inferred column to profiles table for embedding input

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title_inferred text;
