// ==============================================================================
// BioSync Digital Twin Visualizer
// Seamlessly delegates to the 3D Anatomical Muscular Avatar (DigitalHumanVisual)
// ==============================================================================

import React from 'react';
import { DigitalHumanVisual, BodyZone } from './DigitalHumanVisual';
import { MetricBaseline, HealthMetricRecord } from '../types';

interface Props {
  currentMetric: HealthMetricRecord | null;
  baseline: MetricBaseline;
  size?: 'compact' | 'full';
  onZoneSelect?: (zone: BodyZone) => void;
}

export const DigitalTwinVisualizer: React.FC<Props> = (props) => {
  return <DigitalHumanVisual {...props} />;
};

export { DigitalHumanVisual };
export default DigitalTwinVisualizer;
