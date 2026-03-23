import { ImpactCategory } from '../types/index.js';
import { EnvironmentalEvent } from './EnvironmentalEvent.js';

/**
 * Portfolio manages climate investment allocation across four Impact_Categories.
 * Tracks allocation percentages, maintains event history for optimization,
 * and ensures allocations always sum to 100%.
 */
export class Portfolio {
  allocations: Map<ImpactCategory, number>;
  last_rebalanced: Date;
  event_history: EnvironmentalEvent[];
  case_registry: EnvironmentalEvent[];

  constructor() {
    // Initialize with equal allocation (25% each)
    this.allocations = new Map([
      ['Solar', 25],
      ['River_Cleanup', 25],
      ['Reforestation', 25],
      ['Carbon_Capture', 25]
    ]);
    this.last_rebalanced = new Date();
    this.event_history = [];
    this.case_registry = [];
  }

  /**
   * Adds an event to the history, maintaining only the last 10 events.
   * When exceeding 10 events, the oldest event is removed.
   * 
   * @param event - The environmental event to add
   */
  addEvent(event: EnvironmentalEvent): void {
    this.case_registry.push(event);
    this.event_history.push(event);
    // Keep only last 10 events for optimization
    if (this.event_history.length > 10) {
      this.event_history.shift();
    }
  }

  restoreEvents(caseRegistry: EnvironmentalEvent[], eventHistory?: EnvironmentalEvent[]): void {
    this.case_registry = [...caseRegistry];
    this.event_history = [...(eventHistory ?? caseRegistry.slice(-10))];
  }

  /**
   * Updates portfolio allocations with validation.
   * Ensures allocations sum to 100% (within 0.01% tolerance).
   * 
   * @param newAllocations - New allocation percentages by category
   * @throws Error if allocations don't sum to 100% (within tolerance)
   */
  updateAllocations(newAllocations: Record<ImpactCategory, number>): void {
    const total = Object.values(newAllocations).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error('Allocations must sum to 100%');
    }

    for (const [category, percentage] of Object.entries(newAllocations)) {
      this.allocations.set(category as ImpactCategory, percentage);
    }
    this.last_rebalanced = new Date();
  }

  /**
   * Groups recent events by their impact category.
   * 
   * @returns Map of impact categories to their respective events
   */
  getRecentEventsByCategory(): Map<ImpactCategory, EnvironmentalEvent[]> {
    const byCategory = new Map<ImpactCategory, EnvironmentalEvent[]>();
    for (const event of this.event_history) {
      if (!byCategory.has(event.event_type)) {
        byCategory.set(event.event_type, []);
      }
      byCategory.get(event.event_type)!.push(event);
    }
    return byCategory;
  }
}
