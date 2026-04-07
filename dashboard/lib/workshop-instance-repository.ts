import type { WorkshopInstanceRepository } from "./runtime-contracts";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { sampleWorkshopInstances } from "./workshop-data";

export class SampleWorkshopInstanceRepository implements WorkshopInstanceRepository {
  async getDefaultInstanceId() {
    return getCurrentWorkshopInstanceId();
  }

  async getInstance(instanceId: string) {
    return sampleWorkshopInstances.find((instance) => instance.id === instanceId) ?? null;
  }

  async listInstances() {
    return structuredClone(sampleWorkshopInstances);
  }
}

export function getWorkshopInstanceRepository(): WorkshopInstanceRepository {
  return overrideRepository ?? new SampleWorkshopInstanceRepository();
}

let overrideRepository: WorkshopInstanceRepository | null = null;

export function setWorkshopInstanceRepositoryForTests(repository: WorkshopInstanceRepository | null) {
  overrideRepository = repository;
}
