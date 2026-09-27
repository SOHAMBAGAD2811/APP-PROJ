/**
 * server/simulate.ts
 * Macroeconomic Aviation Simulation Engine (ATF fuel elasticity, capacity pressure, CPI headline impact).
 */

import { SimulateRequest } from './models';

export function runSimulation(req: SimulateRequest) {
  const fuelDelta = req.fuel_delta_pct || 0.0;
  const demandDelta = req.demand_delta_pct || 0.0;
  const capacityDelta = req.capacity_delta_pct || 0.0;

  const fuelImpact = fuelDelta * 0.38;
  const capacityPressure = (demandDelta - capacityDelta) * 0.45;
  const totalFareChangePct = fuelImpact + capacityPressure;
  const cpiAirWeight = 0.00138; // 0.138% share in Indian CPI basket
  const cpiImpactBps = totalFareChangePct * cpiAirWeight * 100;
  const simulatedApix = 100 * (1 + totalFareChangePct / 100);

  return {
    fuel_delta_pct: fuelDelta,
    demand_delta_pct: demandDelta,
    capacity_delta_pct: capacityDelta,
    fuel_impact_pct: Number(fuelImpact.toFixed(2)),
    capacity_impact_pct: Number(capacityPressure.toFixed(2)),
    total_fare_change_pct: Number(totalFareChangePct.toFixed(2)),
    simulated_apix: Number(simulatedApix.toFixed(2)),
    cpi_impact_bps: Number(cpiImpactBps.toFixed(2)),
    cpi_air_weight_pct: 0.138,
    methodology: {
      formula: 'total_fare_change_pct = (fuel * 0.38) + ((demand - capacity) * 0.45)',
    },
  };
}
