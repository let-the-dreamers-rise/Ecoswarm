import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import PortfolioChart from '../components/PortfolioChart';
import type { PortfolioResponse } from '../types';

describe('PortfolioChart', () => {
  const mockPortfolio: PortfolioResponse = {
    allocations: {
      Solar: 25,
      River_Cleanup: 25,
      Reforestation: 25,
      Carbon_Capture: 25
    },
    last_rebalanced: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    // Mock D3 transitions to execute immediately in tests
    vi.useFakeTimers();
  });

  it('renders pie chart with allocation data', () => {
    const { container } = render(<PortfolioChart portfolio={mockPortfolio} />);
    
    // Check that SVG is rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    
    // Check that paths (pie slices) are created
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(4); // One for each category
  });

  it('displays percentage labels for each category', () => {
    const { container } = render(<PortfolioChart portfolio={mockPortfolio} />);
    
    vi.advanceTimersByTime(500); // Fast-forward animation
    
    // Check that text elements exist
    const textElements = container.querySelectorAll('text');
    expect(textElements.length).toBeGreaterThanOrEqual(4);
  });

  it('shows rebalancing display when change > 5%', () => {
    const previousAllocations = {
      Solar: 20,
      River_Cleanup: 30,
      Reforestation: 25,
      Carbon_Capture: 25
    };

    const newPortfolio: PortfolioResponse = {
      allocations: {
        Solar: 30, // +10% change
        River_Cleanup: 20, // -10% change
        Reforestation: 25,
        Carbon_Capture: 25
      },
      last_rebalanced: '2024-01-01T00:00:00Z'
    };

    const { container } = render(
      <PortfolioChart portfolio={newPortfolio} previousAllocations={previousAllocations} />
    );

    
    vi.advanceTimersByTime(500);
    
    // Check for rebalancing legend
    const rebalancingText = container.querySelector('.rebalancing-legend');
    expect(rebalancingText).toBeTruthy();
  });

  it('does not show rebalancing display when change <= 5%', () => {
    const previousAllocations = {
      Solar: 24,
      River_Cleanup: 26,
      Reforestation: 25,
      Carbon_Capture: 25
    };

    const newPortfolio: PortfolioResponse = {
      allocations: {
        Solar: 26, // +2% change
        River_Cleanup: 24, // -2% change
        Reforestation: 25,
        Carbon_Capture: 25
      },
      last_rebalanced: '2024-01-01T00:00:00Z'
    };

    const { container } = render(
      <PortfolioChart portfolio={newPortfolio} previousAllocations={previousAllocations} />
    );
    
    vi.advanceTimersByTime(500);
    
    // Check that rebalancing legend is not present
    const rebalancingText = container.querySelector('.rebalancing-legend');
    expect(rebalancingText).toBeFalsy();
  });

  it('updates chart with smooth animations', () => {
    const { container, rerender } = render(<PortfolioChart portfolio={mockPortfolio} />);
    
    const updatedPortfolio: PortfolioResponse = {
      allocations: {
        Solar: 30,
        River_Cleanup: 30,
        Reforestation: 20,
        Carbon_Capture: 20
      },
      last_rebalanced: '2024-01-01T01:00:00Z'
    };

    rerender(<PortfolioChart portfolio={updatedPortfolio} />);
    
    // Check that chart is re-rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(4);
  });

  it('handles null portfolio gracefully', () => {
    const { container } = render(<PortfolioChart portfolio={null} />);
    
    // Should not render SVG content when portfolio is null
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(0);
  });

  it('uses correct category colors', () => {
    const { container } = render(<PortfolioChart portfolio={mockPortfolio} />);
    
    const paths = container.querySelectorAll('path');
    const colors = Array.from(paths).map(path => path.getAttribute('fill'));
    
    // Check that colors match the defined category colors
    expect(colors).toContain('#facc15'); // Solar (yellow)
    expect(colors).toContain('#60a5fa'); // River_Cleanup (blue)
    expect(colors).toContain('#4ade80'); // Reforestation (green)
    expect(colors).toContain('#9ca3af'); // Carbon_Capture (gray)
  });
});
