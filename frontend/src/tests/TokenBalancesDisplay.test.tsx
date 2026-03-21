import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TokenBalancesDisplay from '../components/TokenBalancesDisplay';
import type { TokenBalancesResponse } from '../types';

describe('TokenBalancesDisplay', () => {
  it('renders nothing when tokens is null', () => {
    const { container } = render(<TokenBalancesDisplay tokens={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays all four token types with correct balances', () => {
    const mockTokens: TokenBalancesResponse = {
      SolarImpactToken: 100,
      CleanupImpactToken: 200,
      ReforestationToken: 300,
      CarbonCaptureToken: 400
    };

    render(<TokenBalancesDisplay tokens={mockTokens} />);

    expect(screen.getByText('Impact Tokens Minted')).toBeInTheDocument();
    
    // Check Solar tokens
    expect(screen.getByText('Solar')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();

    // Check Cleanup tokens
    expect(screen.getByText('Cleanup')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();

    // Check Reforestation tokens
    expect(screen.getByText('Reforestation')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();

    // Check Carbon tokens
    expect(screen.getByText('Carbon')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
  });

  it('displays zero balances correctly', () => {
    const mockTokens: TokenBalancesResponse = {
      SolarImpactToken: 0,
      CleanupImpactToken: 0,
      ReforestationToken: 0,
      CarbonCaptureToken: 0
    };

    render(<TokenBalancesDisplay tokens={mockTokens} />);

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(4);
  });

  it('updates display when token balances change', () => {
    const initialTokens: TokenBalancesResponse = {
      SolarImpactToken: 10,
      CleanupImpactToken: 20,
      ReforestationToken: 30,
      CarbonCaptureToken: 40
    };

    const { rerender } = render(<TokenBalancesDisplay tokens={initialTokens} />);
    expect(screen.getByText('10')).toBeInTheDocument();

    const updatedTokens: TokenBalancesResponse = {
      SolarImpactToken: 50,
      CleanupImpactToken: 60,
      ReforestationToken: 70,
      CarbonCaptureToken: 80
    };

    rerender(<TokenBalancesDisplay tokens={updatedTokens} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('displays large token balances correctly', () => {
    const mockTokens: TokenBalancesResponse = {
      SolarImpactToken: 999999,
      CleanupImpactToken: 888888,
      ReforestationToken: 777777,
      CarbonCaptureToken: 666666
    };

    render(<TokenBalancesDisplay tokens={mockTokens} />);

    expect(screen.getByText('999999')).toBeInTheDocument();
    expect(screen.getByText('888888')).toBeInTheDocument();
    expect(screen.getByText('777777')).toBeInTheDocument();
    expect(screen.getByText('666666')).toBeInTheDocument();
  });
});
