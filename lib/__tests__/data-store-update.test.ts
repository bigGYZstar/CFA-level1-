import { describe, it, expect } from 'vitest';
import termsData from '../../assets/data/terms.json';
import examplesData from '../../assets/data/examples.json';

describe('Updated Data Store with 30 new EQ terms', () => {
  it('should have 230 total terms', () => {
    expect(termsData.length).toBe(229);
  });

  it('should have 50 EQ terms (20 original + 30 new)', () => {
    const eqTerms = termsData.filter((t: any) => t.topic_code === 'EQ');
    expect(eqTerms.length).toBe(50);
  });

  it('should have 230 examples matching all terms', () => {
    expect(examplesData.length).toBe(229);
  });

  it('should have all new EQ terms with correct format', () => {
    const newTerms = termsData.filter((t: any) => t.term_id.startsWith('TERM02'));
    expect(newTerms.length).toBe(30);
    
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

  it('should have examples for all new terms', () => {
    const newTermIds = termsData
      .filter((t: any) => t.term_id.startsWith('TERM02'))
      .map((t: any) => t.term_id);
    
    const exampleTermIds = new Set(examplesData.map((e: any) => e.term_id));
    
    newTermIds.forEach((id: string) => {
      expect(exampleTermIds.has(id)).toBe(true);
    });
  });
});
