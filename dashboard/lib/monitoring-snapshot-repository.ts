import type { MonitoringSnapshotRepository } from "./runtime-contracts";
import { getWorkshopStateRepository } from "./workshop-state-repository";

class WorkshopStateMonitoringSnapshotRepository implements MonitoringSnapshotRepository {
  async getSnapshots(instanceId: string) {
    const state = await getWorkshopStateRepository().getState(instanceId);
    return state.monitoring;
  }

  async replaceSnapshots(instanceId: string, snapshots: Awaited<ReturnType<MonitoringSnapshotRepository["getSnapshots"]>>) {
    const repository = getWorkshopStateRepository();
    const state = await repository.getState(instanceId);
    await repository.saveState(instanceId, {
      ...state,
      monitoring: snapshots,
    });
  }
}

export function getMonitoringSnapshotRepository(): MonitoringSnapshotRepository {
  return overrideRepository ?? new WorkshopStateMonitoringSnapshotRepository();
}

let overrideRepository: MonitoringSnapshotRepository | null = null;

export function setMonitoringSnapshotRepositoryForTests(repository: MonitoringSnapshotRepository | null) {
  overrideRepository = repository;
}
