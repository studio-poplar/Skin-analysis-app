import { PrismaClient, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

// ジャンル(サイト構成③「気になること」の選択肢)
const genres = [
  { genreId: "face_skin", name: "顔・肌", sortOrder: 1 },
  { genreId: "scalp_hair", name: "頭皮・髪", sortOrder: 2 },
  { genreId: "body_shape", name: "ボディライン・体型づくり", sortOrder: 3 },
  { genreId: "body_condition", name: "からだの不調", sortOrder: 4 },
] as const;

// 症状カテゴリ(サイト構成④「③の症状深堀」の選択肢)
const categories = [
  { categoryId: "FS-01", genreId: "face_skin", name: "たるみ・シワ", sortOrder: 1 },
  { categoryId: "FS-02", genreId: "face_skin", name: "毛穴・ニキビ", sortOrder: 2 },
  { categoryId: "FS-03", genreId: "face_skin", name: "乾燥", sortOrder: 3 },
  { categoryId: "FS-04", genreId: "face_skin", name: "シミ", sortOrder: 4 },
  { categoryId: "FS-05", genreId: "face_skin", name: "アトピー・炎症", sortOrder: 5 },

  { categoryId: "SH-01", genreId: "scalp_hair", name: "薄毛・抜け毛", sortOrder: 1 },
  { categoryId: "SH-02", genreId: "scalp_hair", name: "頭皮のべたつき・乾燥", sortOrder: 2 },
  { categoryId: "SH-03", genreId: "scalp_hair", name: "パサつき・ダメージ髪", sortOrder: 3 },
  { categoryId: "SH-04", genreId: "scalp_hair", name: "白髪・ハリコシ不足", sortOrder: 4 },

  { categoryId: "BS-01", genreId: "body_shape", name: "脂肪が落ちない", sortOrder: 1 },
  { categoryId: "BS-02", genreId: "body_shape", name: "手足のむくみ", sortOrder: 2 },
  { categoryId: "BS-03", genreId: "body_shape", name: "産後に体型が戻らない", sortOrder: 3 },
  { categoryId: "BS-04", genreId: "body_shape", name: "筋肉を増やしたい", sortOrder: 4 },
  { categoryId: "BS-05", genreId: "body_shape", name: "姿勢を改善したい", sortOrder: 5 },

  { categoryId: "BC-01", genreId: "body_condition", name: "疲れやすい・だるさが取れない", sortOrder: 1 },
  { categoryId: "BC-02", genreId: "body_condition", name: "肩こり・腰痛などのこり", sortOrder: 2 },
  { categoryId: "BC-03", genreId: "body_condition", name: "睡眠の質(寝つき・寝起き)", sortOrder: 3 },
  { categoryId: "BC-04", genreId: "body_condition", name: "お腹の調子(消化・便通)", sortOrder: 4 },
  { categoryId: "BC-05", genreId: "body_condition", name: "気分の浮き沈み・ストレス", sortOrder: 5 },
] as const;

// カテゴリ別の一般知識。
// why  = 原因の説明(なぜ起こるか。改善策の提案画面の「Why」段)
// how  = 改善方法(まず自分でできるセルフケア。「How」段。製品に依存しない一般的な生活習慣の工夫)
// いずれも is_source_verified は false で登録(公開前に出典確認が必要)。
// 製品が紐付いていないカテゴリも、Why/Howは一般的な健康情報として記載している
// (「準備中」なのはあくまで製品(Support)のみ)。
const categoryContent: Record<string, { why: string; how: string }> = {
  "FS-01": {
    why: "肌のハリ・弾力は、真皮に存在するコラーゲンやエラスチンといった線維成分によって支えられています。加齢とともにこれらの線維成分は減少・変性し、あわせて表情筋や皮下脂肪の変化も加わることで、フェイスラインのゆるみやたるみとして現れると考えられています。また、角層のうるおい(水分)が不足してキメが乱れることで生じる「乾燥小ジワ」も、見た目の年齢印象に影響するとされています。",
    how: "表情筋を意識した優しいマッサージ、日中の紫外線対策、十分な保湿、良質な睡眠とバランスの良い食事は、肌のハリを支える基本的な生活習慣として知られています。",
  },
  "FS-02": {
    why: "毛穴の目立ちやざらつきは、古い角質が肌表面に滞留し、ターンオーバー(肌の生まれ変わり)が乱れることで起こりやすくなります。皮脂分泌の変化や乾燥も、毛穴が目立つ一因とされています。肌をすこやかに保つ土台として、日々の丁寧な洗浄・角質ケアが重要とされています。",
    how: "洗いすぎず摩擦を避けた優しい洗顔、清潔なタオル・洗顔料の使用、脂質の多い食事や睡眠不足を避けることが、毛穴・肌質を整える基本とされています。",
  },
  "FS-03": {
    why: "肌のうるおいは、角層内の天然保湿因子(NMF)や皮脂膜によって保たれています。加齢や外部環境(乾燥・紫外線)によってこれらが減少すると、水分保持力が低下し乾燥が進みやすくなります。",
    how: "洗顔後すぐの保湿、室内の適切な加湿、こまめな水分補給、熱すぎるお湯での洗顔を避けることが、乾燥対策の基本として知られています。",
  },
  "FS-04": {
    why: "肌のくすみや色調の変化は、ターンオーバーの乱れによる古い角質の蓄積や、血行の滞り、紫外線の影響など、複数の要因が重なって生じるとされています。透明感のある肌印象には、日々のUVケアと肌質を整えるお手入れの両方が関わると考えられています。",
    how: "年間を通じた日焼け止めの使用、日傘・帽子でのUV対策、ビタミン類を意識したバランスの良い食事が、くすみ・色ムラ対策の基本とされています。",
  },
  "FS-05": {
    why: "アトピー性皮膚炎や肌の炎症は皮膚科的な診断・治療が必要な症状です。本サービスは特定の製品による改善を保証するものではありません。気になる症状がある場合は、皮膚科医にご相談いただくことをおすすめします。",
    how: "刺激の少ない衣類・洗剤を選ぶ、汗をかいたら早めに洗い流す、爪を短く保ち掻きむしりを防ぐなど、日常生活での刺激を減らす工夫が一般的に勧められています。治療は自己判断せず、必ず皮膚科医にご相談ください。",
  },

  "SH-01": {
    why: "髪のボリュームやハリは頭皮環境に左右されます。加齢や乾燥、血行不良などにより頭皮環境が乱れると、髪が細くなったり、抜け毛が気になりやすくなったりすると考えられています。",
    how: "頭皮の血行を意識した優しいマッサージ、十分な睡眠、タンパク質・亜鉛・ビタミン類を意識した食事、過度なヘアカラー・パーマを控えることが、髪の健康を保つ基本とされています。",
  },
  "SH-02": {
    why: "頭皮は皮脂腺が多く、皮脂分泌のバランスが崩れるとべたつきや乾燥として現れやすい部位です。頭皮環境を整えることが、健やかな髪を育む土台になると考えられています。",
    how: "頭皮に合ったシャンプー選び、洗いすぎない適切な洗髪頻度、根元からしっかり乾かすドライヤーの使い方が、頭皮環境を整える基本とされています。",
  },
  "SH-03": {
    why: "髪の水分・油分バランスが乱れると、パサつきやダメージとして現れやすくなります。摩擦や乾燥などの外部ダメージの蓄積も一因とされています。",
    how: "タオルドライ時の摩擦を減らす、ドライヤーの熱を髪から離して当てる、帽子やUVスプレーでの紫外線対策が、髪のダメージを防ぐ基本とされています。",
  },
  "SH-04": {
    why: "髪のハリ・コシは毛髪内部のタンパク質構造や頭皮環境に左右されます。加齢とともにこれらが変化することで、髪の印象に影響が出やすくなると考えられています。",
    how: "タンパク質・ミネラルを意識したバランスの良い食事、ストレス管理、十分な睡眠が、髪の健康的な成長を支える生活習慣として知られています。",
  },

  "BS-01": {
    why: "からだの燃焼(代謝)は、食習慣・活動量・年齢など様々な要因に左右されると考えられています。日々の生活習慣を見直しながら、栄養面から手軽にサポートするという考え方もあります。",
    how: "適度な有酸素運動、間食のコントロール、十分な睡眠、こまめな水分補給が、からだの代謝を保つ基本的な生活習慣として知られています。",
  },
  "BS-02": {
    why: "手足のむくみは、長時間同じ姿勢が続くことや塩分・水分バランスなど、日々の生活習慣が影響しやすいと考えられています。生活習慣の見直しに加えて、栄養面からサポートするという考え方もあります。",
    how: "長時間同じ姿勢を避けてこまめに体を動かす、塩分を摂りすぎない、就寝前の軽いストレッチやマッサージが、むくみ対策の基本とされています。",
  },
  "BS-03": {
    why: "出産後の体型変化には、妊娠中のホルモンバランスの変化、骨盤まわりの筋力低下、育児による生活リズムの変化など、複数の要因が関わっていると考えられています。回復のペースには個人差があります。",
    how: "まずは医師の産後健診で体の回復状態を確認したうえで、無理のない範囲で軽い運動や骨盤底筋のケアを取り入れることが一般的に勧められています。急激なダイエットは避け、授乳中は栄養バランスにも配慮しましょう。",
  },
  "BS-04": {
    why: "筋肉量の維持・向上には、適度な運動に加えて、材料となるタンパク質を十分に摂取することが重要とされています。年齢とともに食事だけで必要量を摂りにくくなる場合もあり、栄養補助食品で手軽に補うという方法もあります。",
    how: "筋トレなどの運動習慣、運動後のタンパク質摂取、十分な休息(超回復)が、筋肉づくりの基本とされています。",
  },
  "BS-05": {
    why: "姿勢の乱れは、長時間同じ姿勢(デスクワーク・スマートフォン使用等)による筋力バランスの偏りや、体幹・背筋の筋力低下が関わっていると考えられています。",
    how: "こまめに姿勢を変える、肩甲骨まわりや体幹を意識したストレッチ・軽い筋トレ、椅子や画面の高さの見直しが、姿勢改善の基本として知られています。気になる場合は整体・理学療法士等の専門家に相談するのも一つの方法です。",
  },
  "BC-01": {
    why: "疲れやすさやだるさには、日々の栄養バランスや活動量に見合ったエネルギー補給、汗で失われるミネラルなど、様々な要因が関わっていると考えられています。基本的な栄養素に加え、活動量に応じた栄養補給を意識するという考え方もあります。",
    how: "規則正しい睡眠、バランスの良い食事、軽い運動習慣、こまめな水分・ミネラル補給が、日々の疲労回復を支える基本とされています。",
  },
  "BC-02": {
    why: "肩こり・腰痛は、長時間同じ姿勢による筋肉の緊張・血行不良、運動不足、冷えなどが関わっていると考えられています。",
    how: "こまめに姿勢を変える、肩や腰を温める、軽いストレッチや適度な運動を習慣にすることが、こり対策の基本とされています。痛みが強い・続く場合は整形外科等の受診をおすすめします。",
  },
  "BC-03": {
    why: "睡眠の質は、就寝前の光刺激(スマートフォン等)、生活リズムの乱れ、ストレス、カフェイン・アルコールの摂取タイミングなど、様々な要因に影響されると考えられています。",
    how: "就寝前のスマートフォン・PC使用を控える、毎日同じ時間に寝起きする、就寝前のカフェインを避ける、軽いストレッチや入浴で体をリラックスさせることが、睡眠の質を整える基本として知られています。",
  },
  "BC-04": {
    why: "お通じやお腹の調子は、食物繊維の摂取量や腸内環境のバランスに左右されると考えられています。食物繊維や乳酸菌を日々の食生活に取り入れることも一つの方法とされています。",
    how: "食物繊維・発酵食品を意識した食事、こまめな水分補給、適度な運動、規則正しい食事時間が、お腹の調子を整える基本とされています。",
  },
  "BC-05": {
    why: "気分の浮き沈みには、睡眠不足、生活リズムの乱れ、環境的なストレス、栄養バランスの偏りなど、様々な要因が関わっていると考えられています。",
    how: "十分な睡眠、軽い運動や日光浴、信頼できる人との会話、リラックスできる時間を意識的に作ることが、気分を整える基本として知られています。気分の落ち込みが長く続く場合は、心療内科・カウンセラー等の専門家への相談もご検討ください。",
  },
};

// 製品マスタ + 臨床データ要約 — claude_code_instructions.md 7節
const products = [
  {
    code: "TF-ESSENCE-PLUS",
    nameJp: "ageLOC トゥルー フェイス エッセンス プラス",
    nameUsRef: "ageLOC Tru Face Essence Ultra",
    category: "美容液(顔・首・デコルテ用)",
    priceJpy: 28768, // 2026-08-05、公式サイト(#03004293)で確認し修正(旧値12100は未確認の暫定値だった)
    hasAntiWrinkleTest: false,
    summary:
      "輪郭サイエンスに着目したファームプレックス ブレンドを配合。US版(Essence Ultra)のキー成分Ethocynは、3ヶ月間の使用(40〜77歳)でエラスチン含有量が平均166%増加し、18〜25歳相当の水準まで回復したとする海外の臨床データがある(参考情報)。CoQ10・緑茶抽出物等の抗酸化成分も配合。",
  },
  {
    code: "TF-FUTURE-SERUM",
    nameJp: "ageLOC トゥルー フェイス フューチャー セラム",
    nameUsRef: "ageLOC Tru Face Future Serum",
    category: "美容液(顔・首用)",
    priceJpy: 32123, // 2026-08-05、公式サイト(#03004260)で確認し修正(旧値13200は未確認の暫定値だった)
    hasAntiWrinkleTest: true,
    summary:
      "8つの年齢シグナル(ハリ、なめらかさ、うるおい等)にアプローチ。エンドウ豆・竹エキス・グルコサミンのブレンドがシワの見た目軽減とターンオーバー促進(5日間)に、明るさケア成分が色ムラの改善に寄与するという海外の研究知見がある(参考情報)。日本国内の抗シワ効能評価試験でも、乾燥による小ジワを目立たなくする効果を実証。",
  },
  {
    code: "TF-PEPTIDE-GEL",
    nameJp: "ageLOC トゥルー フェイス ペプタイド ジェル",
    nameUsRef: "ageLOC Tru Face Peptide Retinol Complex",
    category: "美容液(部分用)",
    priceJpy: 11387, // 2026-08-05、公式サイト(#03004263)で確認し修正(旧値9900は未確認の暫定値だった)
    hasAntiWrinkleTest: true,
    summary:
      "AI発見ペプチド技術と2種のレチノイド(安定化レチノール+レチノイン酸エステル)を配合。海外の8週間試験(35〜70歳・31名)では、97%が毛穴の引き締まりを、100%がシワの目立ちにくさ・ハリ感を実感したと報告されている(参考情報)。日本国内の抗シワ効能評価試験でも、乾燥による小ジワを目立たなくする効果を実証。",
  },
  {
    code: "TF-RICH-LAYER-CREAM",
    nameJp: "ageLOC トゥルー フェイス リッチ レイヤー クリーム",
    nameUsRef: "ageLOC Tru Face Uplifting Rich Cream",
    category: "クリーム",
    priceJpy: 11987, // 2026-08-05、公式サイト(#03004291)で確認し修正(旧値13750は未確認の暫定値だった)
    hasAntiWrinkleTest: false,
    summary:
      "リッチ レイヤー テクノロジーで肌表面に密着層を形成し、ハリ感をサポート。",
  },
  {
    code: "TF-REFINING-TONER",
    nameJp: "ageLOC トゥルー フェイス リファイニング トーナー",
    nameUsRef: "ageLOC Tru Face Refining Toner",
    category: "化粧水",
    priceJpy: 14157, // 2026-08-05、公式サイト(#03004500)で確認し修正(旧値6600は未確認の暫定値だった)
    hasAntiWrinkleTest: false,
    summary:
      "ageLOCメッセンジャーが角層深くまで素早く浸透。ポストバイオティクス配合で肌をなめらかに整える。",
  },
  {
    code: "TF-RADIANT-DAY-SPF22",
    nameJp: "ageLOC トゥルー フェイス レディアント デイ SPF22",
    nameUsRef: "ageLOC Tru Face Radiant Day",
    category: "乳液(SPF付き)",
    priceJpy: 9589, // 2026-08-05、公式サイト(#03004268)で確認し修正(旧値9350は未確認の暫定値だった)
    hasAntiWrinkleTest: false,
    summary:
      "SPF22・PA++の紫外線防御(UVA/UVBブロードスペクトラム)と保湿を両立。海外データでは、配合成分がターンオーバーを85%促進し、小ジワ・シワの見た目を45%軽減したと報告されている(参考情報)。",
  },
  {
    code: "LUMISPA-IO",
    nameJp: "ageLOC ルミスパ iO スターターキット",
    nameUsRef: "ageLOC LumiSpa iO",
    category: "美容機器",
    priceJpy: 44769, // 2026-08-05、公式サイト(#03137325 ノーマル)で確認し修正(旧値27500は未確認の暫定値だった)
    hasAntiWrinkleTest: false,
    summary:
      "特許技術のMicropulse Oscillationにより、洗浄+肌質改善(なめらかさ・毛穴等)を実現。",
  },
  {
    code: "SCALP-HAIR-SERUM",
    nameJp: "ageLOC ニュートリオール スカルプ&ヘアー セラム",
    nameUsRef: "ageLOC Nutriol Scalp & Hair Serum",
    category: "ヘアケア",
    priceJpy: 8575, // 2026-08-05、公式サイト(catalog/jp/ja/product/03002149)で確認し修正(旧値11000は未確認の暫定値だった)
    hasAntiWrinkleTest: false,
    summary:
      "男女兼用、頭皮・頭髪のためのスプレータイプ美容液(洗い流し不要)。海外のNutriolシステム(シャンプー・コンディショナー・頭皮美容液)の6ヶ月間臨床試験(30〜70歳・52名)では、髪の太さ+67%、ボリューム+107%、ブラッシング時の切れ毛-72%という変化が報告されている(参考情報、ガルバニック美容機器併用時のデータ)。朝晩2回のお手入れで髪のハリ・コシをケアする。",
  },
  // TRME(ボディマネジメント サプリメント) — 2026-08-05、公式サイト(nuskin.com/catalog/jp/ja/product/…)より正確な製品名・価格・製品概要を確認して登録
  {
    code: "TRME-SMOOTHIE-BANANA",
    nameJp: "TRME スムージー バナナ風味",
    nameUsRef: undefined,
    category: "サプリメント",
    priceJpy: 8820,
    hasAntiWrinkleTest: false,
    summary:
      "筋肉に着目したタンパク質サプリメント。1回あたりロイシン1,500mgを含むタンパク質10gに加え、ビタミン11種類・ミネラル11種類・食物繊維・タルトチェリー粉末を配合。粉末を水や牛乳に溶かして手軽に栄養補給できる。",
  },
  {
    code: "TRME-WINNING-START",
    nameJp: "TRME ウィニングスタート",
    nameUsRef: undefined,
    category: "サプリメント",
    priceJpy: 19089,
    hasAntiWrinkleTest: false,
    summary:
      "15日間集中して続ける、燃焼に着目したカプセルタイプのサプリメント。燃焼サポートブレンド(ハーブ3種)とウチワサボテン果実粉末を配合し、TRME開始・再開時の燃えやすいカラダづくりをサポートする。TRME バーニングフォーカスとは同日に摂取しないこと。",
  },
  {
    code: "TRME-BURNING-FOCUS",
    nameJp: "TRME バーニングフォーカス",
    nameUsRef: undefined,
    category: "サプリメント",
    priceJpy: 21747,
    hasAntiWrinkleTest: false,
    summary:
      "毎日続ける、燃焼に着目したカプセルタイプのサプリメント。燃焼サポートブレンド(モリンガ葉・カレーリーフ・ターメリック抽出物のハーブブレンド)を配合。TRME ウィニングスタートとは同日に摂取しないこと。",
  },
  {
    code: "TRME-GLUCOEDGE",
    nameJp: "TRME グルコエッジ",
    nameUsRef: undefined,
    category: "サプリメント",
    priceJpy: 23398,
    hasAntiWrinkleTest: false,
    summary:
      "糖質に着目した、水に溶かして飲むスティックタイプのサプリメント。桑の葉抽出物とグァーガムのダブルサポートブレンドが糖質にアプローチ。クセのない味わいで食事の前にも飲みやすい。",
  },
  {
    code: "TRME-CRAVEWIN",
    nameJp: "TRME クレイブウィン",
    nameUsRef: undefined,
    category: "サプリメント",
    priceJpy: 15222,
    hasAntiWrinkleTest: false,
    summary:
      "食欲に着目したカプセルタイプのサプリメント。サフラン抽出物・ビタミンD・ビタミンB6のブレンドが食欲をケアし、間食の誘惑に負けない気持ちをサポートする。",
  },
  // Pharmanex(健康食品) — 2026-08-05、公式サイトより確認して登録
  {
    code: "LIFEPAK",
    nameJp: "ライフパック",
    nameUsRef: "LifePak",
    category: "サプリメント",
    priceJpy: 7801,
    hasAntiWrinkleTest: false,
    summary:
      "健康維持・増進に必要なビタミン11種、ミネラル5種に加え、緑茶葉抽出物やアセロラ・チェリー抽出物などの植物性成分を配合した基本サプリメント。1995年から日本人の食生活・栄養状態を検証して開発。",
  },
  {
    code: "TRME-GO-OVERDRIVE",
    nameJp: "TRME GO オーバードライブ",
    nameUsRef: undefined,
    category: "サプリメント",
    priceJpy: 6916,
    hasAntiWrinkleTest: false,
    summary:
      "運動や仕事・家事など、熱中して頑張るカラダの栄養補給に向けたサプリメント。汗で失われる電解質(海水塩・マグネシウム)やビタミンB群など9種のビタミンを配合。アンチ・ドーピング認証(インフォームドチョイス)取得。",
  },
  {
    code: "GREENPRO",
    nameJp: "グリーン プロ",
    nameUsRef: undefined,
    category: "サプリメント",
    priceJpy: 8919,
    hasAntiWrinkleTest: false,
    summary:
      "食物繊維が豊富な国産大麦若葉と、生きたまま腸まで届く有胞子性乳酸菌(1日分1億個)を配合したサプリメント。宇治抹茶入り緑茶エキスをブレンドし、飲みやすさにもこだわった粉末タイプ。",
  },
  {
    code: "AGELOC-R2",
    nameJp: "アールスクエア(ReNEW + ReCHARGE)",
    nameUsRef: "ageLOC R2",
    category: "サプリメント",
    priceJpy: 20879,
    hasAntiWrinkleTest: false,
    summary:
      "「キレイ×パワー」をテーマにした2製品セットのサプリメント。ReNEWはオリーブ葉・ブラッドオレンジ・マリアアザミ・ブドウ種子・コエンザイムQ10などの抗酸化成分を、ReCHARGEは冬虫夏草・ザクロ・紅蔘(紅参)抽出物を配合。",
  },
  {
    code: "YOUTHSPAN-R",
    nameJp: "ユーススパン R",
    nameUsRef: "YouthSpan R",
    category: "サプリメント",
    priceJpy: 25055,
    hasAntiWrinkleTest: false,
    summary:
      "トランス型レスベラトロールを中心に、DHA・EPAなど12種の成分からなるageLOCブレンドを配合したサプリメント。個包装のソフトカプセルで1日2回摂取する設計。アンチ・ドーピング認証取得。",
  },
  {
    code: "META",
    nameJp: "メタ",
    nameUsRef: undefined,
    category: "サプリメント",
    priceJpy: 25055,
    hasAntiWrinkleTest: false,
    summary:
      "「脂」「糖」「悪玉菌」など気になる生活習慣の蓄積にアプローチする、ageLOC アントシアニン ブレンド配合のサプリメント。カシス・ビルベリー・黒米抽出物からシアニジン・デルフィニジンを高配合。",
  },
  {
    code: "MYND360-MINDFULL",
    nameJp: "MYND360 マインド フル",
    nameUsRef: undefined,
    category: "サプリメント",
    priceJpy: 15135,
    hasAntiWrinkleTest: false,
    summary:
      "機能性表示食品。アスタキサンチンを中心に、ブドウ抽出物・ビタミンEを組み合わせたソフトジェル。健常な中高年者の加齢によって低下する認知機能の一部(視覚的な記憶力・判断力)の維持に役立つ機能が報告されている。",
  },
  // 美容機器(ageLOC ガルバニック スパ / ageLOC ブースト) — 2026-08-05、公式サイトより確認して登録
  {
    code: "AGELOC-GALVANIC-SPA",
    nameJp: "ageLOC ガルバニック スパ",
    nameUsRef: "ageLOC Galvanic Spa",
    category: "美容機器",
    priceJpy: 45320,
    hasAntiWrinkleTest: false,
    summary:
      "ガルバニック電流により専用製品の成分を肌に届ける美容機器。フェイス・スポット・ボディ・スカルプの4種のコンダクターを付け替えることで、1台でサロンレベルのトリートメントが行える。",
  },
  {
    code: "GALVANIC-FACIAL-GEL",
    nameJp: "ageLOC ガルバニック スパ フェイシャル ジェル",
    nameUsRef: undefined,
    category: "美容機器",
    priceJpy: 7091,
    hasAntiWrinkleTest: false,
    summary:
      "ageLOC ガルバニック スパ専用のフェイス用ジェル。ガルバニック電流により成分を角層に届け、なめらかでハリ感のある肌へ導く。",
  },
  {
    code: "GALVANIC-BODY-GEL",
    nameJp: "ageLOC ガルバニック ボディ ジェル",
    nameUsRef: undefined,
    category: "ボディケア",
    priceJpy: 8595,
    hasAntiWrinkleTest: false,
    summary:
      "ageLOC ガルバニック スパ(ボディ コンダクター)専用のボディ用ジェル。ガルバニック電流により成分を角層に届け、ハリのあるなめらかなボディへ導く。",
  },
  {
    code: "DERMATIC-EFFECTS",
    nameJp: "ageLOC ダーマティック エフェクツ",
    nameUsRef: "ageLOC Dermatic Effects",
    category: "ボディケア",
    priceJpy: 8595,
    hasAntiWrinkleTest: false,
    summary:
      "肌をなめらかにしハリを高めるボディミルク。ageLOC ガルバニック ボディ スパ等のトリートメント後に使うことでその効果をキープするほか、単品でも毎日のボディケアとして使用できる。",
  },
  {
    code: "AGELOC-BOOST-STARTER",
    nameJp: "ageLOC ブースト スターターキット",
    nameUsRef: "ageLOC Boost",
    category: "美容機器",
    priceJpy: 42530,
    hasAntiWrinkleTest: false,
    summary:
      "Vパルス微弱電流テクノロジーと専用美容液(ageLOCブレンド)により肌を活気づける、軽量・簡単スワイプ操作の美顔器スターターセット(本体+ブライトトリートメント美容液)。",
  },
  {
    code: "TS-SCALP-ESSENCE",
    nameJp: "ニュースキン ティ・エス スカルプ 薬用エッセンス XVII",
    nameUsRef: undefined,
    category: "ヘアケア",
    priceJpy: 18714,
    hasAntiWrinkleTest: false,
    summary:
      "医薬部外品(育毛剤)。発毛促進・薄毛や抜け毛の予防・育毛や養毛・髪にボリューム感を与える等の効能が認められている。17型コラーゲンに着目したマヨラナエキス等を配合し、男女兼用で使用できる。",
  },
] as const;

// 製品コード → US公式サイト(nuskin.com/us/en)のProduct Information Page等、
// 臨床データの出典として引用したページ・PDF。2026-08-05にResourcesから直接確認。
// (productSourceUrlsは「購入ページ」、こちらは「臨床データの引用元」で役割を分けている)
const clinicalSourceUrls: Record<string, string> = {
  "TF-ESSENCE-PLUS": "https://www.nuskin.com/dam/global/library/pdf/products/tf_essence_ultra_pip.pdf",
  "TF-FUTURE-SERUM":
    "https://www.nuskin.com/content/dam/office/n_america/shared/en/nuskin_products/ageloc_future_serum_pip.pdf",
  "TF-PEPTIDE-GEL":
    "https://www.nuskin.com/content/dam/office/pacific_new/shared/en/pips/targeted-solutions/ageLOC-Tru-Face-Peptide-Retinol-Complex-PIP.pdf",
  "TF-RADIANT-DAY-SPF22":
    "https://www.nuskin.com/content/dam/office/n_america/US/en/nuskin_products/us-pip_radiant_day.pdf",
  "SCALP-HAIR-SERUM":
    "https://www.nuskin.com/content/dam/sea/ph/Documents/PIP/PH-ageLOC-Nutriol-Hair-and-Scalp-GS-Clinical-Bulletin.pdf",
};

// 製品コード → 公式サイトの製品ページURL(出典URL)。すべて2026-08-05に公式サイトで確認。
const productSourceUrls: Record<string, string> = {
  "TRME-SMOOTHIE-BANANA": "https://www.nuskin.com/catalog/jp/ja/product/03002990",
  "TRME-WINNING-START": "https://www.nuskin.com/catalog/jp/ja/product/03002525",
  "TRME-BURNING-FOCUS": "https://www.nuskin.com/catalog/jp/ja/product/03002537",
  "TRME-GLUCOEDGE": "https://www.nuskin.com/catalog/jp/ja/product/03002535",
  "TRME-CRAVEWIN": "https://www.nuskin.com/catalog/jp/ja/product/03002536",
  LIFEPAK: "https://www.nuskin.com/catalog/jp/ja/product/03003088",
  "TRME-GO-OVERDRIVE": "https://www.nuskin.com/catalog/jp/ja/product/03004306",
  GREENPRO: "https://www.nuskin.com/content/markets/ja_JP/home/updates_info/product_info_top/greenpro.html",
  "AGELOC-R2": "https://www.nuskin.com/content/markets/ja_JP/home/updates_info/product_info_top/r2_single.html",
  "YOUTHSPAN-R": "https://www.nuskin.com/content/markets/ja_JP/home/updates_info/product_info_top/youthspan-info.html",
  META: "https://www.nuskin.com/content/markets/ja_JP/home/updates_info/product_info_top/meta.html",
  "MYND360-MINDFULL": "https://www.nuskin.com/content/markets/ja_JP/home/updates_info/product_info_top/mind-full.html",
  "AGELOC-GALVANIC-SPA": "https://www.nuskin.com/catalog/jp/ja/product/03310060",
  "GALVANIC-FACIAL-GEL": "https://www.nuskin.com/catalog/jp/ja/product/03001876",
  "GALVANIC-BODY-GEL": "https://www.nuskin.com/catalog/jp/ja/product/03003902",
  "DERMATIC-EFFECTS": "https://www.nuskin.com/catalog/jp/ja/product/03003903",
  "AGELOC-BOOST-STARTER": "https://www.nuskin.com/catalog/jp/ja/product/03001951",
  "SCALP-HAIR-SERUM": "https://www.nuskin.com/catalog/jp/ja/product/03002149",
  "TF-ESSENCE-PLUS": "https://www.nuskin.com/catalog/jp/ja/product/03004293",
  "TF-FUTURE-SERUM": "https://www.nuskin.com/catalog/jp/ja/product/03004260",
  "TF-PEPTIDE-GEL": "https://www.nuskin.com/catalog/jp/ja/product/03004263",
  "TF-RICH-LAYER-CREAM": "https://www.nuskin.com/catalog/jp/ja/product/03004291",
  "TF-REFINING-TONER": "https://www.nuskin.com/catalog/jp/ja/product/03004500",
  "TF-RADIANT-DAY-SPF22": "https://www.nuskin.com/catalog/jp/ja/product/03004268",
  "LUMISPA-IO": "https://www.nuskin.com/content/markets/ja_JP/topnav-product-lines/ageloc/lumispa/lumispaio.html",
  "TS-SCALP-ESSENCE": "https://www.nuskin.com/catalog/jp/ja/product/03102895",
};

// カテゴリ×製品(優先度)。ボディライン・体型づくり/からだの不調は対応製品データが無いため空(準備中)。
const concernProductMap: Record<string, { code: string; priority: number }[]> = {
  "FS-01": [
    { code: "TF-ESSENCE-PLUS", priority: 1 },
    { code: "TF-RICH-LAYER-CREAM", priority: 2 },
    { code: "TF-FUTURE-SERUM", priority: 3 },
    { code: "TF-PEPTIDE-GEL", priority: 4 },
    { code: "AGELOC-GALVANIC-SPA", priority: 5 },
    { code: "GALVANIC-FACIAL-GEL", priority: 6 },
    { code: "AGELOC-BOOST-STARTER", priority: 7 },
  ],
  "FS-02": [
    { code: "TF-REFINING-TONER", priority: 1 },
    { code: "LUMISPA-IO", priority: 2 },
  ],
  "FS-03": [
    { code: "TF-RICH-LAYER-CREAM", priority: 1 },
    { code: "TF-RADIANT-DAY-SPF22", priority: 2 },
  ],
  "FS-04": [
    { code: "TF-RADIANT-DAY-SPF22", priority: 1 },
    { code: "TF-FUTURE-SERUM", priority: 2 },
  ],
  "FS-05": [],

  // 薄毛・抜け毛/ボリュームは医薬部外品のTS スカルプ(発毛促進等が認められた効能)を優先。
  "SH-01": [
    { code: "TS-SCALP-ESSENCE", priority: 1 },
    { code: "SCALP-HAIR-SERUM", priority: 2 },
  ],
  "SH-02": [{ code: "SCALP-HAIR-SERUM", priority: 1 }],
  "SH-03": [{ code: "SCALP-HAIR-SERUM", priority: 1 }],
  "SH-04": [
    { code: "TS-SCALP-ESSENCE", priority: 1 },
    { code: "SCALP-HAIR-SERUM", priority: 2 },
  ],

  // ボディライン・体型づくり: TRME(ボディマネジメント サプリメント)を紐付け。
  // 「産後に体型が戻らない」「姿勢を改善したい」は公式の製品説明に対応する訴求が無いため、
  // 誤解を招く効能訴求を避けて空欄(準備中)のままにしている。
  "BS-01": [
    { code: "TRME-BURNING-FOCUS", priority: 1 },
    { code: "TRME-WINNING-START", priority: 2 },
    { code: "TRME-GLUCOEDGE", priority: 3 },
    { code: "TRME-CRAVEWIN", priority: 4 },
    { code: "GALVANIC-BODY-GEL", priority: 5 },
    { code: "DERMATIC-EFFECTS", priority: 6 },
  ],
  "BS-02": [{ code: "TRME-WINNING-START", priority: 1 }],
  "BS-03": [],
  "BS-04": [{ code: "TRME-SMOOTHIE-BANANA", priority: 1 }],
  "BS-05": [],
  // からだの不調: Pharmanexサプリメントを紐付け。
  // 「肩こり・腰痛などのこり」「睡眠の質」「気分の浮き沈み・ストレス」は公式の製品説明に
  // 対応する訴求が無いため、誤解を招く効能訴求を避けて空欄(準備中)のままにしている。
  "BC-01": [
    { code: "TRME-GO-OVERDRIVE", priority: 1 },
    { code: "LIFEPAK", priority: 2 },
    { code: "AGELOC-R2", priority: 3 },
  ],
  "BC-02": [],
  "BC-03": [],
  "BC-04": [{ code: "GREENPRO", priority: 1 }],
  "BC-05": [],
};

async function main() {
  console.log("ジャンルを投入中...");
  for (const g of genres) {
    await prisma.genre.upsert({
      where: { genreId: g.genreId },
      update: { name: g.name, sortOrder: g.sortOrder },
      create: g,
    });
  }

  console.log("カテゴリ(症状)を投入中...");
  for (const c of categories) {
    await prisma.concernCategory.upsert({
      where: { categoryId: c.categoryId },
      update: { name: c.name, sortOrder: c.sortOrder, genreId: c.genreId },
      create: c,
    });
  }

  console.log("一般知識(Why/How)を投入中...");
  for (const categoryId of Object.keys(categoryContent)) {
    const { why, how } = categoryContent[categoryId];
    const existing = await prisma.generalKnowledge.findFirst({ where: { categoryId } });
    if (!existing) {
      await prisma.generalKnowledge.create({
        data: { categoryId, contentText: why, selfCareText: how, isSourceVerified: false },
      });
    } else if (existing.contentText !== why || existing.selfCareText !== how) {
      // seed.ts側の内容が変われば追従させる(product_concern_mapと同じ方針)。
      // /admin/knowledge での手動編集は、再シード時に上書きされる可能性がある点に注意。
      await prisma.generalKnowledge.update({
        where: { knowledgeId: existing.knowledgeId },
        data: { contentText: why, selfCareText: how },
      });
    }
  }

  console.log("製品・臨床データを投入中...");
  const productIdByCode = new Map<string, number>();
  for (const p of products) {
    const sourceUrl = productSourceUrls[p.code] ?? "https://www.nuskin.com/";
    const product = await prisma.product.upsert({
      where: { productCode: p.code },
      update: {
        nameJp: p.nameJp,
        nameUsRef: p.nameUsRef,
        category: p.category,
        priceJpy: p.priceJpy,
        productUrl: sourceUrl,
        isActive: true,
      },
      create: {
        productCode: p.code,
        nameJp: p.nameJp,
        nameUsRef: p.nameUsRef,
        category: p.category,
        priceJpy: p.priceJpy,
        productUrl: sourceUrl,
        isActive: true,
      },
    });
    productIdByCode.set(p.code, product.productId);

    // 「科学的根拠」リンクは実際の臨床データ引用元(clinicalSourceUrls)がある製品のみに限定する。
    // 購入ページ(productSourceUrls)を根拠リンクとして代用しない(誤解を招くため)。
    const clinicalUrl = clinicalSourceUrls[p.code] ?? null;
    const verifiedAt = clinicalSourceUrls[p.code] ? new Date("2026-08-05") : undefined;
    await prisma.productClinicalData.upsert({
      where: { productId: product.productId },
      update: {
        summaryText: p.summary,
        hasAntiWrinkleTest: p.hasAntiWrinkleTest,
        sourceUrl: clinicalUrl,
        ...(verifiedAt ? { lastVerifiedAt: verifiedAt } : {}),
      },
      create: {
        productId: product.productId,
        summaryText: p.summary,
        hasAntiWrinkleTest: p.hasAntiWrinkleTest,
        sourceUrl: clinicalUrl,
        lastVerifiedAt: verifiedAt,
      },
    });
  }

  console.log("カテゴリ×製品マッピングを投入中...");
  for (const categoryId of Object.keys(concernProductMap)) {
    for (const entry of concernProductMap[categoryId]) {
      const productId = productIdByCode.get(entry.code)!;
      const existing = await prisma.productConcernMap.findFirst({
        where: { categoryId, productId },
      });
      if (!existing) {
        await prisma.productConcernMap.create({
          data: { categoryId, productId, priority: entry.priority },
        });
      } else if (existing.priority !== entry.priority) {
        // seed.ts側で優先順位を変更した場合、DBの値も追従させる。
        // (/admin/mapping で手動調整された優先順位は、このcodeの値と一致していれば影響なし)
        await prisma.productConcernMap.update({
          where: { mapId: existing.mapId },
          data: { priority: entry.priority },
        });
      }
    }
  }

  console.log("質問(②基本情報)を投入中...");
  const q1Age = await getOrCreateQuestion(1, "年代を教えてください", QuestionType.single_select, null, "age");
  await getOrCreateOptions(q1Age.questionId, ["20代", "30代", "40代", "50代以上"]);

  const q1Gender = await getOrCreateQuestion(1, "性別を教えてください", QuestionType.single_select, null, "gender");
  await getOrCreateOptions(q1Gender.questionId, ["女性", "男性", "回答しない"]);

  console.log("質問(ライフスタイル、2026-08-09追加)を投入中...");
  const q2SkincareRoutine = await getOrCreateQuestion(
    2,
    "普段のスキンケアについて教えてください",
    QuestionType.single_select,
    null,
    "skincare_routine"
  );
  await getOrCreateOptions(q2SkincareRoutine.questionId, [
    "特に何もしていない",
    "洗顔・保湿など基本的なケアのみ",
    "美容液やパックなど、部分的なケアも取り入れている",
    "美顔器などの美容機器も使ってしっかりケアしている",
    "エステ・サロンなど専門的なケアも受けている",
  ]);

  const q2SkincareBudget = await getOrCreateQuestion(
    2,
    "スキンケアにかけている月々の費用の目安を教えてください",
    QuestionType.single_select,
    null,
    "skincare_budget"
  );
  await getOrCreateOptions(q2SkincareBudget.questionId, [
    "3,000円未満",
    "3,000円〜10,000円未満",
    "10,000円〜30,000円未満",
    "30,000円〜50,000円未満",
    "50,000円以上",
  ]);

  const q2SkincarePriority = await getOrCreateQuestion(
    2,
    "スキンケア製品を選ぶときに、特に重視することを教えてください",
    QuestionType.multi_select,
    null,
    "skincare_priority"
  );
  await getOrCreateOptions(q2SkincarePriority.questionId, [
    "価格の手頃さ",
    "効果・実感のしやすさ",
    "科学的根拠・成分の信頼性",
    "口コミ・評判",
    "ブランド・企業への信頼",
  ]);

  const q2SupplementUsage = await getOrCreateQuestion(
    2,
    "普段のサプリメント摂取について教えてください",
    QuestionType.single_select,
    null,
    "supplement_usage"
  );
  await getOrCreateOptions(q2SupplementUsage.questionId, [
    "摂取していない",
    "市販のマルチビタミン等を摂取している",
    "美容系サプリ(コラーゲン等)を摂取している",
    "ニュースキンのサプリメントを摂取している",
    "複数のサプリメントを組み合わせて摂取している",
  ]);

  const q2SupplementBudget = await getOrCreateQuestion(
    2,
    "サプリメントにかけている月々の費用の目安を教えてください",
    QuestionType.single_select,
    null,
    "supplement_budget"
  );
  await getOrCreateOptions(q2SupplementBudget.questionId, [
    "3,000円未満",
    "3,000円〜10,000円未満",
    "10,000円〜30,000円未満",
    "30,000円〜50,000円未満",
    "50,000円以上",
  ]);

  const q2SupplementPriority = await getOrCreateQuestion(
    2,
    "サプリメントを選ぶときに、特に重視することを教えてください",
    QuestionType.multi_select,
    null,
    "supplement_priority"
  );
  await getOrCreateOptions(q2SupplementPriority.questionId, [
    "価格の手頃さ",
    "効果・実感のしやすさ",
    "科学的根拠・成分の信頼性",
    "口コミ・評判",
    "ブランド・企業への信頼",
  ]);

  console.log("質問(症状の継続期間、v10追加)を投入中...");
  // 症状カテゴリごとに1問ずつ繰り返し聞く共通質問(parentCategoryIdは持たない)。
  // step:3はmapping画面の「選択肢ごとの製品指定」(parentCategoryId必須)で既に使われているため、
  // 混同を避けるためstep:4とする。
  const q4Duration = await getOrCreateQuestion(
    4,
    "その症状は、いつ頃から気になっていますか?",
    QuestionType.single_select,
    null,
    "symptom_duration"
  );
  await getOrCreateOptions(q4Duration.questionId, [
    "最近気になり始めた",
    "少し前から",
    "半年以上前から",
    "数年前から",
    "かなり前から(ずっと)",
  ]);

  console.log("管理者アカウントを投入中...");
  const existingAdmin = await prisma.adminUser.findUnique({ where: { username: "admin" } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        username: "admin",
        passwordHash: await hashPassword(process.env.ADMIN_PASSWORD || "changeme"),
        role: "admin",
      },
    });
  }

  console.log("サイト文言(SiteContent)を投入中...");
  for (const c of siteContentDefaults) {
    const existing = await prisma.siteContent.findUnique({ where: { key: c.key } });
    if (!existing) {
      await prisma.siteContent.create({ data: c });
    }
  }

  console.log("デザイン設定・LINE設定・お手入れステップ順を投入中...");
  await prisma.designSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, primaryColorHex: "#e11d48", buttonStyle: "rounded-full" },
  });

  await prisma.lineSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      lineUrl: process.env.NEXT_PUBLIC_LINE_URL || "https://line.me/",
      buttonText: "LINEで相談する",
    },
  });

  const careStepKeywords = ["化粧水", "美容液(部分用)", "美容液", "クリーム", "乳液"];
  for (let i = 0; i < careStepKeywords.length; i++) {
    const existing = await prisma.careStepOrder.findFirst({ where: { keyword: careStepKeywords[i], categoryId: null } });
    if (!existing) {
      await prisma.careStepOrder.create({ data: { keyword: careStepKeywords[i], sortOrder: i } });
    }
  }

  console.log("FAQ初期データを投入中...");
  for (let i = 0; i < faqDefaults.length; i++) {
    const existing = await prisma.fAQItem.findFirst({ where: { question: faqDefaults[i].question } });
    if (!existing) {
      await prisma.fAQItem.create({ data: { ...faqDefaults[i], category: "product", sortOrder: i } });
    }
  }

  console.log("シード完了");
}

