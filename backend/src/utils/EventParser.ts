import { EnvironmentalEvent } from '../models/EnvironmentalEvent.js';
import { ImpactCategory, SubmitEventRequest, UrgencyLevel } from '../types/index.js';

/**
 * EventParser provides functions for parsing and formatting environmental event data.
 * Validates JSON structure, required fields, and data types according to system requirements.
 */

const VALID_EVENT_TYPES: ImpactCategory[] = ['Solar', 'River_Cleanup', 'Reforestation', 'Carbon_Capture'];
const VALID_URGENCY_LEVELS: UrgencyLevel[] = ['stable', 'elevated', 'critical'];

/**
 * Parses JSON input into a validated EnvironmentalEvent object.
 * 
 * @param input - JSON string or object containing event data
 * @returns EnvironmentalEvent object with validated fields
 * @throws Error with descriptive message for malformed JSON or missing/invalid fields
 * 
 * Validates:
 * - Required fields: event_type, location_coordinates, timestamp
 * - event_type must be one of: Solar, River_Cleanup, Reforestation, Carbon_Capture
 * - All numeric fields must be present
 */
export function parseEventFromJSON(input: string | object): EnvironmentalEvent {
  let data: any;

  // Parse JSON string if needed
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch (error) {
      throw new Error(`Malformed JSON: ${error instanceof Error ? error.message : 'Unable to parse JSON'}`);
    }
  } else {
    data = input;
  }

  // Validate required fields exist
  const missingFields: string[] = [];
  
  if (!data.event_type) missingFields.push('event_type');
  if (!data.location_coordinates) missingFields.push('location_coordinates');
  if (!data.timestamp) missingFields.push('timestamp');
  
  if (missingFields.length > 0) {
    throw new Error(`Invalid event: missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate event_type is one of the four Impact_Categories
  if (!VALID_EVENT_TYPES.includes(data.event_type)) {
    throw new Error(
      `Invalid event: event_type must be one of [${VALID_EVENT_TYPES.join(', ')}], received: ${data.event_type}`
    );
  }

  // Validate location_coordinates structure
  if (typeof data.location_coordinates !== 'object' || 
      data.location_coordinates === null ||
      typeof data.location_coordinates.latitude !== 'number' ||
      typeof data.location_coordinates.longitude !== 'number') {
    throw new Error('Invalid event: location_coordinates must be an object with numeric latitude and longitude');
  }

  // Validate numeric fields exist and are numbers
  const numericFields = ['energy_kwh', 'co2_reduction_kg', 'ecosystem_restoration_units'];
  for (const field of numericFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Invalid event: missing required field: ${field}`);
    }
    if (typeof data[field] !== 'number' || isNaN(data[field])) {
      throw new Error(`Invalid event: ${field} must be a number, received: ${data[field]}`);
    }
  }

  const optionalNumericFields = [
    'households_supported',
    'funding_gap_usd',
    'cost_per_impact_unit_usd',
    'verification_confidence'
  ] as const;

  for (const field of optionalNumericFields) {
    if (data[field] !== undefined && data[field] !== null) {
      if (typeof data[field] !== 'number' || isNaN(data[field])) {
        throw new Error(`Invalid event: ${field} must be a number, received: ${data[field]}`);
      }
      if (data[field] < 0) {
        throw new Error(`Invalid event: ${field} must be non-negative, received: ${data[field]}`);
      }
    }
  }

  if (data.verification_confidence !== undefined && data.verification_confidence > 1) {
    throw new Error(
      `Invalid event: verification_confidence must be between 0 and 1, received: ${data.verification_confidence}`
    );
  }

  if (data.urgency_level !== undefined && !VALID_URGENCY_LEVELS.includes(data.urgency_level)) {
    throw new Error(
      `Invalid event: urgency_level must be one of [${VALID_URGENCY_LEVELS.join(', ')}], received: ${data.urgency_level}`
    );
  }

  // Create SubmitEventRequest object
  const eventRequest: SubmitEventRequest = {
    event_type: data.event_type,
    location_coordinates: {
      latitude: data.location_coordinates.latitude,
      longitude: data.location_coordinates.longitude
    },
    energy_kwh: data.energy_kwh,
    co2_reduction_kg: data.co2_reduction_kg,
    ecosystem_restoration_units: data.ecosystem_restoration_units,
    timestamp: data.timestamp,
    project_name: data.project_name,
    community_name: data.community_name,
    region: data.region,
    country: data.country,
    households_supported: data.households_supported,
    funding_gap_usd: data.funding_gap_usd,
    cost_per_impact_unit_usd: data.cost_per_impact_unit_usd,
    verification_confidence: data.verification_confidence,
    urgency_level: data.urgency_level,
    verification_source: data.verification_source,
    proof_hash: data.proof_hash,
    sdg_tags: data.sdg_tags,
    sponsor_name: data.sponsor_name,
    verifier_name: data.verifier_name,
    local_operator_name: data.local_operator_name,
    buyer_signal: data.buyer_signal,
    beneficiary_metric: data.beneficiary_metric
  };

  // Create and return EnvironmentalEvent
  return new EnvironmentalEvent(eventRequest);
}

/**
 * Formats an EnvironmentalEvent object into JSON for API responses and blockchain recording.
 * 
 * @param event - EnvironmentalEvent object to format
 * @returns JSON object containing all event fields
 */
export function formatEventToJSON(event: EnvironmentalEvent): object {
  return {
    id: event.id,
    event_type: event.event_type,
    location_coordinates: {
      latitude: event.location_coordinates.latitude,
      longitude: event.location_coordinates.longitude
    },
    energy_kwh: event.energy_kwh,
    co2_reduction_kg: event.co2_reduction_kg,
    ecosystem_restoration_units: event.ecosystem_restoration_units,
    timestamp: event.timestamp.toISOString(),
    impact_score: event.impact_score,
    project_name: event.project_name,
    community_name: event.community_name,
    region: event.region,
    country: event.country,
    households_supported: event.households_supported,
    funding_gap_usd: event.funding_gap_usd,
    cost_per_impact_unit_usd: event.cost_per_impact_unit_usd,
    verification_confidence: event.verification_confidence,
    urgency_level: event.urgency_level,
    verification_source: event.verification_source,
    proof_hash: event.proof_hash,
    sdg_tags: event.sdg_tags,
    sponsor_name: event.sponsor_name,
    verifier_name: event.verifier_name,
    local_operator_name: event.local_operator_name,
    buyer_signal: event.buyer_signal,
    beneficiary_metric: event.beneficiary_metric,
    deployment_profile: event.deployment_profile
  };
}
