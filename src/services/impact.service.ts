import ImpactRepository from '../repositories/impact.repository';
import { CreateImpactDTO, UpdateImpactDTO } from '../utils/interfaces';

// Service Layer: Business logic and CO2 calculations (Dependency Injection)
class ImpactService {
  private impactRepository: ImpactRepository;

  constructor() {
    this.impactRepository = new ImpactRepository();
  }

  // TODO: Implement business logic methods
  // - createImpact(data, userId)
  // - getImpactById(id, userId)
  // - getAllImpacts(userId, filters)
  // - updateImpact(id, data, userId)
  // - deleteImpact(id, userId)
  // - getSummary(userId)
}

export default ImpactService;
