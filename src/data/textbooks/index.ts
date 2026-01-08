/**
 * テキストブックデータのエクスポート
 * CFA Level I - Equity Investments
 */

import reading1Data from './equity-reading1';
import reading2Data from './equity-reading2';
import reading3Data from './equity-reading3';
import reading4Data from './equity-reading4';
import reading5Data from './equity-reading5';
import { ReadingInfo, TextContent, ExampleProblem, SubjectInfo, SubjectCode } from '@/lib/textbook-types';

/**
 * 科目情報
 */
export const subjects: SubjectInfo[] = [
  {
    code: 'EQ',
    name: 'Equity Investments',
    nameJa: '株式投資',
    description: 'Covers market organization, security market indexes, market efficiency, equity valuation, and industry analysis.',
    descriptionJa: '市場組織、証券市場インデックス、市場効率性、株式評価、業界分析をカバーします。',
    order: 1,
    totalReadings: 5,
  },
];

/**
 * Reading情報一覧
 */
export const readings: ReadingInfo[] = [
  reading1Data.info,
  reading2Data.info,
  reading3Data.info,
  reading4Data.info,
  reading5Data.info,
];

/**
 * 全テキストコンテンツ
 */
export const allTexts: TextContent[] = [
  ...reading1Data.texts,
  ...reading2Data.texts,
  ...reading3Data.texts,
  ...reading4Data.texts,
  ...reading5Data.texts,
];

/**
 * 全例題
 */
export const allExamples: ExampleProblem[] = [
  ...reading1Data.examples,
  ...reading2Data.examples,
  ...reading3Data.examples,
  ...reading4Data.examples,
  ...reading5Data.examples,
];

/**
 * Reading別のテキストを取得
 */
export function getTextsByReading(readingCode: string): TextContent[] {
  return allTexts.filter(t => t.reading === readingCode);
}

/**
 * Reading別の例題を取得
 */
export function getExamplesByReading(readingCode: string): ExampleProblem[] {
  return allExamples.filter(e => e.reading === readingCode);
}

/**
 * 科目別のReadingを取得
 */
export function getReadingsBySubject(subjectCode: SubjectCode): ReadingInfo[] {
  return readings.filter(r => r.subject === subjectCode);
}

/**
 * IDでテキストを取得
 */
export function getTextById(id: string): TextContent | undefined {
  return allTexts.find(t => t.id === id);
}

/**
 * IDで例題を取得
 */
export function getExampleById(id: string): ExampleProblem | undefined {
  return allExamples.find(e => e.id === id);
}

/**
 * 統計情報
 */
export const textbookStats = {
  totalSubjects: subjects.length,
  totalReadings: readings.length,
  totalTexts: allTexts.length,
  totalExamples: allExamples.length,
  bySubject: {
    EQ: {
      readings: 5,
      texts: allTexts.filter(t => t.subject === 'EQ').length,
      examples: allExamples.filter(e => e.subject === 'EQ').length,
    },
  },
};

export default {
  subjects,
  readings,
  allTexts,
  allExamples,
  getTextsByReading,
  getExamplesByReading,
  getReadingsBySubject,
  getTextById,
  getExampleById,
  textbookStats,
};
