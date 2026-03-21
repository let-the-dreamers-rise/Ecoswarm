import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIDecisionDisplay from '../components/AIDecisionDisplay';
import type { OptimizeResponse } from '../types';

describe('AIDecisionDisplay', () => {
  const mockCurrentAllocation = {
    Solar: 30,
    River_Cleanup: 25,
    Reforestation: 25,
    Carbon_Capture: 20
  };

  const mockOptimizerData: OptimizeResponse = {
    recommended_allocation: {
      Solar: 35,
      River_Cleanup: 25,
      Reforestation: 20,
      Carbon_Capture: 20
    },
    decision_logic: 'Solar category shows highest impact-per-dollar ratio. Increasing allocation by 5% to maximize environmental impact.',
    impact_per_dollar_ratios: {
      Solar: 8.5,
      River_Cleanup: 6.2,
      Reforestation: 5.8,
      Carbon_Capture: 4.1
    },
    rebalancing_needed: true
  };

  describe('Sub-task 24.2: Unit tests for AI Decision Display', () => {
    it('should display current allocation percentages', () => {
      render(
        <AIDecisionDisplay
          currentAllocation={mockCurrentAllocation}
          optimizerData={null}
        />
      );

      expect(screen.getByText('Current Allocation')).toBeInTheDocument();
      expect(screen.getByText('Solar')).toBeInTheDocument();
      expect(screen.getByText('River Cleanup')).toBeInTheDocument();
      expect(screen.getByText('Reforestation')).toBeInTheDocument();
      expect(screen.getByText('Carbon Capture')).toBeInTheDocument();

      expect(screen.getByText('30.0%')).toBeInTheDocument();
      const twentyFivePercents = screen.getAllByText('25.0%');
      expect(twentyFivePercents.length).toBe(2);
      expect(screen.getByText('20.0%')).toBeInTheDocument();
    });

    it('should display impact-per-dollar ratios when optimizer data is provided', () => {
      render(
        <AIDecisionDisplay
          currentAllocation={mockCurrentAllocation}
          optimizerData={mockOptimizerData}
        />
      );

      expect(screen.getByText('Impact-per-Dollar Ratios')).toBeInTheDocument();
      expect(screen.getByText('8.50')).toBeInTheDocument();
      expect(screen.getByText('6.20')).toBeInTheDocument();
      expect(screen.getByText('5.80')).toBeInTheDocument();
      expect(screen.getByText('4.10')).toBeInTheDocument();
    });

    it('should display recommended allocation when rebalancing occurs', () => {
      render(
        <AIDecisionDisplay
          currentAllocation={mockCurrentAllocation}
          optimizerData={mockOptimizerData}
        />
      );

      expect(screen.getByText('Recommended New Allocation')).toBeInTheDocument();
      expect(screen.getByText('35.0%')).toBeInTheDocument();
    });

    it('should display decision logic explanation', () => {
      render(
        <AIDecisionDisplay
          currentAllocation={mockCurrentAllocation}
          optimizerData={mockOptimizerData}
        />
      );

      expect(screen.getByText('AI Decision Logic')).toBeInTheDocument();
      expect(screen.getByText(/Solar category shows highest impact-per-dollar ratio/)).toBeInTheDocument();
    });

    it('should show waiting message when no allocation data is available', () => {
      render(
        <AIDecisionDisplay
          currentAllocation={null}
          optimizerData={null}
        />
      );

      expect(screen.getByText('Waiting for portfolio data...')).toBeInTheDocument();
    });

    it('should show no rebalancing message when rebalancing is not needed', () => {
      const noRebalanceData: OptimizeResponse = {
        ...mockOptimizerData,
        rebalancing_needed: false
      };

      render(
        <AIDecisionDisplay
          currentAllocation={mockCurrentAllocation}
          optimizerData={noRebalanceData}
        />
      );

      expect(screen.getByText(/Portfolio is well-balanced/)).toBeInTheDocument();
    });

    it('should display allocation changes with signed deltas', () => {
      render(
        <AIDecisionDisplay
          currentAllocation={mockCurrentAllocation}
          optimizerData={mockOptimizerData}
        />
      );

      expect(screen.getByText('+ 5.0%')).toBeInTheDocument();
      expect(screen.getByText('- 5.0%')).toBeInTheDocument();
    });

    it('should handle missing impact ratios gracefully', () => {
      const dataWithoutRatios: OptimizeResponse = {
        recommended_allocation: mockOptimizerData.recommended_allocation,
        decision_logic: mockOptimizerData.decision_logic,
        impact_per_dollar_ratios: {},
        rebalancing_needed: true
      };

      render(
        <AIDecisionDisplay
          currentAllocation={mockCurrentAllocation}
          optimizerData={dataWithoutRatios}
        />
      );

      expect(screen.getByText('Current Allocation')).toBeInTheDocument();
    });

    it('should display all four categories with correct colors', () => {
      const { container } = render(
        <AIDecisionDisplay
          currentAllocation={mockCurrentAllocation}
          optimizerData={mockOptimizerData}
        />
      );

      const yellowElements = container.querySelectorAll('.text-yellow-400');
      const blueElements = container.querySelectorAll('.text-blue-400');
      const greenElements = container.querySelectorAll('.text-green-400');
      const grayElements = container.querySelectorAll('.text-gray-400');

      expect(yellowElements.length).toBeGreaterThan(0);
      expect(blueElements.length).toBeGreaterThan(0);
      expect(greenElements.length).toBeGreaterThan(0);
      expect(grayElements.length).toBeGreaterThan(0);
    });
  });
});
