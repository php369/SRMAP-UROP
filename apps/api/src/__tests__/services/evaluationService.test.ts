import { EvaluationService } from '../../services/evaluationService';

describe('EvaluationService', () => {
  describe('Score Conversions', () => {
    test('convertA1 should convert 0-20 to 0-10', () => {
      expect(EvaluationService.convertA1(0)).toBe(0);
      expect(EvaluationService.convertA1(10)).toBe(5);
      expect(EvaluationService.convertA1(20)).toBe(10);
      expect(EvaluationService.convertA1(18)).toBe(9);
    });

    test('convertA2 should convert 0-30 to 0-15', () => {
      expect(EvaluationService.convertA2(0)).toBe(0);
      expect(EvaluationService.convertA2(15)).toBe(8);
      expect(EvaluationService.convertA2(30)).toBe(15);
      expect(EvaluationService.convertA2(24)).toBe(12);
    });

    test('convertA3 should convert 0-50 to 0-25', () => {
      expect(EvaluationService.convertA3(0)).toBe(0);
      expect(EvaluationService.convertA3(25)).toBe(13);
      expect(EvaluationService.convertA3(50)).toBe(25);
      expect(EvaluationService.convertA3(40)).toBe(20);
    });

    test('convertExternal should convert 0-100 to 0-50', () => {
      expect(EvaluationService.convertExternal(0)).toBe(0);
      expect(EvaluationService.convertExternal(50)).toBe(25);
      expect(EvaluationService.convertExternal(100)).toBe(50);
      expect(EvaluationService.convertExternal(80)).toBe(40);
    });

    test('should throw errors for invalid score ranges', () => {
      expect(() => EvaluationService.convertA1(-1)).toThrow();
      expect(() => EvaluationService.convertA1(21)).toThrow();
      expect(() => EvaluationService.convertA2(-1)).toThrow();
      expect(() => EvaluationService.convertA2(31)).toThrow();
      expect(() => EvaluationService.convertA3(-1)).toThrow();
      expect(() => EvaluationService.convertA3(51)).toThrow();
      expect(() => EvaluationService.convertExternal(-1)).toThrow();
      expect(() => EvaluationService.convertExternal(101)).toThrow();
    });
  });

  describe('calculateScores', () => {
    test('should calculate all conversions and totals correctly', () => {
      const evaluation = {
        internal: {
          a1: { conduct: 18, convert: 0 },
          a2: { conduct: 24, convert: 0 },
          a3: { conduct: 40, convert: 0 }
        },
        external: {
          reportPresentation: { conduct: 80, convert: 0 }
        }
      };

      const result = EvaluationService.calculateScores(evaluation);

      expect(result.internal.a1.convert).toBe(9);
      expect(result.internal.a2.convert).toBe(12);
      expect(result.internal.a3.convert).toBe(20);
      expect(result.external.reportPresentation.convert).toBe(40);
      expect(result.totalInternal).toBe(41); // 9 + 12 + 20
      expect(result.totalExternal).toBe(40);
      expect(result.total).toBe(81); // 41 + 40
    });

    test('should handle default values for missing scores', () => {
      const evaluation = {};

      const result = EvaluationService.calculateScores(evaluation);

      expect(result.internal.a1.convert).toBe(0);
      expect(result.internal.a2.convert).toBe(0);
      expect(result.internal.a3.convert).toBe(0);
      expect(result.external.reportPresentation.convert).toBe(0);
      expect(result.totalInternal).toBe(0);
      expect(result.totalExternal).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});