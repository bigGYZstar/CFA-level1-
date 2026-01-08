/**
 * Reading 3: Market Efficiency
 * CFA Level I - Equity Investments
 */

import { TextContent, ExampleProblem, ReadingInfo, SubjectCode } from '@/lib/textbook-types';

const SUBJECT: SubjectCode = 'EQ';
const READING_CODE = 'ME';
const READING_TITLE = 'Market Efficiency';
const READING_TITLE_JA = '市場効率性';

/**
 * Reading情報
 */
export const reading3Info: ReadingInfo = {
  id: `${SUBJECT}_${READING_CODE}`,
  subject: SUBJECT,
  code: READING_CODE,
  title: READING_TITLE,
  titleJa: READING_TITLE_JA,
  description: 'This reading explores the concept of market efficiency, its forms, and implications for investment analysis and portfolio management.',
  descriptionJa: '市場効率性の概念、その形態、投資分析とポートフォリオ管理への影響について学習します。',
  order: 3,
  totalSections: 7,
  totalExamples: 3,
};

/**
 * テキストコンテンツ（セクション）
 */
export const reading3Texts: TextContent[] = [
  {
    id: `${SUBJECT}_${READING_CODE}_1`,
    subject: SUBJECT,
    reading: READING_CODE,
    readingTitle: READING_TITLE,
    readingTitleJa: READING_TITLE_JA,
    section: '1',
    title: 'Introduction',
    titleJa: 'はじめに',
    content: 'The concept of market efficiency is central to investment analysis. An informationally efficient market is one in which security prices adjust rapidly to reflect new information.',
    contentJa: '市場効率性の概念は投資分析の中心です。情報効率的な市場とは、証券価格が新しい情報を迅速に反映して調整される市場です。',
    keyPoints: [
      'Market efficiency affects investment strategy choices',
      'Efficient markets reflect all available information in prices',
    ],
    keyPointsJa: [
      '市場効率性は投資戦略の選択に影響する',
      '効率的な市場は価格にすべての利用可能な情報を反映する',
    ],
    checkQuestions: [
      {
        id: `${SUBJECT}_${READING_CODE}_1_Q1`,
        contentId: `${SUBJECT}_${READING_CODE}_1`,
        question: 'What is the key characteristic of an informationally efficient market?',
        questionJa: '情報効率的な市場の主な特徴は何ですか？',
        answer: 'Security prices adjust rapidly to reflect new information.',
        answerJa: '証券価格が新しい情報を迅速に反映して調整されること。',
        order: 1,
      },
    ],
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${SUBJECT}_${READING_CODE}_2`,
    subject: SUBJECT,
    reading: READING_CODE,
    readingTitle: READING_TITLE,
    readingTitleJa: READING_TITLE_JA,
    section: '2',
    title: 'Market Value and Intrinsic Value',
    titleJa: '市場価値と本質的価値',
    content: 'Market value is the price at which an asset can currently be bought or sold. Intrinsic value is the value that would be placed on an asset by investors if they had a complete understanding of the assets investment characteristics. In an efficient market, market value should equal intrinsic value.',
    contentJa: '市場価値とは、資産が現在売買できる価格です。本質的価値とは、投資家がその資産の投資特性を完全に理解している場合に資産に付ける価値です。効率的な市場では、市場価値は本質的価値と等しくなるはずです。',
    keyPoints: [
      'Market value is the current trading price',
      'Intrinsic value is the true worth based on fundamentals',
      'Mispricing occurs when market value differs from intrinsic value',
    ],
    keyPointsJa: [
      '市場価値は現在の取引価格',
      '本質的価値はファンダメンタルズに基づく真の価値',
      '市場価値が本質的価値と異なる場合にミスプライシングが発生',
    ],
    checkQuestions: [
      {
        id: `${SUBJECT}_${READING_CODE}_2_Q1`,
        contentId: `${SUBJECT}_${READING_CODE}_2`,
        question: 'What is the difference between market value and intrinsic value?',
        questionJa: '市場価値と本質的価値の違いは何ですか？',
        answer: 'Market value is the current trading price, while intrinsic value is the true worth based on complete understanding of investment characteristics.',
        answerJa: '市場価値は現在の取引価格であり、本質的価値は投資特性の完全な理解に基づく真の価値です。',
        order: 1,
      },
    ],
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${SUBJECT}_${READING_CODE}_3`,
    subject: SUBJECT,
    reading: READING_CODE,
    readingTitle: READING_TITLE,
    readingTitleJa: READING_TITLE_JA,
    section: '3',
    title: 'Factors Affecting Market Efficiency',
    titleJa: '市場効率性に影響を与える要因',
    content: 'Several factors contribute to market efficiency: (1) The number of market participants, (2) The availability of information, (3) Impediments to trading, (4) Transaction costs, and (5) Information acquisition costs.',
    contentJa: '市場効率性に寄与するいくつかの要因があります：(1) 市場参加者の数、(2) 情報の入手可能性、(3) 取引の障害、(4) 取引コスト、(5) 情報取得コスト。',
    keyPoints: [
      'More participants generally lead to greater efficiency',
      'Lower transaction costs increase market efficiency',
      'Information availability is crucial for efficiency',
    ],
    keyPointsJa: [
      '参加者が多いほど効率性が高まる傾向',
      '取引コストが低いほど市場効率性が向上',
      '情報の入手可能性は効率性に不可欠',
    ],
    checkQuestions: [
      {
        id: `${SUBJECT}_${READING_CODE}_3_Q1`,
        contentId: `${SUBJECT}_${READING_CODE}_3`,
        question: 'What are the main factors that affect market efficiency?',
        questionJa: '市場効率性に影響を与える主な要因は何ですか？',
        answer: 'Number of participants, information availability, trading impediments, transaction costs, and information acquisition costs.',
        answerJa: '参加者の数、情報の入手可能性、取引の障害、取引コスト、情報取得コスト。',
        order: 1,
      },
    ],
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${SUBJECT}_${READING_CODE}_4`,
    subject: SUBJECT,
    reading: READING_CODE,
    readingTitle: READING_TITLE,
    readingTitleJa: READING_TITLE_JA,
    section: '4',
    title: 'Forms of Market Efficiency',
    titleJa: '市場効率性の形態',
    content: 'There are three forms of market efficiency: (1) Weak-form: prices reflect all past market data. (2) Semi-strong-form: prices reflect all publicly available information. (3) Strong-form: prices reflect all information, including private information.',
    contentJa: '市場効率性には3つの形態があります：(1) ウィーク・フォーム：価格はすべての過去の市場データを反映。(2) セミストロング・フォーム：価格はすべての公開情報を反映。(3) ストロング・フォーム：価格は非公開情報を含むすべての情報を反映。',
    keyPoints: [
      'Weak-form efficiency makes technical analysis ineffective',
      'Semi-strong-form efficiency makes fundamental analysis ineffective',
      'Strong-form efficiency implies even insiders cannot earn abnormal returns',
    ],
    keyPointsJa: [
      'ウィーク・フォーム効率性ではテクニカル分析が無効',
      'セミストロング・フォーム効率性ではファンダメンタル分析が無効',
      'ストロング・フォーム効率性ではインサイダーでさえ異常リターンを得られない',
    ],
    checkQuestions: [
      {
        id: `${SUBJECT}_${READING_CODE}_4_Q1`,
        contentId: `${SUBJECT}_${READING_CODE}_4`,
        question: 'What type of analysis becomes ineffective in a semi-strong-form efficient market?',
        questionJa: 'セミストロング・フォーム効率的市場で無効になる分析の種類は何ですか？',
        answer: 'Fundamental analysis, because all public information is already reflected in prices.',
        answerJa: 'ファンダメンタル分析。すべての公開情報がすでに価格に反映されているため。',
        order: 1,
      },
    ],
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${SUBJECT}_${READING_CODE}_5`,
    subject: SUBJECT,
    reading: READING_CODE,
    readingTitle: READING_TITLE,
    readingTitleJa: READING_TITLE_JA,
    section: '5',
    title: 'Market Anomalies',
    titleJa: '市場アノマリー',
    content: 'Market anomalies are patterns in security returns that appear to contradict market efficiency. Common anomalies include: calendar anomalies (January effect), momentum and overreaction anomalies, size and value anomalies, and closed-end fund discounts.',
    contentJa: '市場アノマリーとは、市場効率性と矛盾するように見える証券リターンのパターンです。一般的なアノマリーには、カレンダーアノマリー（1月効果）、モメンタムと過剰反応アノマリー、サイズとバリューアノマリー、クローズドエンドファンドのディスカウントがあります。',
    keyPoints: [
      'Anomalies suggest potential market inefficiencies',
      'January effect shows stocks perform better in January',
      'Size effect suggests small-cap stocks outperform',
    ],
    keyPointsJa: [
      'アノマリーは潜在的な市場の非効率性を示唆',
      '1月効果は1月に株式がより良いパフォーマンスを示すことを示す',
      'サイズ効果は小型株がアウトパフォームすることを示唆',
    ],
    checkQuestions: [
      {
        id: `${SUBJECT}_${READING_CODE}_5_Q1`,
        contentId: `${SUBJECT}_${READING_CODE}_5`,
        question: 'What is a market anomaly?',
        questionJa: '市場アノマリーとは何ですか？',
        answer: 'A pattern in security returns that appears to contradict market efficiency.',
        answerJa: '市場効率性と矛盾するように見える証券リターンのパターン。',
        order: 1,
      },
    ],
    order: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${SUBJECT}_${READING_CODE}_6`,
    subject: SUBJECT,
    reading: READING_CODE,
    readingTitle: READING_TITLE,
    readingTitleJa: READING_TITLE_JA,
    section: '6',
    title: 'Behavioral Finance',
    titleJa: '行動ファイナンス',
    content: 'Behavioral finance studies how psychological biases affect investor behavior and market prices. Key biases include: loss aversion, overconfidence, herding, and mental accounting. These biases may help explain market anomalies.',
    contentJa: '行動ファイナンスは、心理的バイアスが投資家の行動と市場価格にどのように影響するかを研究します。主なバイアスには、損失回避、過信、群集行動、メンタルアカウンティングがあります。これらのバイアスは市場アノマリーを説明するのに役立つ可能性があります。',
    keyPoints: [
      'Loss aversion: investors feel losses more strongly than gains',
      'Overconfidence: investors overestimate their predictive ability',
      'Herding: investors follow the crowd',
    ],
    keyPointsJa: [
      '損失回避：投資家は利益よりも損失をより強く感じる',
      '過信：投資家は予測能力を過大評価する',
      '群集行動：投資家は群衆に従う',
    ],
    checkQuestions: [
      {
        id: `${SUBJECT}_${READING_CODE}_6_Q1`,
        contentId: `${SUBJECT}_${READING_CODE}_6`,
        question: 'What is loss aversion?',
        questionJa: '損失回避とは何ですか？',
        answer: 'The tendency for investors to feel losses more strongly than equivalent gains.',
        answerJa: '投資家が同等の利益よりも損失をより強く感じる傾向。',
        order: 1,
      },
    ],
    order: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${SUBJECT}_${READING_CODE}_7`,
    subject: SUBJECT,
    reading: READING_CODE,
    readingTitle: READING_TITLE,
    readingTitleJa: READING_TITLE_JA,
    section: '7',
    title: 'Implications for Portfolio Management',
    titleJa: 'ポートフォリオ管理への影響',
    content: 'The degree of market efficiency has important implications for the choice between active and passive portfolio management. In an efficient market, passive management may be more appropriate. If markets are not fully efficient, skilled active managers may generate alpha.',
    contentJa: '市場効率性の程度は、アクティブ運用とパッシブ運用の選択に重要な影響を与えます。効率的な市場ではパッシブ運用がより適切かもしれません。市場が完全に効率的でない場合、熟練したアクティブマネージャーはアルファを生み出すことができます。',
    keyPoints: [
      'Efficient markets favor passive management',
      'Active management seeks to exploit market inefficiencies',
      'Alpha represents excess returns from active management',
    ],
    keyPointsJa: [
      '効率的な市場ではパッシブ運用が有利',
      'アクティブ運用は市場の非効率性を利用しようとする',
      'アルファはアクティブ運用からの超過リターンを表す',
    ],
    checkQuestions: [
      {
        id: `${SUBJECT}_${READING_CODE}_7_Q1`,
        contentId: `${SUBJECT}_${READING_CODE}_7`,
        question: 'Why might passive management be preferred in an efficient market?',
        questionJa: 'なぜ効率的な市場ではパッシブ運用が好まれる可能性があるのですか？',
        answer: 'Because active management is unlikely to consistently generate abnormal returns after costs in an efficient market.',
        answerJa: '効率的な市場ではアクティブ運用がコスト控除後に一貫して異常リターンを生み出す可能性が低いため。',
        order: 1,
      },
    ],
    order: 7,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * 例題
 */
export const reading3Examples: ExampleProblem[] = [
  {
    id: `${SUBJECT}_${READING_CODE}_EX1`,
    subject: SUBJECT,
    reading: READING_CODE,
    readingTitle: READING_TITLE,
    readingTitleJa: READING_TITLE_JA,
    exampleNumber: 1,
    title: 'Identifying Forms of Market Efficiency',
    titleJa: '市場効率性の形態の識別',
    problem: 'An analyst discovers that she can consistently earn abnormal returns by analyzing publicly available financial statements before other analysts. Which form of market efficiency does this evidence contradict?',
    problemJa: 'あるアナリストが、他のアナリストより先に公開されている財務諸表を分析することで、一貫して異常リターンを得られることを発見しました。この証拠はどの形態の市場効率性と矛盾しますか？',
    solution: 'This contradicts semi-strong-form efficiency.',
    solutionJa: 'これはセミストロング・フォーム効率性と矛盾します。',
    explanation: 'If the market were semi-strong-form efficient, all publicly available information (including financial statements) would already be reflected in prices, and analyzing such information would not generate abnormal returns.',
    explanationJa: '市場がセミストロング・フォーム効率的であれば、すべての公開情報（財務諸表を含む）はすでに価格に反映されており、そのような情報を分析しても異常リターンは生まれません。',
    relatedSection: '4',
    difficulty: 'medium',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${SUBJECT}_${READING_CODE}_EX2`,
    subject: SUBJECT,
    reading: READING_CODE,
    readingTitle: READING_TITLE,
    readingTitleJa: READING_TITLE_JA,
    exampleNumber: 2,
    title: 'Technical Analysis and Market Efficiency',
    titleJa: 'テクニカル分析と市場効率性',
    problem: 'A portfolio manager claims that by using moving averages and chart patterns, she can consistently predict future stock prices and earn above-market returns. If true, which form of market efficiency would this contradict?',
    problemJa: 'あるポートフォリオマネージャーが、移動平均とチャートパターンを使用することで、一貫して将来の株価を予測し、市場を上回るリターンを得られると主張しています。これが本当であれば、どの形態の市場効率性と矛盾しますか？',
    solution: 'This would contradict weak-form efficiency.',
    solutionJa: 'これはウィーク・フォーム効率性と矛盾します。',
    explanation: 'Technical analysis relies on past price patterns and trading volumes. In a weak-form efficient market, current prices already reflect all past market data, making technical analysis ineffective for generating abnormal returns.',
    explanationJa: 'テクニカル分析は過去の価格パターンと取引量に依存します。ウィーク・フォーム効率的市場では、現在の価格はすでにすべての過去の市場データを反映しているため、テクニカル分析は異常リターンを生み出すのに無効です。',
    relatedSection: '4',
    difficulty: 'easy',
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `${SUBJECT}_${READING_CODE}_EX3`,
    subject: SUBJECT,
    reading: READING_CODE,
    readingTitle: READING_TITLE,
    readingTitleJa: READING_TITLE_JA,
    exampleNumber: 3,
    title: 'Behavioral Bias Identification',
    titleJa: '行動バイアスの識別',
    problem: 'An investor holds onto a losing stock for years, refusing to sell because he does not want to realize the loss. Which behavioral bias does this most likely represent?',
    problemJa: 'ある投資家が損失を出している株式を何年も保有し続け、損失を実現したくないため売却を拒否しています。これは最も可能性が高いどの行動バイアスを表していますか？',
    solution: 'This represents loss aversion.',
    solutionJa: 'これは損失回避を表しています。',
    explanation: 'Loss aversion is the tendency for investors to feel losses more strongly than equivalent gains. This often leads investors to hold losing positions too long, hoping to avoid realizing the loss.',
    explanationJa: '損失回避とは、投資家が同等の利益よりも損失をより強く感じる傾向です。これにより、投資家は損失の実現を避けようとして、損失ポジションを長く保有しすぎることがよくあります。',
    relatedSection: '6',
    difficulty: 'easy',
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];


export default {
  info: reading3Info,
  texts: reading3Texts,
  examples: reading3Examples,
};
