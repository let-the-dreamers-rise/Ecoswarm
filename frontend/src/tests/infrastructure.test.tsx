import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import App from '../App';

describe('Frontend Infrastructure', () => {
  it('should render App component', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });

  it('should have React and ReactDOM available', () => {
    expect(React).toBeDefined();
  });

  it('should display EcoSwarm headline', () => {
    const { getByText } = render(<App />);
    expect(getByText(/EcoSwarm Regen: Verified Sustainability Treasury/i)).toBeDefined();
  });
});
