// CFA Level I 実問ストック（拡張可能な構造）
import { CFAQuestion } from './game-types';

// CFA実問データベース
// 新しい問題を追加する場合は、このリストに追加するだけでOK
export const CFA_QUESTIONS: CFAQuestion[] = [
  // 倫理・職業行為基準
  {
    id: 'cfa_eth_001',
    question: 'According to the CFA Institute Code of Ethics, members must place the integrity of the investment profession and the interests of clients above:',
    options: [
      'Their own personal interests',
      'The interests of their employer',
      'Both A and B',
      'Neither A nor B'
    ],
    correctAnswer: 'Both A and B',
    explanation: 'CFA Institute Code of Ethics requires members to place the integrity of the profession and client interests above their own personal interests and those of their employer.',
    topic: 'Ethics',
    difficulty: 'medium',
  },
  {
    id: 'cfa_eth_002',
    question: 'Which of the following is NOT a component of the CFA Institute Standards of Professional Conduct?',
    options: [
      'Professionalism',
      'Duties to Clients',
      'Maximizing Employer Profits',
      'Duties to Employers'
    ],
    correctAnswer: 'Maximizing Employer Profits',
    explanation: 'The Standards of Professional Conduct include Professionalism, Integrity of Capital Markets, Duties to Clients, Duties to Employers, Investment Analysis, and Conflicts of Interest.',
    topic: 'Ethics',
    difficulty: 'easy',
  },
  // 定量分析
  {
    id: 'cfa_qm_001',
    question: 'If a stock has a 60% probability of increasing in value and a 40% probability of decreasing, what is the expected number of increases in 5 independent trials?',
    options: [
      '2',
      '3',
      '4',
    ],
    correctAnswer: '3',
    explanation: 'Expected value = n × p = 5 × 0.60 = 3 increases.',
    topic: 'Quantitative Methods',
    difficulty: 'easy',
  },
  {
    id: 'cfa_qm_002',
    question: 'A portfolio has an expected return of 12% and a standard deviation of 20%. What is the coefficient of variation (CV)?',
    options: [
      '0.60',
      '1.67',
      '2.40',
    ],
    correctAnswer: '1.67',
    explanation: 'CV = Standard Deviation / Expected Return = 20% / 12% = 1.67',
    topic: 'Quantitative Methods',
    difficulty: 'medium',
  },
  // 経済学
  {
    id: 'cfa_econ_001',
    question: 'In the short run, if aggregate demand increases while short-run aggregate supply remains constant, what is the most likely effect?',
    options: [
      'Real GDP increases and price level increases',
      'Real GDP decreases and price level increases',
      'Real GDP increases and price level decreases',
      'Real GDP decreases and price level decreases'
    ],
    correctAnswer: 'Real GDP increases and price level increases',
    explanation: 'An increase in aggregate demand shifts the AD curve to the right, leading to higher real GDP and higher price levels in the short run.',
    topic: 'Economics',
    difficulty: 'medium',
  },
  {
    id: 'cfa_econ_002',
    question: 'Which of the following best describes the Fisher effect?',
    options: [
      'Nominal interest rate equals real interest rate plus expected inflation',
      'Real interest rate equals nominal interest rate plus expected inflation',
      'Expected inflation equals nominal interest rate minus real interest rate',
    ],
    correctAnswer: 'Nominal interest rate equals real interest rate plus expected inflation',
    explanation: 'The Fisher effect states that nominal interest rate = real interest rate + expected inflation rate.',
    topic: 'Economics',
    difficulty: 'easy',
  },
  // 財務諸表分析
  {
    id: 'cfa_fsa_001',
    question: 'Under IFRS, which inventory cost flow assumption is NOT permitted?',
    options: [
      'FIFO',
      'LIFO',
      'Weighted Average Cost',
    ],
    correctAnswer: 'LIFO',
    explanation: 'IFRS does not permit the use of LIFO (Last-In, First-Out) for inventory valuation, while US GAAP allows it.',
    topic: 'Financial Statement Analysis',
    difficulty: 'medium',
  },
  {
    id: 'cfa_fsa_002',
    question: 'A company has total assets of $500 million and total equity of $200 million. What is its financial leverage ratio?',
    options: [
      '1.5',
      '2.5',
      '3.0',
    ],
    correctAnswer: '2.5',
    explanation: 'Financial Leverage = Total Assets / Total Equity = $500M / $200M = 2.5',
    topic: 'Financial Statement Analysis',
    difficulty: 'easy',
  },
  // 株式投資
  {
    id: 'cfa_eq_001',
    question: 'A stock has a required return of 12% and is expected to pay a dividend of $2.00 next year. If dividends are expected to grow at 4% indefinitely, what is the intrinsic value using the Gordon Growth Model?',
    options: [
      '$16.67',
      '$25.00',
      '$50.00',
    ],
    correctAnswer: '$25.00',
    explanation: 'Gordon Growth Model: V = D1 / (r - g) = $2.00 / (0.12 - 0.04) = $2.00 / 0.08 = $25.00',
    topic: 'Equity Investments',
    difficulty: 'medium',
  },
  {
    id: 'cfa_eq_002',
    question: 'Which of the following is a characteristic of a weak-form efficient market?',
    options: [
      'Current prices reflect all publicly available information',
      'Current prices reflect all past price and volume data',
      'Current prices reflect all public and private information',
      'Technical analysis can consistently generate excess returns'
    ],
    correctAnswer: 'Current prices reflect all past price and volume data',
    explanation: 'In a weak-form efficient market, current prices reflect all historical price and volume information, making technical analysis ineffective.',
    topic: 'Equity Investments',
    difficulty: 'medium',
  },
  // 債券
  {
    id: 'cfa_fi_001',
    question: 'If a bond\'s yield to maturity increases, what happens to its price?',
    options: [
      'Price increases',
      'Price decreases',
      'Price remains unchanged',
    ],
    correctAnswer: 'Price decreases',
    explanation: 'Bond prices and yields have an inverse relationship. When yields increase, bond prices decrease.',
    topic: 'Fixed Income',
    difficulty: 'easy',
  },
  {
    id: 'cfa_fi_002',
    question: 'Which type of bond has the highest interest rate risk?',
    options: [
      'Short-term, high coupon bond',
      'Long-term, low coupon bond',
      'Short-term, low coupon bond',
    ],
    correctAnswer: 'Long-term, low coupon bond',
    explanation: 'Interest rate risk is highest for bonds with longer maturities and lower coupon rates because more of their value comes from distant cash flows.',
    topic: 'Fixed Income',
    difficulty: 'medium',
  },
];

// ランダムにCFA実問を取得
export function getRandomCFAQuestion(): CFAQuestion {
  const randomIndex = Math.floor(Math.random() * CFA_QUESTIONS.length);
  return CFA_QUESTIONS[randomIndex];
}

// 難易度別にCFA実問を取得
export function getCFAQuestionByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): CFAQuestion | null {
  const filtered = CFA_QUESTIONS.filter(q => q.difficulty === difficulty);
  if (filtered.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

// トピック別にCFA実問を取得
export function getCFAQuestionByTopic(topic: string): CFAQuestion | null {
  const filtered = CFA_QUESTIONS.filter(q => q.topic === topic);
  if (filtered.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}
