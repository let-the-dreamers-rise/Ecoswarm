import { describe, it, expect } from 'vitest';

describe('Infrastructure Setup', () => {
  it('should have core dependencies available', () => {
    // Test that core modules can be imported
    expect(() => require('express')).not.toThrow();
    expect(() => require('ws')).not.toThrow();
    expect(() => require('@hashgraph/sdk')).not.toThrow();
    expect(() => require('cors')).not.toThrow();
    expect(() => require('dotenv')).not.toThrow();
  });

  it('should have fast-check available for property-based testing', () => {
    expect(() => require('fast-check')).not.toThrow();
  });
});
