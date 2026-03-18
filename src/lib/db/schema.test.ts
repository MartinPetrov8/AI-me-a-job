import { describe, it, expect } from 'vitest';
import { sessions, profiles } from './schema';
import { getTableConfig } from 'drizzle-orm/pg-core';

describe('sessions table schema', () => {
  it('exports sessions table', () => {
    expect(sessions).toBeDefined();
    expect(typeof sessions).toBe('object');
  });

  it('has id column', () => {
    expect(sessions.id).toBeDefined();
    expect(sessions.id.name).toBe('id');
    expect(sessions.id.dataType).toBe('string');
    expect(sessions.id.primary).toBe(true);
  });

  it('has profileId column', () => {
    expect(sessions.profileId).toBeDefined();
    expect(sessions.profileId.name).toBe('profile_id');
    expect(sessions.profileId.dataType).toBe('string');
    expect(sessions.profileId.notNull).toBe(true);
  });

  it('has sessionToken column', () => {
    expect(sessions.sessionToken).toBeDefined();
    expect(sessions.sessionToken.name).toBe('session_token');
    expect(sessions.sessionToken.dataType).toBe('string');
    expect(sessions.sessionToken.notNull).toBe(true);
  });

  it('has createdAt column', () => {
    expect(sessions.createdAt).toBeDefined();
    expect(sessions.createdAt.name).toBe('created_at');
    expect(sessions.createdAt.dataType).toBe('date');
    expect(sessions.createdAt.notNull).toBe(true);
    expect(sessions.createdAt.hasDefault).toBe(true);
  });

  it('has expiresAt column', () => {
    expect(sessions.expiresAt).toBeDefined();
    expect(sessions.expiresAt.name).toBe('expires_at');
    expect(sessions.expiresAt.dataType).toBe('date');
    expect(sessions.expiresAt.notNull).toBe(true);
  });

  it('sessionToken has unique constraint', () => {
    expect(sessions.sessionToken.isUnique).toBe(true);
  });

  it('table has foreign key from profileId to profiles', () => {
    const config = getTableConfig(sessions);
    const foreignKeys = config.foreignKeys;
    
    expect(foreignKeys.length).toBeGreaterThan(0);
    
    const profileFk = foreignKeys.find((fk: any) => {
      const refTable = fk.reference();
      return refTable.foreignTable === profiles;
    });
    
    expect(profileFk).toBeDefined();
  });

  it('profileId foreign key has CASCADE delete', () => {
    const config = getTableConfig(sessions);
    const foreignKeys = config.foreignKeys;
    
    const profileFk = foreignKeys.find((fk: any) => {
      const refTable = fk.reference();
      return refTable.foreignTable === profiles;
    });
    
    expect(profileFk?.onDelete).toBe('cascade');
  });
});
