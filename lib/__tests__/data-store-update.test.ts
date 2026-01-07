import { describe, it, expect } from 'vitest';
import termsData from '../../assets/data/terms.json';
import examplesData from '../../assets/data/examples.json';

describe('Updated Data Store with Equity terms from PDF', () => {
  it('should have 384 total terms', () => {
    expect(termsData.length).toBe(384);
  });

  it('should have 205 EQ terms', () => {
    const eqTerms = termsData.filter((t: any) => t.topic_code === 'EQ');
    expect(eqTerms.length).toBe(205);
  });

  it('should have 384 examples matching all terms', () => {
    expect(examplesData.length).toBe(384);
  });

  it('should have all new EQ terms with correct format', () => {
    const newTerms = termsData.filter((t: any) => t.term_id.startsWith('TERM02') || t.term_id.startsWith('TERM03'));
    expect(newTerms.length).toBeGreaterThan(100);
    
    newTerms.forEach((term: any) => {
      expect(term).toHaveProperty('en_canonical');
      expect(term).toHaveProperty('jp_headword');
      expect(term).toHaveProperty('jp_definition');
      expect(term.topic_code).toBe('EQ');
    });
  });

  it('should have no duplicate term_ids', () => {
    const termIds = termsData.map((t: any) => t.term_id);
    const uniqueIds = new Set(termIds);
    expect(uniqueIds.size).toBe(termIds.length);
  });

  it('should have examples for all terms', () => {
    const termIds = new Set(termsData.map((t: any) => t.term_id));
    const exampleTermIds = new Set(examplesData.map((e: any) => e.term_id));
    
    termIds.forEach((id: string) => {
      expect(exampleTermIds.has(id)).toBe(true);
    });
  });
});
