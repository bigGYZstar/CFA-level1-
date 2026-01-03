#!/usr/bin/env python3
import json
import os

BASE_DIR = "/home/ubuntu/cfa-vocab-app/assets/data"

new_terms = [
    {"term_id": "TERM0201", "topic_code": "EQ", "term_en": "Primary Market", "aliases": "New Issue Market", "abbrev": "", "term_ja": "発行市場", "reading": "はっこうしじょう", "definition": "企業が新規に証券を発行し、投資家に直接販売する市場。IPO（新規株式公開）や増資が行われる。", "key_points": "IPO・SEO（公募増資）の違い。引受業者の役割。", "pitfall": "Primary Market（発行市場）とSecondary Market（流通市場）の混同。", "formula": ""},
    {"term_id": "TERM0202", "topic_code": "EQ", "term_en": "Secondary Market", "aliases": "Trading Market", "abbrev": "", "term_ja": "流通市場", "reading": "りゅうつうしじょう", "definition": "既発行の証券が投資家間で売買される市場。取引所市場と店頭市場がある。", "key_points": "取引所（NYSE等）とOTC市場の違い。流動性の重要性。", "pitfall": "Secondary Marketでの取引は発行企業に資金が入らない。", "formula": ""},
    {"term_id": "TERM0203", "topic_code": "EQ", "term_en": "Broker", "aliases": "Securities Broker", "abbrev": "", "term_ja": "ブローカー", "reading": "ぶろーかー", "definition": "顧客の注文を執行する仲介業者。自己勘定では取引せず、手数料収入を得る。", "key_points": "Broker vs Dealer の違い。Best Execution義務。", "pitfall": "BrokerとDealerの混同。Brokerは代理人、Dealerは自己勘定取引。", "formula": ""},
    {"term_id": "TERM0204", "topic_code": "EQ", "term_en": "Dealer", "aliases": "Market Dealer", "abbrev": "", "term_ja": "ディーラー", "reading": "でぃーらー", "definition": "自己勘定で証券を売買し、Bid-Askスプレッドから利益を得る業者。", "key_points": "在庫リスクを負う。マーケットメイカーとの関係。", "pitfall": "Dealerは自己勘定取引のため、顧客と利益相反の可能性がある。", "formula": ""},
    {"term_id": "TERM0205", "topic_code": "EQ", "term_en": "Market Maker", "aliases": "Specialist", "abbrev": "", "term_ja": "マーケットメーカー", "reading": "まーけっとめーかー", "definition": "特定の証券について常に売買の気配を提示し、市場の流動性を提供する業者。", "key_points": "Bid-Askスプレッドが収益源。在庫管理の重要性。", "pitfall": "Market Makerは流動性提供の義務を負う代わりに、スプレッド収益を得る。", "formula": ""},
    {"term_id": "TERM0206", "topic_code": "EQ", "term_en": "Bid-Ask Spread", "aliases": "Bid-Offer Spread", "abbrev": "", "term_ja": "ビッド・アスク・スプレッド", "reading": "びっどあすくすぷれっど", "definition": "買い気配（Bid）と売り気配（Ask）の差。取引コストと流動性の指標。", "key_points": "スプレッドが狭いほど流動性が高い。取引コストの一部。", "pitfall": "Bid（買い気配）は投資家が売る価格、Ask（売り気配）は投資家が買う価格。", "formula": "Spread = Ask - Bid"},
    {"term_id": "TERM0207", "topic_code": "EQ", "term_en": "Market Order", "aliases": "", "abbrev": "", "term_ja": "成行注文", "reading": "なりゆきちゅうもん", "definition": "価格を指定せず、現在の最良価格で即座に執行される注文。執行の確実性を優先。", "key_points": "即時執行が保証される。価格の不確実性。", "pitfall": "Market Orderは執行価格が不確実。流動性の低い銘柄では不利な価格で約定する可能性。", "formula": ""},
    {"term_id": "TERM0208", "topic_code": "EQ", "term_en": "Limit Order", "aliases": "", "abbrev": "", "term_ja": "指値注文", "reading": "さしねちゅうもん", "definition": "指定した価格以上（売り）または以下（買い）でのみ執行される注文。価格を優先。", "key_points": "価格の確実性。執行されない可能性。", "pitfall": "Limit Orderは執行が保証されない。市場価格が指値に達しないと未約定。", "formula": ""},
    {"term_id": "TERM0209", "topic_code": "EQ", "term_en": "Stop-Loss Order", "aliases": "Stop Order", "abbrev": "", "term_ja": "ストップロス注文", "reading": "すとっぷろすちゅうもん", "definition": "指定した価格に達したときに成行注文として発動する注文。損失限定に使用。", "key_points": "トリガー価格の設定。ギャップリスク。", "pitfall": "Stop-Loss Orderは価格ギャップで指定価格より不利な価格で執行される可能性。", "formula": ""},
    {"term_id": "TERM0210", "topic_code": "EQ", "term_en": "Margin Trading", "aliases": "Buying on Margin", "abbrev": "", "term_ja": "信用取引", "reading": "しんようとりひき", "definition": "証券会社から資金を借りて証券を購入する取引。レバレッジ効果がある。", "key_points": "Initial Margin・Maintenance Margin。Margin Call。", "pitfall": "Margin Tradingはレバレッジにより損益が拡大。Margin Callで強制決済の可能性。", "formula": "Leverage Ratio = Position Value / Equity Value"},
    {"term_id": "TERM0211", "topic_code": "EQ", "term_en": "Price-Weighted Index", "aliases": "", "abbrev": "", "term_ja": "株価加重指数", "reading": "かぶかかじゅうしすう", "definition": "構成銘柄の株価の単純平均で算出される指数。ダウ平均が代表例。", "key_points": "高株価銘柄の影響が大きい。株式分割の調整。", "pitfall": "Price-Weighted Indexは株価が高い銘柄の影響が大きく、企業規模を反映しない。", "formula": "Weight = Pi / ΣPj"},
    {"term_id": "TERM0212", "topic_code": "EQ", "term_en": "Market-Cap Weighted Index", "aliases": "Value-Weighted Index", "abbrev": "", "term_ja": "時価総額加重指数", "reading": "じかそうがくかじゅうしすう", "definition": "構成銘柄の時価総額で加重した指数。S&P500が代表例。", "key_points": "大型株の影響が大きい。Float調整。", "pitfall": "Market-Cap Weighted Indexは過大評価された銘柄のウェイトが高くなる傾向。", "formula": "Weight = (Pi×Qi) / Σ(Pj×Qj)"},
    {"term_id": "TERM0213", "topic_code": "EQ", "term_en": "Equal-Weighted Index", "aliases": "", "abbrev": "", "term_ja": "均等加重指数", "reading": "きんとうかじゅうしすう", "definition": "すべての構成銘柄に同じウェイトを与える指数。小型株の影響が相対的に大きい。", "key_points": "定期的なリバランスが必要。取引コスト。", "pitfall": "Equal-Weighted Indexは頻繁なリバランスが必要で、取引コストが高くなる。", "formula": "Weight = 1/N"},
    {"term_id": "TERM0214", "topic_code": "EQ", "term_en": "Index Rebalancing", "aliases": "Index Reconstitution", "abbrev": "", "term_ja": "指数リバランス", "reading": "しすうりばらんす", "definition": "指数の構成銘柄やウェイトを定期的に調整すること。指数の代表性を維持。", "key_points": "リバランス頻度。追加・除外銘柄の価格影響。", "pitfall": "Index Rebalancing時に追加銘柄は買われ、除外銘柄は売られる傾向（Index Effect）。", "formula": ""},
    {"term_id": "TERM0215", "topic_code": "EQ", "term_en": "Earnings Per Share", "aliases": "EPS", "abbrev": "EPS", "term_ja": "一株当たり利益", "reading": "ひとかぶあたりりえき", "definition": "純利益を発行済株式数で割った値。株式の収益性指標。", "key_points": "Basic EPSとDiluted EPSの違い。", "pitfall": "EPSは株式数の変動で操作可能。自社株買いでEPSが上昇。", "formula": "EPS = Net Income / Shares Outstanding"},
    {"term_id": "TERM0216", "topic_code": "EQ", "term_en": "Book Value Per Share", "aliases": "BVPS", "abbrev": "BVPS", "term_ja": "一株当たり純資産", "reading": "ひとかぶあたりじゅんしさん", "definition": "株主資本を発行済株式数で割った値。会計上の一株当たり価値。", "key_points": "P/B比率の分母。清算価値との関係。", "pitfall": "Book Valueは取得原価ベースで、時価を反映しない。無形資産の扱い。", "formula": "BVPS = Shareholders Equity / Shares Outstanding"},
    {"term_id": "TERM0217", "topic_code": "EQ", "term_en": "Price-to-Sales Ratio", "aliases": "P/S Ratio", "abbrev": "P/S;PSR", "term_ja": "株価売上高倍率", "reading": "かぶかうりあげだかばいりつ", "definition": "株価を一株当たり売上高で割った比率。赤字企業の評価にも使用可能。", "key_points": "利益がマイナスでも計算可能。業種間比較に注意。", "pitfall": "P/Sは利益率を考慮しない。売上が同じでも利益率が異なれば価値は異なる。", "formula": "P/S = Price / Sales per Share"},
    {"term_id": "TERM0218", "topic_code": "EQ", "term_en": "Price-to-Cash Flow Ratio", "aliases": "P/CF Ratio", "abbrev": "P/CF", "term_ja": "株価キャッシュフロー倍率", "reading": "かぶかきゃっしゅふろーばいりつ", "definition": "株価を一株当たりキャッシュフローで割った比率。会計操作の影響を受けにくい。", "key_points": "CFの定義（CFO・FCF等）により値が異なる。", "pitfall": "P/CFはCFの定義を統一して比較する必要がある。減価償却の影響。", "formula": "P/CF = Price / Cash Flow per Share"},
    {"term_id": "TERM0219", "topic_code": "EQ", "term_en": "EV/EBITDA", "aliases": "Enterprise Multiple", "abbrev": "", "term_ja": "EV/EBITDA倍率", "reading": "いーぶいいーびっとだーばいりつ", "definition": "企業価値をEBITDAで割った比率。資本構成の影響を排除した評価指標。", "key_points": "異なる資本構成の企業比較に有用。買収評価。", "pitfall": "EV/EBITDAは設備投資の必要性を考慮しない。資本集約的産業では注意。", "formula": "EV/EBITDA = Enterprise Value / EBITDA"},
    {"term_id": "TERM0220", "topic_code": "EQ", "term_en": "PEG Ratio", "aliases": "Price/Earnings to Growth", "abbrev": "", "term_ja": "PEGレシオ", "reading": "ぺぐれしお", "definition": "P/E比率を予想EPS成長率で割った比率。成長性を考慮した割安度指標。", "key_points": "PEG < 1 は割安の目安。成長率の推定が重要。", "pitfall": "PEG Ratioは成長率の推定に依存。成長率がマイナスの場合は意味がない。", "formula": "PEG = (P/E) / EPS Growth Rate"},
    {"term_id": "TERM0221", "topic_code": "EQ", "term_en": "Justified P/E", "aliases": "Warranted P/E", "abbrev": "", "term_ja": "正当化P/E", "reading": "せいとうかぴーいー", "definition": "ファンダメンタルズに基づく理論的なP/E比率。Gordon Growth Modelから導出。", "key_points": "配当性向・要求収益率・成長率から計算。", "pitfall": "Justified P/Eは仮定（成長率・要求収益率）に敏感。前提条件の確認が重要。", "formula": "Justified P/E = (1 - b) / (r - g)"},
    {"term_id": "TERM0222", "topic_code": "EQ", "term_en": "Terminal Value", "aliases": "Continuing Value", "abbrev": "", "term_ja": "継続価値", "reading": "けいぞくかち", "definition": "予測期間終了後の企業価値。DCF評価で予測期間後のCFを一括評価。", "key_points": "Gordon Growth ModelまたはExit Multipleで計算。", "pitfall": "Terminal Valueは全体価値の大部分を占めることが多い。成長率の仮定に注意。", "formula": "TV = FCFn+1 / (r - g)"},
    {"term_id": "TERM0223", "topic_code": "EQ", "term_en": "Required Rate of Return", "aliases": "Cost of Equity", "abbrev": "", "term_ja": "要求収益率", "reading": "ようきゅうしゅうえきりつ", "definition": "投資家が株式投資に求める最低限の期待収益率。CAPMで推定。", "key_points": "リスクフリーレート + β × ERP。割引率として使用。", "pitfall": "Required Rate of ReturnとExpected Returnの違い。要求は投資家視点、期待は予測。", "formula": "r = Rf + β × (Rm - Rf)"},
    {"term_id": "TERM0224", "topic_code": "EQ", "term_en": "Sustainable Growth Rate", "aliases": "SGR", "abbrev": "SGR", "term_ja": "持続可能成長率", "reading": "じぞくかのうせいちょうりつ", "definition": "外部資金調達なしで達成可能な最大成長率。内部留保とROEから計算。", "key_points": "g = b × ROE。配当政策との関係。", "pitfall": "Sustainable Growth Rateを超える成長には外部資金調達が必要。", "formula": "SGR = Retention Ratio × ROE"},
    {"term_id": "TERM0225", "topic_code": "EQ", "term_en": "Callable Stock", "aliases": "Callable Shares", "abbrev": "", "term_ja": "コーラブル株式", "reading": "こーらぶるかぶしき", "definition": "発行企業が一定価格で買い戻す権利を持つ株式。企業に有利な条件。", "key_points": "コールプレミアム。金利低下時に行使されやすい。", "pitfall": "Callable Stockは投資家にとって不利。より高い配当利回りで補償。", "formula": ""},
    {"term_id": "TERM0226", "topic_code": "EQ", "term_en": "Putable Stock", "aliases": "Putable Shares", "abbrev": "", "term_ja": "プッタブル株式", "reading": "ぷったぶるかぶしき", "definition": "投資家が一定価格で発行企業に売り戻す権利を持つ株式。投資家に有利。", "key_points": "プットプレミアム。下落リスクの限定。", "pitfall": "Putable Stockは投資家保護のため、配当利回りは低くなる傾向。", "formula": ""},
    {"term_id": "TERM0227", "topic_code": "EQ", "term_en": "Convertible Preferred", "aliases": "Convertible Preference Shares", "abbrev": "", "term_ja": "転換優先株", "reading": "てんかんゆうせんかぶ", "definition": "一定条件で普通株に転換できる優先株。株価上昇時のアップサイドを享受。", "key_points": "転換比率・転換価格。普通株との価値比較。", "pitfall": "Convertible Preferredは転換価値と投資価値の高い方で評価。", "formula": ""},
    {"term_id": "TERM0228", "topic_code": "EQ", "term_en": "Cumulative Preferred", "aliases": "Cumulative Preference Shares", "abbrev": "", "term_ja": "累積優先株", "reading": "るいせきゆうせんかぶ", "definition": "未払配当が累積し、普通株配当前に支払われる優先株。配当の確実性が高い。", "key_points": "配当の累積。Non-cumulativeとの違い。", "pitfall": "Cumulative Preferredは未払配当が累積するため、Non-cumulativeより安全。", "formula": ""},
    {"term_id": "TERM0229", "topic_code": "EQ", "term_en": "Loss Aversion", "aliases": "", "abbrev": "", "term_ja": "損失回避", "reading": "そんしつかいひ", "definition": "同額の利益より損失をより大きく感じる心理的傾向。行動ファイナンスの重要概念。", "key_points": "損失の痛みは利益の喜びの約2倍。処分効果との関係。", "pitfall": "Loss Aversionにより、損失銘柄を長く保有し、利益銘柄を早く売却する傾向。", "formula": ""},
    {"term_id": "TERM0230", "topic_code": "EQ", "term_en": "Herding", "aliases": "Herd Behavior", "abbrev": "", "term_ja": "群集行動", "reading": "ぐんしゅうこうどう", "definition": "他の投資家の行動に追随する傾向。市場のバブルや暴落の一因。", "key_points": "情報カスケード。独自分析の軽視。", "pitfall": "Herdingは市場の非効率性を生む。逆張り戦略の根拠にもなる。", "formula": ""}
]