// 管理画面の本格CMS化(2026-08-06)に伴う初期パスワードハッシュ生成用。
// src/lib/admin-auth.ts と同じロジック(Web Crypto SHA-256)をここでも保持している
// (seed.tsはNext.jsのモジュール解決を経由しないスタンドアロン実行のため)。
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// TOP画面・診断ウィザード・結果画面の文言の初期値。
// {genre} のようなプレースホルダーは呼び出し側で置換して使う。
const siteContentDefaults: { key: string; page: string; label: string; value: string }[] = [
  { key: "home.badge", page: "home", label: "上部バッジ", value: "ageLOC 肌・髪・からだ診断" },
  { key: "home.heading_line1", page: "home", label: "見出し1行目", value: "あなたに、" },
  { key: "home.heading_line2", page: "home", label: "見出し2行目", value: "根拠のあるご提案を。" },
  {
    key: "home.intro",
    page: "home",
    label: "紹介文",
    value: "いくつかの質問にお答えいただくと、肌・髪・からだの変化に合わせたケアの考え方とおすすめの製品をご案内します。",
  },
  { key: "home.step1", page: "home", label: "ステップ1", value: "簡単な質問に答える(所要時間 約1分)" },
  { key: "home.step2", page: "home", label: "ステップ2", value: "科学的データにもとづくご提案を確認" },
  { key: "home.step3", page: "home", label: "ステップ3", value: "気になれば、個別にLINEでご相談" },
  { key: "home.cta_button", page: "home", label: "診断開始ボタン", value: "診断をはじめる" },
  {
    key: "home.footer_note",
    page: "home",
    label: "フッター注記",
    value: "会員登録は不要です。匿名でご利用いただけます。",
  },
  { key: "home.background_image_url", page: "home", label: "背景画像URL(任意)", value: "" },
  { key: "diagnosis.background_image_url", page: "diagnosis", label: "背景画像URL(任意)", value: "" },
  { key: "result.background_image_url", page: "result", label: "背景画像URL(任意)", value: "" },
  { key: "privacy.background_image_url", page: "privacy", label: "背景画像URL(任意)", value: "" },
  { key: "faq.background_image_url", page: "faq", label: "背景画像URL(任意)", value: "" },

  { key: "diagnosis.step1_label", page: "diagnosis", label: "進捗ラベル(Step1)", value: "Step 1/4・基本情報" },
  {
    key: "diagnosis.step1_heading",
    page: "diagnosis",
    label: "Step1見出し",
    value: "まずは基本的なことを教えてください",
  },
  { key: "diagnosis.age_label", page: "diagnosis", label: "年代ラベル", value: "年代" },
  { key: "diagnosis.gender_label", page: "diagnosis", label: "性別ラベル", value: "性別" },
  { key: "diagnosis.lifestyle_label", page: "diagnosis", label: "進捗ラベル(ライフスタイル)", value: "Step 2/4・ライフスタイル" },
  {
    key: "diagnosis.lifestyle_heading",
    page: "diagnosis",
    label: "ライフスタイルStep見出し",
    value: "普段のケア習慣について教えてください",
  },
  {
    key: "diagnosis.lifestyle_intro",
    page: "diagnosis",
    label: "ライフスタイルStep案内文",
    value: "今後のご提案の参考にするため、すべての質問にお答えください。",
  },
  { key: "diagnosis.step2_label", page: "diagnosis", label: "進捗ラベル(Step2)", value: "Step 3/4・気になること" },
  {
    key: "diagnosis.step2_heading",
    page: "diagnosis",
    label: "Step2見出し",
    value: "今、気になることはどれですか?",
  },
  { key: "diagnosis.multi_select_hint", page: "diagnosis", label: "複数選択の注記", value: "いくつでも選択できます" },
  { key: "diagnosis.next_button", page: "diagnosis", label: "次へボタン", value: "次へ" },
  {
    key: "diagnosis.symptom_heading_template",
    page: "diagnosis",
    label: "Step3見出し({genre}がジャンル名に置換されます)",
    value: "「{genre}」について、気になる症状は?",
  },
  {
    key: "diagnosis.duration_heading_template",
    page: "diagnosis",
    label: "継続期間の質問見出し({category}が症状名、{question}が質問文に置換されます、v10追加)",
    value: "「{category}」について、{question}",
  },
  { key: "diagnosis.submit_button", page: "diagnosis", label: "診断結果を見るボタン", value: "診断結果を見る" },
  {
    key: "diagnosis.loading_text",
    page: "diagnosis",
    label: "診断結果作成中の表示",
    value: "診断結果を作成しています...",
  },

  { key: "result.eyebrow", page: "result", label: "上部ラベル", value: "改善策の提案" },
  { key: "result.heading", page: "result", label: "見出し", value: "あなたに合わせたご提案" },
  { key: "result.summary_label", page: "result", label: "診断結果サマリーのラベル", value: "今回の診断結果" },
  { key: "result.why_label", page: "result", label: "原因(Why)のラベル", value: "なぜ起こる?" },
  { key: "result.how_label", page: "result", label: "改善方法(How)のラベル", value: "まずできること" },
  { key: "result.support_label", page: "result", label: "製品(Support)のラベル", value: "それを補完するアイテム" },
  {
    key: "result.support_empty",
    page: "result",
    label: "製品未登録時の案内文",
    value: "この症状に対応するご提案は現在準備中です。LINEで個別にご相談ください。",
  },
  { key: "result.care_steps_heading", page: "result", label: "お手入れステップ見出し", value: "おすすめのお手入れステップ" },
  {
    key: "result.cta_intro",
    page: "result",
    label: "LINE CTA導入文",
    value: "あなたの状態をふまえて、さらに詳しくご相談いただけます。",
  },
  { key: "result.back_to_top", page: "result", label: "トップに戻るリンク", value: "トップに戻る" },

  { key: "privacy.heading", page: "privacy", label: "見出し", value: "プライバシーポリシー" },
  {
    key: "privacy.intro",
    page: "privacy",
    label: "導入文",
    value:
      "本サービス(ageLOC 肌・髪・からだ診断)は会員登録不要・匿名でご利用いただけます。氏名・住所・電話番号・メールアドレス等の個人を特定できる情報の入力を求めることはありません。",
  },
  {
    key: "privacy.collected_data",
    page: "privacy",
    label: "取得する情報",
    value:
      "診断の過程でお答えいただいた内容(年代・性別・気になる項目)と、診断結果ページの表示日時のみを記録します。これらの回答内容から個人を特定することはできません。",
  },
  {
    key: "privacy.data_usage",
    page: "privacy",
    label: "利用目的",
    value:
      "記録した回答内容は、個人を特定しない形に集計したうえで、サービス内容の改善・提案精度の向上を目的として社内で利用します。第三者への提供や、個人を特定する目的での利用は行いません。",
  },
  {
    key: "privacy.line_note",
    page: "privacy",
    label: "LINEでのご相談について",
    value:
      "結果画面からLINE公式アカウントでのご相談に進まれた場合、LINE上でのやり取りは弊社のLINE公式アカウント運用ルールおよびLINE社のプライバシーポリシーに従って取り扱われます。",
  },
  {
    key: "privacy.contact",
    page: "privacy",
    label: "お問い合わせ先",
    value: "本ポリシーに関するお問い合わせは【運営者名・連絡先を管理画面(ページ文言管理)から設定してください】までご連絡ください。",
  },
  {
    key: "privacy.updated_at",
    page: "privacy",
    label: "制定日・最終更新日",
    value: "制定日: 【日付を設定してください】",
  },
];

