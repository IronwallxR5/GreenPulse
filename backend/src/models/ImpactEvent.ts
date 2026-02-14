import { ImpactType } from '@prisma/client';
export abstract class ImpactEvent {
  constructor(
    public id: number,
    public name: string,
    public unitValue: number,
    public type: ImpactType,
    public createdAt: Date
  ) {}
  abstract calculateCO2(): number;
}
export class ComputeEvent extends ImpactEvent {
  calculateCO2(): number {
    return this.unitValue * 0.5;
  }
}
export class StorageEvent extends ImpactEvent {
  calculateCO2(): number {
    return this.unitValue * 0.12;
  }
}
export class NetworkEvent extends ImpactEvent {
  calculateCO2(): number {
    return this.unitValue * 0.06;
  }
}

export class ApiCallEvent extends ImpactEvent {
  calculateCO2(): number {
    return this.unitValue * 0.0001;
  }
}
