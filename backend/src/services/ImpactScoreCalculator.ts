import { EnvironmentalEvent } from '../models/EnvironmentalEvent.js';

/**
 * ImpactScoreCalculator calculates environmental impact scores for events.
 * 
 * The impact score is calculated using a weighted formula:
 * (co2_reduction_kg × 0.4) + (energy_kwh × 0.3) + (ecosystem_restoration_units × 0.3)
 * 
 * This component validates inputs and rejects invalid data.
 */
export class ImpactScoreCalculator {
  /**
   * Calculate the impact score for an environmental event.
   * 
   * @param event - The environmental event to score
   * @returns The calculated impact score
   * @throws Error if any metric is negative or non-numeric
   */
  calculateImpactScore(event: EnvironmentalEvent): number {
    // Validate all metrics are non-negative numbers
    if (!this.validateMetrics(event)) {
      throw new Error(this.getValidationErrorMessage(event));
    }

    // Apply the impact score formula
    const score = 
      (event.co2_reduction_kg * 0.4) +
      (event.energy_kwh * 0.3) +
      (event.ecosystem_restoration_units * 0.3);

    return score;
  }

  /**
   * Validate that all metrics are non-negative numbers.
   * 
   * @param event - The environmental event to validate
   * @returns true if all metrics are valid, false otherwise
   */
  private validateMetrics(event: EnvironmentalEvent): boolean {
    return (
      this.isNonNegativeNumber(event.energy_kwh) &&
      this.isNonNegativeNumber(event.co2_reduction_kg) &&
      this.isNonNegativeNumber(event.ecosystem_restoration_units)
    );
  }

  /**
   * Check if a value is a non-negative number.
   * 
   * @param value - The value to check
   * @returns true if the value is a non-negative number, false otherwise
   */
  private isNonNegativeNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value) && value >= 0;
  }

  /**
   * Generate a descriptive error message for validation failures.
   * 
   * @param event - The environmental event that failed validation
   * @returns A descriptive error message
   */
  private getValidationErrorMessage(event: EnvironmentalEvent): string {
    const errors: string[] = [];

    if (!this.isNonNegativeNumber(event.energy_kwh)) {
      errors.push(`energy_kwh must be a non-negative number, received: ${event.energy_kwh}`);
    }
    if (!this.isNonNegativeNumber(event.co2_reduction_kg)) {
      errors.push(`co2_reduction_kg must be a non-negative number, received: ${event.co2_reduction_kg}`);
    }
    if (!this.isNonNegativeNumber(event.ecosystem_restoration_units)) {
      errors.push(`ecosystem_restoration_units must be a non-negative number, received: ${event.ecosystem_restoration_units}`);
    }

    return `Invalid event metrics: ${errors.join(', ')}`;
  }
}
