import ImpactRepository from '../repositories/impact.repository';
import { CreateImpactDTO, UpdateImpactDTO } from '../utils/interfaces';
import { ImpactType } from '@prisma/client';
import {
  ComputeEvent,
  StorageEvent,
  NetworkEvent,
  ApiCallEvent,
  ImpactEvent,
} from '../models/ImpactEvent';

interface GetAllFilters {
  type?: ImpactType;
  search?: string;
  sortBy?: 'createdAt' | 'carbonScore' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class ImpactService {
  private impactRepository: ImpactRepository;

  constructor() {
    this.impactRepository = new ImpactRepository();
  }

  async createImpact(data: CreateImpactDTO, userId: number) {
    const carbonScore = this.calculateCO2(data.type, data.unitValue);

    const impact = await this.impactRepository.create({
      ...data,
      carbonScore,
      userId,
    });

    return impact;
  }

  async getImpactById(id: number, userId: number) {
    const impact = await this.impactRepository.findById(id);

    if (!impact) {
      throw new Error('Impact not found');
    }

    if (impact.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    return impact;
  }

  async getAllImpacts(userId: number, filters?: GetAllFilters) {
    return await this.impactRepository.findByUserId(userId, filters);
  }

  async updateImpact(id: number, data: UpdateImpactDTO, userId: number) {
    const existingImpact = await this.impactRepository.findById(id);

    if (!existingImpact) {
      throw new Error('Impact not found');
    }

    if (existingImpact.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    const updateData: any = { ...data };

    if (data.type || data.unitValue) {
      const type = data.type || existingImpact.type;
      const unitValue = data.unitValue || existingImpact.unitValue;
      updateData.carbonScore = this.calculateCO2(type, unitValue);
    }

    return await this.impactRepository.update(id, updateData);
  }

  async deleteImpact(id: number, userId: number) {
    const impact = await this.impactRepository.findById(id);

    if (!impact) {
      throw new Error('Impact not found');
    }

    if (impact.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    return await this.impactRepository.delete(id);
  }

  async getSummary(userId: number) {
    return await this.impactRepository.getSummaryByUserId(userId);
  }

  private calculateCO2(type: ImpactType, unitValue: number): number {
    let event: ImpactEvent;

    switch (type) {
      case ImpactType.COMPUTE:
        event = new ComputeEvent(0, '', unitValue, type, new Date());
        break;
      case ImpactType.STORAGE:
        event = new StorageEvent(0, '', unitValue, type, new Date());
        break;
      case ImpactType.NETWORK:
        event = new NetworkEvent(0, '', unitValue, type, new Date());
        break;
      case ImpactType.API_CALL:
        event = new ApiCallEvent(0, '', unitValue, type, new Date());
        break;
      default:
        throw new Error('Invalid impact type');
    }

    return event.calculateCO2();
  }
}

export default ImpactService;
