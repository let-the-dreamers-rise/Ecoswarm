import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventStream from '../components/EventStream';
import type { HederaEventRecord } from '../types';

describe('EventStream Component', () => {
  it('displays recent events', () => {
    const mockEvents: HederaEventRecord[] = [
      {
        event_type: 'impact_event_detected',
        timestamp: '2024-01-15T10:30:00Z',
        payload: { test: 'data' },
        transaction_id: '0.0.12345@1234567890.123'
      },
      {
        event_type: 'impact_score_calculated',
        timestamp: '2024-01-15T10:31:00Z',
        payload: { score: 100 },
        transaction_id: '0.0.12345@1234567891.456'
      }
    ];

    render(<EventStream events={mockEvents} />);

    // Check that events are displayed
    expect(screen.getByText('impact_event_detected')).toBeInTheDocument();
    expect(screen.getByText('impact_score_calculated')).toBeInTheDocument();
  });

  it('displays only most recent 20 events', () => {
    // Create 25 events
    const mockEvents: HederaEventRecord[] = Array.from({ length: 25 }, (_, i) => ({
      event_type: 'impact_event_detected',
      timestamp: `2024-01-15T10:${i.toString().padStart(2, '0')}:00Z`,
      payload: { index: i },
      transaction_id: `0.0.12345@123456789${i}.123`
    }));

    render(<EventStream events={mockEvents} />);

    // Should display exactly 20 event items
    const eventItems = screen.getAllByTestId('event-item');
    expect(eventItems).toHaveLength(20);
  });

  it('displays transaction_id as clickable link to Hedera testnet explorer', () => {
    const mockEvents: HederaEventRecord[] = [
      {
        event_type: 'portfolio_rebalanced',
        timestamp: '2024-01-15T10:30:00Z',
        payload: {},
        transaction_id: '0.0.12345@1234567890.123'
      }
    ];

    render(<EventStream events={mockEvents} />);

    const link = screen.getByTestId('transaction-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://hashscan.io/testnet/transaction/0.0.12345@1234567890.123'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('displays events with newest at top', () => {
    const mockEvents: HederaEventRecord[] = [
      {
        event_type: 'impact_event_detected',
        timestamp: '2024-01-15T10:30:00Z',
        payload: {},
        transaction_id: '0.0.12345@1234567890.123'
      },
      {
        event_type: 'portfolio_rebalanced',
        timestamp: '2024-01-15T10:29:00Z',
        payload: {},
        transaction_id: '0.0.12345@1234567889.123'
      }
    ];

    render(<EventStream events={mockEvents} />);

    const eventItems = screen.getAllByTestId('event-item');
    // First item should be the first event in the array (newest)
    expect(eventItems[0]).toHaveTextContent('impact_event_detected');
    expect(eventItems[1]).toHaveTextContent('portfolio_rebalanced');
  });

  it('auto-scrolls to show newest events at top', () => {
    const mockEvents: HederaEventRecord[] = [
      {
        event_type: 'impact_event_detected',
        timestamp: '2024-01-15T10:30:00Z',
        payload: {},
        transaction_id: '0.0.12345@1234567890.123'
      }
    ];

    const { rerender } = render(<EventStream events={mockEvents} />);

    const streamContainer = screen.getByTestId('event-stream');
    
    // Simulate scroll position change
    Object.defineProperty(streamContainer, 'scrollTop', {
      writable: true,
      value: 100
    });

    // Add new event
    const updatedEvents: HederaEventRecord[] = [
      {
        event_type: 'portfolio_rebalanced',
        timestamp: '2024-01-15T10:31:00Z',
        payload: {},
        transaction_id: '0.0.12345@1234567891.123'
      },
      ...mockEvents
    ];

    rerender(<EventStream events={updatedEvents} />);

    // After rerender, scrollTop should be reset to 0
    expect(streamContainer.scrollTop).toBe(0);
  });

  it('displays message when no events are present', () => {
    render(<EventStream events={[]} />);

    expect(screen.getByText('No events recorded yet')).toBeInTheDocument();
  });

  it('displays timestamp in localized time format', () => {
    const mockEvents: HederaEventRecord[] = [
      {
        event_type: 'impact_verified',
        timestamp: '2024-01-15T10:30:45Z',
        payload: {},
        transaction_id: '0.0.12345@1234567890.123'
      }
    ];

    render(<EventStream events={mockEvents} />);

    // Check that timestamp is displayed (format will vary by locale)
    const eventItem = screen.getByTestId('event-item');
    expect(eventItem).toBeInTheDocument();
    
    // The timestamp should be formatted as localized time
    const timestamp = new Date('2024-01-15T10:30:45Z').toLocaleTimeString();
    expect(eventItem).toHaveTextContent(timestamp);
  });

  it('handles events without transaction_id', () => {
    const mockEvents: HederaEventRecord[] = [
      {
        event_type: 'impact_event_detected',
        timestamp: '2024-01-15T10:30:00Z',
        payload: {},
        // No transaction_id
      }
    ];

    render(<EventStream events={mockEvents} />);

    // Event should still be displayed
    expect(screen.getByText('impact_event_detected')).toBeInTheDocument();
    
    // Transaction link should not be present
    expect(screen.queryByTestId('transaction-link')).not.toBeInTheDocument();
  });
});
