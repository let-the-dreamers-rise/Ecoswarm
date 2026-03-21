import { Coordinates, ImpactCategory, SubmitEventRequest, UrgencyLevel } from '../types/index.js';

interface ScenarioTemplate {
  event_type: ImpactCategory;
  project_name: string;
  community_name: string;
  region: string;
  country: string;
  sponsor_name: string;
  verifier_name: string;
  local_operator_name: string;
  buyer_signal: string;
  beneficiary_metric: string;
  anchor: Coordinates;
  energy_range: [number, number];
  co2_range: [number, number];
  restoration_range: [number, number];
  households_range: [number, number];
  funding_gap_range: [number, number];
  cost_range: [number, number];
  verification_confidence_range: [number, number];
  urgency_level: UrgencyLevel;
  verification_source: string;
  sdg_tags: string[];
}

const SCENARIOS: ScenarioTemplate[] = [
  {
    event_type: 'Solar',
    project_name: 'Sundarbans Solar Cold-Chain Pods',
    community_name: 'Gosaba fisher cooperative',
    region: 'West Bengal',
    country: 'India',
    sponsor_name: 'Delta livelihoods resilience sponsor',
    verifier_name: 'Bengal energy telemetry lab',
    local_operator_name: 'Gosaba cold-chain operator circle',
    buyer_signal: 'Seafood buyers and CSR programs need reliable cold-chain uptime proof.',
    beneficiary_metric: 'Cost per fisher household protected from cold-chain spoilage',
    anchor: { latitude: 22.165, longitude: 88.808 },
    energy_range: [320, 620],
    co2_range: [150, 280],
    restoration_range: [16, 34],
    households_range: [110, 240],
    funding_gap_range: [14000, 28000],
    cost_range: [10, 18],
    verification_confidence_range: [0.84, 0.96],
    urgency_level: 'critical',
    verification_source: 'IoT meter stream + cooperative audit',
    sdg_tags: ['SDG 7', 'SDG 13', 'SDG 14']
  },
  {
    event_type: 'Solar',
    project_name: 'Turkana Solar Water Pump Network',
    community_name: 'Pastoral water user groups',
    region: 'Turkana County',
    country: 'Kenya',
    sponsor_name: 'Dryland water resilience sponsor',
    verifier_name: 'East Africa pump telemetry alliance',
    local_operator_name: 'Turkana water user federation',
    buyer_signal: 'Water access programs want auditable uptime and community service metrics.',
    beneficiary_metric: 'Cost per household gaining reliable solar water access',
    anchor: { latitude: 3.12, longitude: 35.61 },
    energy_range: [260, 520],
    co2_range: [120, 230],
    restoration_range: [14, 26],
    households_range: [80, 170],
    funding_gap_range: [12000, 24000],
    cost_range: [11, 17],
    verification_confidence_range: [0.8, 0.92],
    urgency_level: 'elevated',
    verification_source: 'Pump telemetry + NGO field validation',
    sdg_tags: ['SDG 6', 'SDG 7', 'SDG 13']
  },
  {
    event_type: 'River_Cleanup',
    project_name: 'Yamuna Waste Interceptor Chain',
    community_name: 'Delhi river ward stewards',
    region: 'Delhi NCR',
    country: 'India',
    sponsor_name: 'Urban river resilience fund',
    verifier_name: 'Delhi water quality review board',
    local_operator_name: 'Yamuna cleanup guild',
    buyer_signal: 'Municipal resilience programs need proof-linked payouts for cleanup corridors.',
    beneficiary_metric: 'Cost per kilogram removed with verified diversion',
    anchor: { latitude: 28.61, longitude: 77.23 },
    energy_range: [18, 68],
    co2_range: [90, 180],
    restoration_range: [40, 95],
    households_range: [190, 420],
    funding_gap_range: [9000, 18000],
    cost_range: [7, 13],
    verification_confidence_range: [0.78, 0.91],
    urgency_level: 'critical',
    verification_source: 'Water quality sensors + volunteer attestations',
    sdg_tags: ['SDG 6', 'SDG 11', 'SDG 14']
  },
  {
    event_type: 'River_Cleanup',
    project_name: 'Manila Bay Plastic Recovery Grid',
    community_name: 'Coastal waste picker guild',
    region: 'Metro Manila',
    country: 'Philippines',
    sponsor_name: 'Circular coast procurement sponsor',
    verifier_name: 'Bay materials audit network',
    local_operator_name: 'Manila coastal recovery guild',
    buyer_signal: 'Packaging and municipal buyers need trusted removal and diversion evidence.',
    beneficiary_metric: 'Cost per ton diverted from coastal leakage',
    anchor: { latitude: 14.59, longitude: 120.98 },
    energy_range: [12, 55],
    co2_range: [85, 160],
    restoration_range: [35, 88],
    households_range: [160, 340],
    funding_gap_range: [8500, 16500],
    cost_range: [6, 12],
    verification_confidence_range: [0.8, 0.94],
    urgency_level: 'elevated',
    verification_source: 'Collection ledger + materials audit',
    sdg_tags: ['SDG 11', 'SDG 12', 'SDG 14']
  },
  {
    event_type: 'Reforestation',
    project_name: 'Odisha Mangrove Shield',
    community_name: 'Cyclone belt restoration councils',
    region: 'Odisha',
    country: 'India',
    sponsor_name: 'Coastal adaptation finance sponsor',
    verifier_name: 'Mangrove canopy monitoring alliance',
    local_operator_name: 'Odisha restoration councils',
    buyer_signal: 'Adaptation funds want survival-linked payouts instead of one-off planting claims.',
    beneficiary_metric: 'Cost per hectare restored with canopy survival proof',
    anchor: { latitude: 20.31, longitude: 86.61 },
    energy_range: [20, 75],
    co2_range: [140, 280],
    restoration_range: [90, 180],
    households_range: [220, 460],
    funding_gap_range: [15000, 32000],
    cost_range: [8, 14],
    verification_confidence_range: [0.86, 0.97],
    urgency_level: 'critical',
    verification_source: 'Satellite canopy check + ranger attestations',
    sdg_tags: ['SDG 13', 'SDG 14', 'SDG 15']
  },
  {
    event_type: 'Reforestation',
    project_name: 'Isiolo Agroforestry Recovery Ring',
    community_name: 'Dryland women farming groups',
    region: 'Isiolo County',
    country: 'Kenya',
    sponsor_name: 'Dryland livelihoods adaptation sponsor',
    verifier_name: 'Isiolo canopy and rainfall observatory',
    local_operator_name: 'Women-led agroforestry federation',
    buyer_signal: 'Regenerative agriculture funds need ongoing proof of survival and farmer benefit.',
    beneficiary_metric: 'Cost per acre restored with farmer stewardship proof',
    anchor: { latitude: 0.36, longitude: 37.58 },
    energy_range: [10, 38],
    co2_range: [130, 230],
    restoration_range: [75, 150],
    households_range: [140, 310],
    funding_gap_range: [11000, 24000],
    cost_range: [7, 12],
    verification_confidence_range: [0.82, 0.94],
    urgency_level: 'elevated',
    verification_source: 'Seedling audit + rainfall resilience dashboard',
    sdg_tags: ['SDG 2', 'SDG 13', 'SDG 15']
  },
  {
    event_type: 'Carbon_Capture',
    project_name: 'Punjab Biochar Soil Carbon Cooperative',
    community_name: 'Rice-husk farmer federation',
    region: 'Punjab',
    country: 'India',
    sponsor_name: 'Climate-smart agriculture procurement fund',
    verifier_name: 'Punjab soil carbon lab',
    local_operator_name: 'Biochar farmer cooperative',
    buyer_signal: 'Soil-carbon buyers need measured capture and application evidence.',
    beneficiary_metric: 'Cost per measured ton of carbon retained in soils',
    anchor: { latitude: 30.9, longitude: 75.85 },
    energy_range: [35, 120],
    co2_range: [180, 360],
    restoration_range: [22, 58],
    households_range: [90, 180],
    funding_gap_range: [13000, 25000],
    cost_range: [9, 16],
    verification_confidence_range: [0.81, 0.93],
    urgency_level: 'elevated',
    verification_source: 'Biochar batch proofs + soil lab reports',
    sdg_tags: ['SDG 2', 'SDG 12', 'SDG 13']
  },
  {
    event_type: 'Carbon_Capture',
    project_name: 'Accra Market Waste Biochar Loop',
    community_name: 'Market waste circularity alliance',
    region: 'Greater Accra',
    country: 'Ghana',
    sponsor_name: 'Circular waste-to-carbon sponsor',
    verifier_name: 'Accra carbon and waste audit lab',
    local_operator_name: 'Market circularity operators alliance',
    buyer_signal: 'Climate buyers need repeatable capture data from distributed waste loops.',
    beneficiary_metric: 'Cost per ton of waste converted into verified carbon benefit',
    anchor: { latitude: 5.56, longitude: -0.2 },
    energy_range: [28, 95],
    co2_range: [170, 320],
    restoration_range: [20, 52],
    households_range: [110, 220],
    funding_gap_range: [12000, 22000],
    cost_range: [8, 14],
    verification_confidence_range: [0.79, 0.92],
    urgency_level: 'stable',
    verification_source: 'Waste intake ledger + kiln telemetry',
    sdg_tags: ['SDG 11', 'SDG 12', 'SDG 13']
  }
];

