import { ImpactType } from '@prisma/client';

// Base class demonstrating OOP principles
export abstract class ImpactEvent {
  constructor(
    public id: number,
    public name: string,
    public unitValue: number,
    public type: ImpactType,
    public createdAt: Date
  ) {}

  // Abstract method - must be implemented by subclasses (Polymorphism)
  abstract calculateCO2(): number;
}

// Subclass for COMPUTE impact type (Inheritance)
export class ComputeEvent extends ImpactEvent {
  calculateCO2(): number {
    // 0.5 kg CO2 per hour of compute
    return this.unitValue * 0.5;
  }
}

// Subclass for STORAGE impact type
export class StorageEvent extends ImpactEvent {
  calculateCO2(): number {
    // 0.12 kg CO2 per GB/month
    return this.unitValue * 0.12;
  }
}

// Subclass for NETWORK impact type
export class NetworkEvent extends ImpactEvent {
  calculateCO2(): number {
    // 0.06 kg CO2 per GB transferred
    return this.unitValue * 0.06;
  }
}

// Subclass for API_CALL impact type
export class ApiCallEvent extends ImpactEvent {
  calculateCO2(): number {
    // 0.0001 kg CO2 per API request
    return this.unitValue * 0.0001;
  }
}
