import { seedWorkshopState } from "./workshop-data";

export function getCurrentWorkshopInstanceId() {
  return process.env.HARNESS_WORKSHOP_INSTANCE_ID ?? seedWorkshopState.workshopId;
}
