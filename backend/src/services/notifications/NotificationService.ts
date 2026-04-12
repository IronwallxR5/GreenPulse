import AlertRepository from '../../repositories/alert.repository';

/**
 * NotificationService — Observer Pattern implementation.
 *
 * Decouples the "trigger" (ImpactService creates an event) from the
 * "consumer" (something needs to know when a threshold is breached).
 *
 * Observers register a callback; when notifyThresholdExceeded() is called
 * the service fans out to all registered observers AND persists a durable
 * Alert record in the database.
 */

type ThresholdObserver = (projectId: number, totalCO2: number, budget: number) => void;

export class NotificationService {
  private static instance: NotificationService;
  private observers: ThresholdObserver[] = [];
  private alertRepo: AlertRepository;

  private constructor() {
    this.alertRepo = new AlertRepository();
  }

  /** Singleton so all callers share the same observer list. */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /** Register a new observer callback. */
  subscribe(observer: ThresholdObserver) {
    this.observers.push(observer);
  }

  /** Remove a previously registered observer. */
  unsubscribe(observer: ThresholdObserver) {
    this.observers = this.observers.filter((o) => o !== observer);
  }

  /**
   * Called when an impact event pushes cumulative CO2 over the project budget.
   * 1. Persists a durable Alert record.
   * 2. Fans out to all in-process observers (e.g., logging, future WebSocket push).
   */
  async notifyThresholdExceeded(projectId: number, totalCO2: number, budget: number): Promise<void> {
    const message =
      `Carbon budget exceeded for project #${projectId}. ` +
      `Total CO₂: ${totalCO2.toFixed(4)} kg — Budget: ${budget.toFixed(4)} kg.`;

    // Persist the alert
    await this.alertRepo.create({ projectId, message, totalCO2, budget });

    // Fan out to observers
    for (const observer of this.observers) {
      try {
        observer(projectId, totalCO2, budget);
      } catch (err) {
        console.error('[NotificationService] Observer error:', err);
      }
    }
  }
}
