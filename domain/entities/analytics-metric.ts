/**
 * Analytics Metric Domain Entity
 * Represents a single analytics metric with validation rules
 */

export enum MetricType {
  TOURNAMENT_PARTICIPATION = 'TOURNAMENT_PARTICIPATION',
  PLAYER_PERFORMANCE = 'PLAYER_PERFORMANCE',
  REVENUE = 'REVENUE',
  REGISTRATION_CONVERSION = 'REGISTRATION_CONVERSION',
  SCORECARD_COMPLETION = 'SCORECARD_COMPLETION',
  AVERAGE_SCORE = 'AVERAGE_SCORE',
  HANDICAP_DISTRIBUTION = 'HANDICAP_DISTRIBUTION',
}

export interface AnalyticsMetricProps {
  metricType: MetricType;
  date: Date;
  value: number;
  count?: number;
  tournamentId?: string;
  playerId?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsMetricData extends AnalyticsMetricProps {
  id?: string;
  createdAt?: Date;
}

export class AnalyticsMetric {
  readonly metricType: MetricType;
  readonly date: Date;
  readonly value: number;
  readonly count?: number;
  readonly tournamentId?: string;
  readonly playerId?: string;
  readonly metadata?: Record<string, any>;

  constructor(props: AnalyticsMetricProps) {
    this.validate(props);

    this.metricType = props.metricType;
    this.date = props.date;
    this.value = props.value;
    this.count = props.count;
    this.tournamentId = props.tournamentId;
    this.playerId = props.playerId;
    this.metadata = props.metadata;
  }

  private validate(props: AnalyticsMetricProps): void {
    // Validate value
    if (props.value < 0) {
      throw new Error('Metric value cannot be negative');
    }

    // Validate count
    if (props.count !== undefined && props.count < 0) {
      throw new Error('Count cannot be negative');
    }

    // Validate date
    if (props.date > new Date()) {
      throw new Error('Metric date cannot be in the future');
    }
  }

  /**
   * Check if the metric is valid
   */
  isValid(): boolean {
    return Object.values(MetricType).includes(this.metricType as MetricType);
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      metricType: this.metricType,
      date: this.date.toISOString(),
      value: this.value,
      count: this.count,
      tournamentId: this.tournamentId,
      playerId: this.playerId,
      metadata: this.metadata,
    };
  }

  /**
   * Create from Prisma data
   */
  static fromPrismaData(data: any): AnalyticsMetric {
    return new AnalyticsMetric({
      metricType: data.metricType as MetricType,
      date: data.date,
      value: Number(data.value),
      count: data.count ?? undefined,
      tournamentId: data.tournamentId ?? undefined,
      playerId: data.playerId ?? undefined,
      metadata: data.metadata ?? undefined,
    });
  }
}