new_examples = [
    {"term_id": "TERM0201", "example_en": "Companies raise capital in the primary market through initial public offerings (IPOs) and seasoned equity offerings (SEOs).", "example_ja": "企業は新規株式公開（IPO）や公募増資（SEO）を通じて発行市場で資金を調達する。"},
    {"term_id": "TERM0202", "example_en": "Most stock trading occurs in the secondary market, where investors buy and sell shares among themselves.", "example_ja": "株式取引の大部分は流通市場で行われ、投資家同士が株式を売買する。"},
    {"term_id": "TERM0203", "example_en": "A broker executes buy and sell orders on behalf of clients and earns a commission for each transaction.", "example_ja": "ブローカーは顧客に代わって売買注文を執行し、各取引に対して手数料を得る。"},
    {"term_id": "TERM0204", "example_en": "A dealer maintains an inventory of securities and profits from the bid-ask spread.", "example_ja": "ディーラーは証券の在庫を保有し、ビッド・アスク・スプレッドから利益を得る。"},
    {"term_id": "TERM0205", "example_en": "Market makers provide liquidity by continuously quoting bid and ask prices for specific securities.", "example_ja": "マーケットメーカーは特定の証券について継続的にビッド価格とアスク価格を提示することで流動性を提供する。"},
    {"term_id": "TERM0206", "example_en": "A narrow bid-ask spread indicates high liquidity and lower transaction costs for investors.", "example_ja": "狭いビッド・アスク・スプレッドは高い流動性と投資家にとっての低い取引コストを示す。"},
    {"term_id": "TERM0207", "example_en": "A market order guarantees execution but not the price at which the trade will be executed.", "example_ja": "成行注文は執行を保証するが、取引が執行される価格は保証しない。"},
    {"term_id": "TERM0208", "example_en": "A limit order to buy at $50 will only be executed if the market price falls to $50 or below.", "example_ja": "50ドルでの買い指値注文は、市場価格が50ドル以下に下落した場合にのみ執行される。"},
    {"term_id": "TERM0209", "example_en": "An investor places a stop-loss order at $45 to limit potential losses if the stock price declines.", "example_ja": "投資家は株価が下落した場合の潜在的損失を限定するために45ドルでストップロス注文を出す。"},
    {"term_id": "TERM0210", "example_en": "Margin trading allows investors to leverage their positions, amplifying both gains and losses.", "example_ja": "信用取引により投資家はポジションにレバレッジをかけることができ、利益と損失の両方が拡大する。"},
    {"term_id": "TERM0211", "example_en": "The Dow Jones Industrial Average is a price-weighted index where higher-priced stocks have greater influence.", "example_ja": "ダウ・ジョーンズ工業株平均は株価加重指数であり、高株価の銘柄がより大きな影響力を持つ。"},
    {"term_id": "TERM0212", "example_en": "The S&P 500 is a market-cap weighted index where larger companies have greater weight.", "example_ja": "S&P500は時価総額加重指数であり、大企業がより大きなウェイトを持つ。"},
    {"term_id": "TERM0213", "example_en": "An equal-weighted index gives the same weight to all constituent stocks regardless of their market capitalization.", "example_ja": "均等加重指数は時価総額に関係なく、すべての構成銘柄に同じウェイトを与える。"},
    {"term_id": "TERM0214", "example_en": "Index rebalancing can cause temporary price movements in stocks being added to or removed from the index.", "example_ja": "指数リバランスは、指数に追加または除外される銘柄に一時的な価格変動を引き起こす可能性がある。"},
    {"term_id": "TERM0215", "example_en": "A company with net income of $100 million and 50 million shares outstanding has an EPS of $2.00.", "example_ja": "純利益1億ドル、発行済株式数5,000万株の企業のEPSは2.00ドルである。"},
    {"term_id": "TERM0216", "example_en": "Book value per share represents the accounting value of equity attributable to each share.", "example_ja": "一株当たり純資産は、各株式に帰属する株主資本の会計上の価値を表す。"},
    {"term_id": "TERM0217", "example_en": "The price-to-sales ratio is useful for valuing companies with negative earnings.", "example_ja": "株価売上高倍率は、利益がマイナスの企業を評価する際に有用である。"},
    {"term_id": "TERM0218", "example_en": "The price-to-cash flow ratio is less susceptible to accounting manipulation than the P/E ratio.", "example_ja": "株価キャッシュフロー倍率はP/E比率よりも会計操作の影響を受けにくい。"},
    {"term_id": "TERM0219", "example_en": "EV/EBITDA is commonly used in M&A analysis to compare companies with different capital structures.", "example_ja": "EV/EBITDAは異なる資本構成の企業を比較するためにM&A分析で一般的に使用される。"},
    {"term_id": "TERM0220", "example_en": "A PEG ratio below 1.0 suggests the stock may be undervalued relative to its growth prospects.", "example_ja": "PEGレシオが1.0未満であることは、株式が成長見通しに対して割安である可能性を示唆する。"},
    {"term_id": "TERM0221", "example_en": "The justified P/E ratio is derived from the Gordon growth model and reflects fundamental value.", "example_ja": "正当化P/Eはゴードン成長モデルから導出され、ファンダメンタル価値を反映する。"},
    {"term_id": "TERM0222", "example_en": "Terminal value often represents more than 50% of the total value in a DCF analysis.", "example_ja": "継続価値はDCF分析において総価値の50%以上を占めることが多い。"},
    {"term_id": "TERM0223", "example_en": "The required rate of return is used as the discount rate in equity valuation models.", "example_ja": "要求収益率は株式評価モデルにおいて割引率として使用される。"},
    {"term_id": "TERM0224", "example_en": "A company with ROE of 15% and retention ratio of 60% has a sustainable growth rate of 9%.", "example_ja": "ROE15%、内部留保率60%の企業の持続可能成長率は9%である。"},
    {"term_id": "TERM0225", "example_en": "Callable stock gives the issuer the right to repurchase shares at a predetermined price.", "example_ja": "コーラブル株式は発行企業に所定の価格で株式を買い戻す権利を与える。"},
    {"term_id": "TERM0226", "example_en": "Putable stock provides downside protection by allowing investors to sell shares back to the issuer.", "example_ja": "プッタブル株式は投資家が発行企業に株式を売り戻すことを可能にし、下落リスクからの保護を提供する。"},
    {"term_id": "TERM0227", "example_en": "Convertible preferred stock allows holders to convert their shares into common stock at a specified ratio.", "example_ja": "転換優先株は保有者が所定の比率で普通株に転換することを可能にする。"},
    {"term_id": "TERM0228", "example_en": "Cumulative preferred stockholders must receive all unpaid dividends before common stockholders receive any dividends.", "example_ja": "累積優先株主は、普通株主が配当を受け取る前に、すべての未払配当を受け取る必要がある。"},
    {"term_id": "TERM0229", "example_en": "Loss aversion causes investors to hold losing positions too long, hoping to break even.", "example_ja": "損失回避により、投資家は損益分岐点に戻ることを期待して、損失ポジションを長く保有しすぎる。"},
    {"term_id": "TERM0230", "example_en": "Herding behavior can lead to market bubbles as investors follow the crowd rather than their own analysis.", "example_ja": "群集行動は、投資家が自身の分析ではなく群衆に従うことで、市場バブルを引き起こす可能性がある。"}
]

# 既存のJSONファイルを読み込む
terms_path = os.path.join(BASE_DIR, "terms.json")
examples_path = os.path.join(BASE_DIR, "examples.json")

with open(terms_path, 'r', encoding='utf-8') as f:
    terms = json.load(f)

with open(examples_path, 'r', encoding='utf-8') as f:
    examples = json.load(f)

# 新規用語を追加
terms.extend(new_terms)
examples.extend(new_examples)

# JSONファイルを保存
with open(terms_path, 'w', encoding='utf-8') as f:
    json.dump(terms, f, ensure_ascii=False, indent=2)

with open(examples_path, 'w', encoding='utf-8') as f:
    json.dump(examples, f, ensure_ascii=False, indent=2)

print(f"追加完了: {len(new_terms)}語")
print(f"合計用語数: {len(terms)}語")
print(f"合計例文数: {len(examples)}件")
