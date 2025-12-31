import { api } from '../utils/api';

export interface EvaluationComponent {
  conduct: number;
  convert: number;
}

export interface Evaluation {
  _id: string;
  groupId: string;
  projectId: string;
  facultyId: string;
  externalFacultyId?: string;
  assessmentType: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External';
  internal: {
    cla1: EvaluationComponent;
    cla2: EvaluationComponent;
    cla3: EvaluationComponent;
  };
  external: {
    reportPresentation: EvaluationComponent;
  };
  totalInternal: number;
  totalExternal: number;
  total: number;
  isPublished: boolean;
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEvaluationView {
  groupId: string;
  groupCode: string;
  projectTitle: string;
  evaluation?: Evaluation;
  hasSubmission: boolean;
  meetUrl?: string;
}

export class EvaluationService {
  /**
   * Get evaluations for current user's groups (student view)
   */
  static async getMyEvaluations(assessmentType?: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External'): Promise<StudentEvaluationView[]> {
    const params = assessmentType ? `?assessmentType=${assessmentType}` : '';
    const response = await api.get(`/student-evaluations/my${params}`);
    return (response.data as any)?.evaluations || [];
  }

  /**
   * Get evaluation for a specific group (student view)
   */
  static async getGroupEvaluation(groupId: string, assessmentType?: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External'): Promise<StudentEvaluationView | null> {
    try {
      const params = assessmentType ? `?assessmentType=${assessmentType}` : '';
      const response = await api.get(`/student-evaluations/group/${groupId}${params}`);
      return (response.data as any)?.evaluation || null;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all evaluations for faculty review
   */
  static async getFacultyEvaluations(
    facultyId: string, 
    type?: 'IDP' | 'UROP' | 'CAPSTONE',
    assessmentType?: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External'
  ): Promise<Evaluation[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (assessmentType) params.append('assessmentType', assessmentType);
    
    const queryString = params.toString();
    const response = await api.get(`/student-evaluations/faculty/${facultyId}${queryString ? `?${queryString}` : ''}`);
    return (response.data as any)?.data || [];
  }

  /**
   * Update internal assessment score (CLA-1, CLA-2, or CLA-3)
   */
  static async updateInternalScore(
    groupId: string,
    component: 'cla1' | 'cla2' | 'cla3',
    conductScore: number,
    assessmentType: 'CLA-1' | 'CLA-2' | 'CLA-3'
  ): Promise<Evaluation> {
    const response = await api.put('/student-evaluations/internal/score', {
      groupId,
      component,
      conductScore,
      assessmentType
    });
    return (response.data as any)?.data;
  }

  /**
   * Update external evaluation score
   */
  static async updateExternalScore(
    groupId: string,
    conductScore: number
  ): Promise<Evaluation> {
    const response = await api.put('/student-evaluations/external/score', {
      groupId,
      conductScore
    });
    return (response.data as any)?.data;
  }

  /**
   * Get evaluations assigned to external faculty
   */
  static async getExternalEvaluatorAssignments(facultyId: string): Promise<Evaluation[]> {
    const response = await api.get(`/student-evaluations/external-assignments/${facultyId}`);
    return (response.data as any)?.data || [];
  }

  /**
   * Bulk publish/unpublish evaluations (coordinator only)
   */
  static async bulkUpdatePublishStatus(
    evaluationIds: string[],
    isPublished: boolean
  ): Promise<{ updated: number; evaluations: Evaluation[] }> {
    const response = await api.put('/student-evaluations/publish', {
      evaluationIds,
      isPublished
    });
    return (response.data as any)?.data || { updated: 0, evaluations: [] };
  }

  /**
   * Get coordinator overview of evaluations
   */
  static async getCoordinatorOverview(
    type?: 'IDP' | 'UROP' | 'CAPSTONE',
    published?: boolean
  ): Promise<{
    evaluations: Evaluation[];
    stats: {
      total: number;
      published: number;
      unpublished: number;
      complete: number;
      incomplete: number;
    };
  }> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (published !== undefined) params.append('published', published.toString());
    
    const response = await api.get(`/student-evaluations/coordinator/overview?${params.toString()}`);
    return (response.data as any)?.data || { evaluations: [], stats: { total: 0, published: 0, unpublished: 0, complete: 0, incomplete: 0 } };
  }

  /**
   * Calculate grade letter based on total score
   */
  static getGradeLetter(total: number): {
    letter: string;
    gpa: number;
    description: string;
  } {
    if (total >= 90) {
      return { letter: 'A+', gpa: 10, description: 'Outstanding' };
    } else if (total >= 85) {
      return { letter: 'A', gpa: 9, description: 'Excellent' };
    } else if (total >= 80) {
      return { letter: 'B+', gpa: 8, description: 'Very Good' };
    } else if (total >= 75) {
      return { letter: 'B', gpa: 7, description: 'Good' };
    } else if (total >= 70) {
      return { letter: 'C+', gpa: 6, description: 'Above Average' };
    } else if (total >= 65) {
      return { letter: 'C', gpa: 5, description: 'Average' };
    } else if (total >= 60) {
      return { letter: 'D', gpa: 4, description: 'Below Average' };
    } else if (total >= 50) {
      return { letter: 'E', gpa: 2, description: 'Poor' };
    } else {
      return { letter: 'F', gpa: 0, description: 'Fail' };
    }
  }

  /**
   * Format score display
   */
  static formatScore(score: number, maxScore: number): string {
    return `${score.toFixed(1)}/${maxScore}`;
  }

  /**
   * Get component details for display
   */
  static getComponentDetails() {
    return {
      cla1: {
        name: 'CLA-1 - Project Proposal',
        maxConduct: 20,
        maxConvert: 10,
        description: 'Initial project proposal and planning'
      },
      cla2: {
        name: 'CLA-2 - Progress Review',
        maxConduct: 30,
        maxConvert: 15,
        description: 'Mid-term progress and implementation review'
      },
      cla3: {
        name: 'CLA-3 - Final Implementation',
        maxConduct: 50,
        maxConvert: 25,
        description: 'Final project implementation and documentation'
      },
      external: {
        name: 'External Evaluation',
        maxConduct: 100,
        maxConvert: 50,
        description: 'Final presentation and report evaluation by external faculty'
      }
    };
  }

  /**
   * Check if evaluation is complete (all components have scores)
   */
  static isEvaluationComplete(evaluation: Evaluation): boolean {
    return (
      evaluation.internal.cla1.conduct > 0 &&
      evaluation.internal.cla2.conduct > 0 &&
      evaluation.internal.cla3.conduct > 0 &&
      evaluation.external.reportPresentation.conduct > 0
    );
  }

  /**
   * Get evaluation progress percentage
   */
  static getEvaluationProgress(evaluation: Evaluation): number {
    let completed = 0;
    const total = 4; // cla1, cla2, cla3, external
    
    if (evaluation.internal.cla1.conduct > 0) completed++;
    if (evaluation.internal.cla2.conduct > 0) completed++;
    if (evaluation.internal.cla3.conduct > 0) completed++;
    if (evaluation.external.reportPresentation.conduct > 0) completed++;
    
    return Math.round((completed / total) * 100);
  }
}