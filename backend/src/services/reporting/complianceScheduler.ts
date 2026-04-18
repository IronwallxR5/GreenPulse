import ComplianceService from '../compliance.service';

let schedulerHandle: NodeJS.Timeout | null = null;
let schedulerService: ComplianceService | null = null;

export const startComplianceScheduler = () => {
  if (schedulerHandle) {
    return;
  }

  schedulerService = new ComplianceService();

  const intervalMs = Math.max(10000, Number(process.env.COMPLIANCE_REPORT_INTERVAL_MS) || 60000);

  const tick = async () => {
    if (!schedulerService) {
      return;
    }

    await schedulerService.runDueSchedules();
  };

  schedulerHandle = setInterval(() => {
    void tick().catch((error) => {
      console.error('[ComplianceScheduler] Tick failed', error);
    });
  }, intervalMs);

  void tick().catch((error) => {
    console.error('[ComplianceScheduler] Initial run failed', error);
  });

  console.log(`[ComplianceScheduler] running every ${intervalMs}ms`);
};

export const stopComplianceScheduler = () => {
  if (!schedulerHandle) {
    return;
  }

  clearInterval(schedulerHandle);
  schedulerHandle = null;
};