/**
 * SimulationEngine generates curated sustainability interventions for demo mode.
 * The scenarios are grounded in local projects so the dashboard tells a sharper
 * story than generic random climate events.
 */
export class SimulationEngine {
  private intervalId: NodeJS.Timeout | null = null;
  private backendUrl: string;
  private isRunning: boolean = false;

  constructor(backendUrl: string = 'http://localhost:3000') {
    this.backendUrl = backendUrl;
  }

  /**
   * Generate a realistic environmental event with category-specific proof metadata.
   */
  generateEnvironmentalEvent(): SubmitEventRequest {
    const template = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];

    return {
      event_type: template.event_type,
      location_coordinates: this.jitterCoordinates(template.anchor),
      energy_kwh: this.randomBetween(...template.energy_range),
      co2_reduction_kg: this.randomBetween(...template.co2_range),
      ecosystem_restoration_units: this.randomBetween(...template.restoration_range),
      timestamp: new Date().toISOString(),
      project_name: template.project_name,
      community_name: template.community_name,
      region: template.region,
      country: template.country,
      households_supported: Math.round(this.randomBetween(...template.households_range)),
      funding_gap_usd: Math.round(this.randomBetween(...template.funding_gap_range)),
      cost_per_impact_unit_usd: Number(this.randomBetween(...template.cost_range).toFixed(2)),
      verification_confidence: Number(
        this.randomBetween(...template.verification_confidence_range).toFixed(2)
      ),
      urgency_level: template.urgency_level,
      verification_source: template.verification_source,
      proof_hash: this.generateProofHash(template),
      sdg_tags: template.sdg_tags,
      sponsor_name: template.sponsor_name,
      verifier_name: template.verifier_name,
      local_operator_name: template.local_operator_name,
      buyer_signal: template.buyer_signal,
      beneficiary_metric: template.beneficiary_metric
    };
  }

  /**
   * Start generating events at 2-5 second intervals and submit them to the backend.
   */
  async startSimulation(): Promise<void> {
    if (this.isRunning) {
      console.log('Simulation already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting simulation engine...');

    const generateAndSubmit = async () => {
      if (!this.isRunning) {
        return;
      }

      try {
        const event = this.generateEnvironmentalEvent();
        const response = await fetch(`${this.backendUrl}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to submit event:', errorData);
        } else {
          const result = await response.json() as { event_id: string };
          console.log('Event submitted successfully:', result.event_id);
        }
      } catch (error) {
        console.error('Error submitting event:', error);
      }

      if (this.isRunning) {
        const nextInterval = 2000 + Math.random() * 3000;
        this.intervalId = setTimeout(generateAndSubmit, nextInterval);
      }
    };

    generateAndSubmit();
  }

  /**
   * Stop generating events within 1 second.
   */
  stopSimulation(): void {
    if (!this.isRunning) {
      console.log('Simulation not running');
      return;
    }

    console.log('Stopping simulation engine...');
    this.isRunning = false;

    if (this.intervalId !== null) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    console.log('Simulation stopped');
  }

  /**
   * Check if simulation is currently running.
   */
  getStatus(): boolean {
    return this.isRunning;
  }

  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private jitterCoordinates(anchor: Coordinates): Coordinates {
    return {
      latitude: Number((anchor.latitude + this.randomBetween(-0.35, 0.35)).toFixed(4)),
      longitude: Number((anchor.longitude + this.randomBetween(-0.35, 0.35)).toFixed(4))
    };
  }

  private generateProofHash(template: ScenarioTemplate): string {
    const shortCategory = template.event_type.replace('_', '').toLowerCase();
    const stamp = Date.now().toString(36);
    const nonce = Math.random().toString(36).slice(2, 8);

    return `regen-${shortCategory}-${stamp}-${nonce}`;
  }
}
