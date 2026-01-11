// Market Organization and Structure - Detailed Learning Content
// Based on CFA Level I Curriculum

import section_2_1_1 from './section_2_1_1.json';
import section_2_1_2 from './section_2_1_2.json';
import section_2_1_3 from './section_2_1_3.json';
import section_2_1_4 from './section_2_1_4.json';
import section_3_assets_markets from './section_3_assets_markets.json';
import section_7_intermediaries from './section_7_intermediaries.json';
import section_10_11_leverage from './section_10_11_leverage.json';
import section_12_13_orders from './section_12_13_orders.json';
import section_14_15_market_structure from './section_14_15_market_structure.json';

// Type definitions for detailed content
export interface KeyConcept {
  term: string;
  japanese: string;
  definition: string;
}

export interface PracticeQuestion {
  question: string;
  question_ja: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface CalculationExample {
  title: string;
  title_ja: string;
  given: Record<string, string | undefined>;
  solution_steps: string[];
  japanese_explanation: string;
}

export interface DetailedSection {
  section_number: string;
  section_title: string;
  section_title_ja: string;
  japanese_summary: string[];
  key_concepts: KeyConcept[];
  practice_questions: PracticeQuestion[];
  calculation_examples?: CalculationExample[];
  practical_examples?: string[];
}

// Export all detailed sections
export const detailedSections: DetailedSection[] = [
  section_2_1_1 as DetailedSection,
  section_2_1_2 as DetailedSection,
  section_2_1_3 as DetailedSection,
  section_2_1_4 as DetailedSection,
  section_3_assets_markets as DetailedSection,
  section_7_intermediaries as DetailedSection,
  section_10_11_leverage as DetailedSection,
  section_12_13_orders as DetailedSection,
  section_14_15_market_structure as DetailedSection,
];

// Get section by number
export function getDetailedSection(sectionNumber: string): DetailedSection | undefined {
  return detailedSections.find(s => s.section_number === sectionNumber);
}

// Get all practice questions
export function getAllPracticeQuestions(): PracticeQuestion[] {
  return detailedSections.flatMap(s => s.practice_questions);
}

// Get all key concepts
export function getAllKeyConcepts(): KeyConcept[] {
  return detailedSections.flatMap(s => s.key_concepts);
}

// Get all calculation examples
export function getAllCalculationExamples(): CalculationExample[] {
  return detailedSections
    .filter(s => s.calculation_examples)
    .flatMap(s => s.calculation_examples!);
}

// Summary statistics
export const contentStats = {
  totalSections: detailedSections.length,
  totalQuestions: detailedSections.reduce((sum, s) => sum + s.practice_questions.length, 0),
  totalConcepts: detailedSections.reduce((sum, s) => sum + s.key_concepts.length, 0),
  totalCalculationExamples: detailedSections.reduce(
    (sum, s) => sum + (s.calculation_examples?.length || 0), 0
  ),
};

export default detailedSections;
