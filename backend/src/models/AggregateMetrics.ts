import { EnvironmentalEvent } from './EnvironmentalEvent.js';

/**
 * AggregateMetrics tracks cumulative environmental impact across all processed events.
 * Maintains running totals for CO2 reduction, energy generation, projects funded, and events processed.
 */
export class AggregateMetrics {
  total_co2_reduced_kg: number = 0;
  total_energy_generated_kwh: number = 0;
  total_projects_funded: number = 0;
  total_events_processed: number = 0;
  total_households_supported: number = 0;
  total_capital_routed_usd: number = 0;
  capital_ready_to_release_usd: number = 0;
  average_verification_confidence: number = 0;
  proofs_recorded: number = 0;
  release_ready_projects: number = 0;
  release_authorized_capital_usd: number = 0;
  released_capital_usd: number = 0;
  total_case_actions: number = 0;
  activePrograms: number = 0;
  activeRegions: string[] = [];
  activeSponsors: string[] = [];
  activeVerifiers: string[] = [];
  private verificationConfidenceTotal: number = 0;

  /**
   * Updates aggregate metrics from a processed environmental event.
   * Adds event metrics to running totals and increments counters.
   * 
   * @param event - The environmental event to aggregate
   */
  updateFromEvent(event: EnvironmentalEvent): void {
    this.total_co2_reduced_kg += event.co2_reduction_kg;
    this.total_energy_generated_kwh += event.energy_kwh;
    this.total_projects_funded += 1;
    this.total_events_processed += 1;
    this.total_households_supported += event.households_supported;
    this.total_capital_routed_usd += this.estimateCapitalRouted(event);
    this.verificationConfidenceTotal += event.verification_confidence;
    this.average_verification_confidence = this.verificationConfidenceTotal / this.total_events_processed;

    if (event.proof_hash) {
      this.proofs_recorded += 1;
    }

    const deploymentProfile = event.deployment_profile;
    if (deploymentProfile) {
      if (deploymentProfile.release_readiness !== 'hold') {
        this.capital_ready_to_release_usd += Math.max(
          deploymentProfile.authorized_release_usd - deploymentProfile.released_capital_usd,
          deploymentProfile.authorized_release_usd > 0
            ? 0
            : deploymentProfile.upfront_release_usd
        );
      }

      if (deploymentProfile.release_readiness === 'release') {
        this.release_ready_projects += 1;
      }

      this.release_authorized_capital_usd += deploymentProfile.authorized_release_usd;
      this.released_capital_usd += deploymentProfile.released_capital_usd;
      this.total_case_actions += deploymentProfile.case_actions.length;
      this.activePrograms += 1;

      if (
        deploymentProfile.sponsor_name &&
        !this.activeSponsors.includes(deploymentProfile.sponsor_name)
      ) {
        this.activeSponsors = [...this.activeSponsors, deploymentProfile.sponsor_name];
      }

      if (
        deploymentProfile.verifier_name &&
        !this.activeVerifiers.includes(deploymentProfile.verifier_name)
      ) {
        this.activeVerifiers = [...this.activeVerifiers, deploymentProfile.verifier_name];
      }
    }

    const regionLabel = [event.region, event.country].filter(Boolean).join(', ');
    if (regionLabel && !this.activeRegions.includes(regionLabel)) {
      this.activeRegions = [...this.activeRegions, regionLabel];
    }
  }

  rebuildFromEvents(events: EnvironmentalEvent[]): void {
    this.reset();

    for (const event of events) {
      this.updateFromEvent(event);
    }
  }

  /**
   * Serializes metrics to JSON format for API responses.
   * 
   * @returns Object containing all four aggregate metrics
   */
  toJSON() {
    return {
      total_co2_reduced_kg: this.total_co2_reduced_kg,
      total_energy_generated_kwh: this.total_energy_generated_kwh,
      total_projects_funded: this.total_projects_funded,
      total_events_processed: this.total_events_processed,
      total_households_supported: this.total_households_supported,
      total_capital_routed_usd: this.total_capital_routed_usd,
      capital_ready_to_release_usd: this.capital_ready_to_release_usd,
      average_verification_confidence: this.average_verification_confidence,
      proofs_recorded: this.proofs_recorded,
      release_ready_projects: this.release_ready_projects,
      release_authorized_capital_usd: this.release_authorized_capital_usd,
      released_capital_usd: this.released_capital_usd,
      total_case_actions: this.total_case_actions,
      active_programs: this.activePrograms,
      active_regions: this.activeRegions,
      active_sponsors: this.activeSponsors,
      active_verifiers: this.activeVerifiers
    };
  }

  private reset(): void {
    this.total_co2_reduced_kg = 0;
    this.total_energy_generated_kwh = 0;
    this.total_projects_funded = 0;
    this.total_events_processed = 0;
    this.total_households_supported = 0;
    this.total_capital_routed_usd = 0;
    this.capital_ready_to_release_usd = 0;
    this.average_verification_confidence = 0;
    this.proofs_recorded = 0;
    this.release_ready_projects = 0;
    this.release_authorized_capital_usd = 0;
    this.released_capital_usd = 0;
    this.total_case_actions = 0;
    this.activePrograms = 0;
    this.activeRegions = [];
    this.activeSponsors = [];
    this.activeVerifiers = [];
    this.verificationConfidenceTotal = 0;
  }

  private estimateCapitalRouted(event: EnvironmentalEvent): number {
    const baseCapital =
      (event.co2_reduction_kg * 6) +
      (event.energy_kwh * 2) +
      (event.ecosystem_restoration_units * 10);

    const adjustedCapital = Math.round(baseCapital * Math.max(event.verification_confidence, 0.5));

    if (!event.funding_gap_usd) {
      return adjustedCapital;
    }

    return Math.min(adjustedCapital, event.funding_gap_usd);
  }
}
