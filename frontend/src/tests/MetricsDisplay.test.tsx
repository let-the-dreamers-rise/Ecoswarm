import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricsDisplay from '../components/MetricsDisplay';
import type { MetricsResponse } from '../types';

describe('MetricsDisplay', () => {
  it('displays loading state when metrics is null', () => {
    render(<MetricsDisplay metrics={null} />);
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  it('displays all metrics with correct formatting', () => {
    const mockMetrics: MetricsResponse = {
      total_co2_reduced_kg: 1234.56,
      total_energy_generated_kwh: 7890.12,
      total_projects_funded: 42,
      total_events_processed: 100
    };

    render(<MetricsDisplay metrics={mockMetrics} />);

    // Check CO2 reduced
    expect(screen.getByText('Total CO2 Reduced')).toBeInTheDocument();
    expect(screen.getByText('1234.56 kg')).toBeInTheDocument();

    // Check energy generated
    expect(screen.getByText('Total Energy Generated')).toBeInTheDocument();
    expect(screen.getByText('7890.12 kWh')).toBeInTheDocument();

    // Check projects funded
    expect(screen.getByText('Projects Funded')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    // Check events processed
    expect(screen.getByText('Events Processed')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('formats decimal numbers to 2 decimal places', () => {
    const mockMetrics: MetricsResponse = {
      total_co2_reduced_kg: 123.456789,
      total_energy_generated_kwh: 456.789012,
      total_projects_funded: 10,
      total_events_processed: 20
    };

    render(<MetricsDisplay metrics={mockMetrics} />);

    expect(screen.getByText('123.46 kg')).toBeInTheDocument();
    expect(screen.getByText('456.79 kWh')).toBeInTheDocument();
  });

  it('displays zero values correctly', () => {
    const mockMetrics: MetricsResponse = {
      total_co2_reduced_kg: 0,
      total_energy_generated_kwh: 0,
      total_projects_funded: 0,
      total_events_processed: 0,
      total_households_supported: 0,
      total_capital_routed_usd: 0,
      proofs_recorded: 0,
      average_verification_confidence: 0
    };

    render(<MetricsDisplay metrics={mockMetrics} />);

    expect(screen.getByText('0.00 kg')).toBeInTheDocument();
    expect(screen.getByText('0.00 kWh')).toBeInTheDocument();
    expect(screen.getByText('Projects Funded')).toBeInTheDocument();
    expect(screen.getByText('Events Processed')).toBeInTheDocument();
    expect(screen.getByText('Households Supported')).toBeInTheDocument();
  });

  it('updates display when metrics change', () => {
    const initialMetrics: MetricsResponse = {
      total_co2_reduced_kg: 100,
      total_energy_generated_kwh: 200,
      total_projects_funded: 5,
      total_events_processed: 10
    };

    const { rerender } = render(<MetricsDisplay metrics={initialMetrics} />);
    expect(screen.getByText('100.00 kg')).toBeInTheDocument();

    const updatedMetrics: MetricsResponse = {
      total_co2_reduced_kg: 500,
      total_energy_generated_kwh: 600,
      total_projects_funded: 15,
      total_events_processed: 30
    };

    rerender(<MetricsDisplay metrics={updatedMetrics} />);
    expect(screen.getByText('500.00 kg')).toBeInTheDocument();
    expect(screen.getByText('600.00 kWh')).toBeInTheDocument();
  });
});
