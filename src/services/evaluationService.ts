import { IEvaluation } from '../models/Evaluation';

export class EvaluationService {
  /**
   * Convert A1 conduct score (0-20) to final grade (0-10)
   */
  static convertA1(conductScore: number): number {
    if (conductScore < 0 || conductScore > 20) {
      throw new Error('A1 conduct score must be between 0 and 20');
    }
    return Math.min(10, Math.round(conductScore * 10 / 20));
  }

  /**
   * Convert A2 conduct score (0-30) to final grade (0-15)
   */
  static convertA2(conductScore: number): number {
    if (conductScore < 0 || conductScore > 30) {
      throw new Error('A2 conduct score must be between 0 and 30');
    }
    return Math.min(15, Math.round(conductScore * 15 / 30));
  }

  /**
   * Convert A3 conduct score (0-50) to final grade (0-25)
   */
  static convertA3(conductScore: number): number {
    if (conductScore < 0 || conductScore > 50) {
      throw new Error('A3 conduct score must be between 0 and 50');
    }
    return Math.min(25, Math.round(conductScore * 25 / 50));
  }

  /**
   * Convert External conduct score (0-100) to final grade (0-50)
   */
  static convertExternal(conductScore: number): number {
    if (conductScore < 0 || conductScore > 100) {
      throw new Error('External conduct score must be between 0 and 100');
    }
    return Math.min(50, Math.round(conductScore * 50 / 100));
  }

  /**
   * Calculate all conversions and totals for an evaluation
   */
  static calculateScores(evaluation: Partial<IEvaluation>): {
    internal: {
      a1: { conduct: number; convert: number };
      a2: { conduct: number; convert: number };
      a3: { conduct: number; convert: number };
    };
    external: {
      reportPresentation: { conduct: number; convert: number };
    };
    totalInternal: number;
    totalExternal: number;
    total: number;
  } {
    const internal = evaluation.internal || {
      a1: { conduct: 0, convert: 0 },
      a2: { conduct: 0, convert: 0 },
      a3: { conduct: 0, convert: 0 }
    };

    const external = evaluation.external || {
      reportPresentation: { conduct: 0, convert: 0 }
    };

    // Calculate conversions
    const a1Convert = this.convertA1(internal.a1.conduct);
    const a2Convert = this.convertA2(internal.a2.conduct);
    const a3Convert = this.convertA3(internal.a3.conduct);
    const externalConvert = this.convertExternal(external.reportPresentation.conduct);

    // Calculate totals
    const totalInternal = a1Convert + a2Convert + a3Convert;
    const totalExternal = externalConvert;
    const total = totalInternal + totalExternal;

    return {
      internal: {
        a1: { conduct: internal.a1.conduct, convert: a1Convert },
        a2: { conduct: internal.a2.conduct, convert: a2Convert },
        a3: { conduct: internal.a3.conduct, convert: a3Convert }
      },
      external: {
        reportPresentation: { conduct: external.reportPresentation.conduct, convert: externalConvert }
      },
      totalInternal,
      totalExternal,
      total
    };
  }

  /**
   * Validate that all score conversions are accurate
   */
  static validateConversions(evaluation: IEvaluation): boolean {
    try {
      const calculated = this.calculateScores(evaluation);
      
      // Check A1 conversion accuracy
      if (calculated.internal.a1.convert !== evaluation.internal.a1.convert) {
        return false;
      }
      
      // Check A2 conversion accuracy
      if (calculated.internal.a2.convert !== evaluation.internal.a2.convert) {
        return false;
      }
      
      // Check A3 conversion accuracy
      if (calculated.internal.a3.convert !== evaluation.internal.a3.convert) {
        return false;
      }
      
      // Check External conversion accuracy
      if (calculated.external.reportPresentation.convert !== evaluation.external.reportPresentation.convert) {
        return false;
      }
      
      // Check totals accuracy
      if (calculated.totalInternal !== evaluation.totalInternal ||
          calculated.totalExternal !== evaluation.totalExternal ||
          calculated.total !== evaluation.total) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}