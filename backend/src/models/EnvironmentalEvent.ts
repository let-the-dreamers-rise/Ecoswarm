import { randomUUID } from 'crypto';
import { ImpactCategory, Coordinates, DeploymentProfile, SubmitEventRequest } from '../types/index.js';

/**
 * EnvironmentalEvent represents a climate action with measurable environmental metrics.
 * This model validates event data and ensures all metrics meet system requirements.
 */
export class EnvironmentalEvent {
  id: string;
  event_type: ImpactCategory;
  location_coordinates: Coordinates;
  energy_kwh: number;
  co2_reduction_kg: number;
  ecosystem_restoration_units: number;
  timestamp: Date;
  impact_score: number | null;
  project_name: string;
  community_name: string;
  region: string;
  country: string;
  households_supported: number;
  funding_gap_usd: number;
  cost_per_impact_unit_usd: number;
  verification_confidence: number;
  urgency_level: 'stable' | 'elevated' | 'critical';
  verification_source: string;
  proof_hash: string;
  sdg_tags: string[];
  sponsor_name: string;
  verifier_name: string;
  local_operator_name: string;
  buyer_signal: string;
  beneficiary_metric: string;
  deployment_profile: DeploymentProfile | null;

  constructor(data: SubmitEventRequest) {
    this.id = randomUUID();
    this.event_type = data.event_type;
    this.location_coordinates = data.location_coordinates;
    this.energy_kwh = data.energy_kwh;
    this.co2_reduction_kg = data.co2_reduction_kg;
    this.ecosystem_restoration_units = data.ecosystem_restoration_units;
    this.timestamp = new Date(data.timestamp);
    this.impact_score = null;
    this.project_name = data.project_name || this.getDefaultProjectName(data.event_type);
    this.community_name = data.community_name || 'Community steward network';
    this.region = data.region || 'Undisclosed region';
    this.country = data.country || 'Undisclosed country';
    this.households_supported = data.households_supported ?? 0;
    this.funding_gap_usd = data.funding_gap_usd ?? 0;
    this.cost_per_impact_unit_usd = data.cost_per_impact_unit_usd ?? 1;
    this.verification_confidence = data.verification_confidence ?? 1;
    this.urgency_level = data.urgency_level ?? 'stable';
    this.verification_source = data.verification_source || 'Community proof packet';
    this.proof_hash = data.proof_hash || `proof-${this.id}`;
    this.sdg_tags = data.sdg_tags ?? [];
    this.sponsor_name = data.sponsor_name || 'Climate resilience sponsor';
    this.verifier_name = data.verifier_name || 'Independent verifier';
    this.local_operator_name = data.local_operator_name || 'Community operating partner';
    this.buyer_signal = data.buyer_signal || 'Mission-aligned sponsor demand';
    this.beneficiary_metric = data.beneficiary_metric || 'Verified climate impact delivered';
    this.deployment_profile = null;
  }

  /**
   * Validates that the environmental event meets all system requirements:
   * - All metrics (energy_kwh, co2_reduction_kg, ecosystem_restoration_units) must be non-negative
   * - Latitude must be within bounds [-90, 90]
   * - Longitude must be within bounds [-180, 180]
   * 
   * @returns true if the event is valid, false otherwise
   */
  validate(): boolean {
    return (
      this.energy_kwh >= 0 &&
      this.co2_reduction_kg >= 0 &&
      this.ecosystem_restoration_units >= 0 &&
      this.households_supported >= 0 &&
      this.funding_gap_usd >= 0 &&
      this.cost_per_impact_unit_usd >= 0 &&
      this.verification_confidence >= 0 &&
      this.verification_confidence <= 1 &&
      this.location_coordinates.latitude >= -90 &&
      this.location_coordinates.latitude <= 90 &&
      this.location_coordinates.longitude >= -180 &&
      this.location_coordinates.longitude <= 180
    );
  }

  private getDefaultProjectName(eventType: ImpactCategory): string {
    const defaults: Record<ImpactCategory, string> = {
      Solar: 'Solar resilience intervention',
      River_Cleanup: 'River cleanup intervention',
      Reforestation: 'Reforestation intervention',
      Carbon_Capture: 'Carbon drawdown intervention'
    };

    return defaults[eventType];
  }
}