// FAQ初期データ(製品についてのFAQ)。出典: ニュースキン公式サイト(返品・交換、ADP定期購入ページ等)。
// 2026-08-09追加(v5指示書1)。サイト固有FAQは運営者が管理画面から追加する空枠のため、ここには含めない。
const faqDefaults: { question: string; answer: string }[] = [
  {
    question: "効果はどれくらいで実感できますか?",
    answer:
      "感じ方には個人差があり、お肌やお身体の状態、製品の種類によっても異なります。効果を保証するものではなく、まずは継続してお使いいただくことをおすすめします。気になる点があれば、LINEでご相談ください。",
  },
  {
    question: "他のサプリメントや化粧品と併用しても大丈夫ですか?",
    answer:
      "基本的には他の製品と併用いただけますが、持病の治療中の方・お薬を服用中の方は、事前にかかりつけの医師にご相談ください。スキンケア製品は、初めてお使いになる際にパッチテストを行うと安心です。",
  },
  {
    question: "妊娠中・授乳中でも使えますか?",
    answer: "製品や個人の体調によって異なりますので、妊娠中・授乳中の方は、ご使用前にかかりつけの医師にご相談ください。",
  },
  {
    question: "肌に合わない、体調に変化があった場合はどうすればいいですか?",
    answer:
      "すぐに使用を中止してください。赤み・かゆみなどの症状が続く場合は、皮膚科医などの専門家にご相談ください。ご不安な点があれば、LINEでもご相談いただけます。",
  },
  {
    question: "サプリメントで病気を治すことはできますか?",
    answer:
      "サプリメントは医薬品ではないため、病気の診断・治療・予防を目的としたものではありません。健康や栄養バランスの維持を目的とした食品です。体調に不安がある場合は医療機関を受診してください。",
  },
  {
    question: "返品・交換はできますか?",
    answer:
      "ニュースキンには会員規約に基づく返品・交換制度があり、契約から20日以内であればクーリングオフも可能です。返品方法は購入経路によって異なりますので、詳しくはLINEでご相談いただくか、ニュースキン公式サイトの返品・交換ページをご確認ください。",
  },
  {
    question: "定期的にお得に購入する方法はありますか?",
    answer:
      "ニュースキン公式の定期購入プログラム「ADP(オートマティック デリバリー プログラム)」をご利用いただくと、6ヶ月目までは5%、7ヶ月目以降は10%の割引が受けられます(対象製品・条件あり)。お申し込み方法はLINEでご案内できます。",
  },
  {
    question: "どこで購入すれば正規品を確実に買えますか?",
    answer:
      "正規品を確実に入手するには、ニュースキン公式サイトまたは正規のブランドメンバー(ディストリビューター)経由でのご購入をおすすめします。個人間売買や非正規のルートでの購入は、品質保証の対象外となる場合があります。ご購入方法はLINEでご案内できます。",
  },
];

async function getOrCreateQuestion(
  step: number,
  questionText: string,
  questionType: QuestionType,
  parentCategoryId: string | null,
  role: string | null = null
) {
  const existing = await prisma.question.findFirst({ where: { questionText } });
  if (existing) return existing;
  const sortOrder = await prisma.question.count({ where: { step } });
  return prisma.question.create({
    data: { step, questionText, questionType, parentCategoryId, role, sortOrder },
  });
}

async function getOrCreateOption(questionId: number, optionText: string, sortOrder: number) {
  const existing = await prisma.questionOption.findFirst({ where: { questionId, optionText } });
  if (existing) return existing;
  return prisma.questionOption.create({ data: { questionId, optionText, sortOrder } });
}

async function getOrCreateOptions(questionId: number, texts: string[]) {
  const options = [];
  for (let i = 0; i < texts.length; i++) {
    options.push(await getOrCreateOption(questionId, texts[i], i));
  }
  return options;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
