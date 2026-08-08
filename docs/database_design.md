# データベース設計案(タスク4 成果物)

対象: ageLOC診断プラットフォームのDB構造
方針: 臨床データ・成分情報は要約+出典URL付きで保存し、アプリはこのDBから表示する(タスク2で確定した方針を反映)

---

## ER概要(テーブル一覧)

1. `products` — 製品マスタ
2. `product_clinical_data` — 製品ごとの臨床データ・成分要約
3. `concern_categories` — 悩みカテゴリマスタ(A〜H)
4. `concern_general_knowledge` — カテゴリ別の一般知識(未検証フラグ付き)
5. `product_concern_map` — 製品×悩みカテゴリの紐付け
6. `questions` — 質問マスタ
7. `question_options` — 質問の選択肢
8. `option_concern_map` — 選択肢→悩みカテゴリの紐付け
9. `diagnosis_sessions` — ユーザーの診断セッション(回答履歴)
10. `diagnosis_results` — 診断結果(セッションごとの提案内容スナップショット)

---

## 1. products(製品マスタ)

| カラム名 | 型 | 説明 |
|---|---|---|
| product_id | INT (PK) | 製品ID |
| product_code | VARCHAR | Nu Skin製品コード(例: 03004260) |
| name_jp | VARCHAR | 日本版製品名 |
| name_us_ref | VARCHAR | 参照元のUS製品名(社内管理用、非公開表示) |
| category | VARCHAR | 化粧水/美容液/クリーム/乳液/デバイス/付属品/ヘアケア 等 |
| price_jpy | INT | 参考小売価格 |
| product_url | VARCHAR | 購入ページURL |
| is_active | BOOLEAN | 取扱中フラグ |
| created_at / updated_at | DATETIME | 管理用 |

## 2. product_clinical_data(臨床データ・成分要約)

| カラム名 | 型 | 説明 |
|---|---|---|
| data_id | INT (PK) | ID |
| product_id | INT (FK→products) | 対象製品 |
| summary_text | TEXT | 要約済みの臨床データ・成分説明(オリジナル表現に言い換え済み) |
| has_anti_wrinkle_test | BOOLEAN | 抗シワ効能評価試験済みフラグ |
| source_url | VARCHAR | 出典URL(US公式サイト等、「詳しくはこちら」用) |
| last_verified_at | DATE | 最終確認日(定期更新の管理用) |

## 3. concern_categories(悩みカテゴリマスタ)

| カラム名 | 型 | 説明 |
|---|---|---|
| category_id | VARCHAR (PK) | A〜Hのコード |
| name | VARCHAR | 例:「ハリ・輪郭」 |
| description | TEXT | カテゴリの説明文 |
| sort_order | INT | 表示順 |

## 4. concern_general_knowledge(カテゴリ別一般知識)

| カラム名 | 型 | 説明 |
|---|---|---|
| knowledge_id | INT (PK) | ID |
| category_id | VARCHAR (FK→concern_categories) | 対象カテゴリ |
| content_text | TEXT | 一般知識の説明文 |
| is_source_verified | BOOLEAN | 出典確認済みフラグ(**現状すべてFALSE**) |
| source_url | VARCHAR (nullable) | 出典URL(確認後に追加) |

## 5. product_concern_map(製品×悩みカテゴリ紐付け)

| カラム名 | 型 | 説明 |
|---|---|---|
| map_id | INT (PK) | ID |
| product_id | INT (FK→products) | 製品 |
| category_id | VARCHAR (FK→concern_categories) | カテゴリ |
| priority | INT | カテゴリ内での提案優先度(1が最優先) |

## 6. questions(質問マスタ)

| カラム名 | 型 | 説明 |
|---|---|---|
| question_id | INT (PK) | ID |
| step | INT | 表示順(Q1, Q2, Q3...) |
| question_text | TEXT | 質問文 |
| question_type | ENUM | single_select / multi_select |
| parent_category_id | VARCHAR (FK, nullable) | Q3深掘り質問の場合、紐づく親カテゴリ |

## 7. question_options(質問の選択肢)

| カラム名 | 型 | 説明 |
|---|---|---|
| option_id | INT (PK) | ID |
| question_id | INT (FK→questions) | 対象質問 |
| option_text | VARCHAR | 選択肢の文言 |
| sort_order | INT | 表示順 |

## 8. option_concern_map(選択肢→カテゴリ紐付け)

| カラム名 | 型 | 説明 |
|---|---|---|
| map_id | INT (PK) | ID |
| option_id | INT (FK→question_options) | 選択肢 |
| category_id | VARCHAR (FK→concern_categories) | 紐づくカテゴリ |

## 9. diagnosis_sessions(診断セッション)

| カラム名 | 型 | 説明 |
|---|---|---|
| session_id | UUID (PK) | セッションID |
| started_at | DATETIME | 開始日時 |
| answers_json | JSON | 回答内容(質問ID:選択肢IDの組) |
| line_redirect_clicked | BOOLEAN | LINE誘導ボタンのクリック有無(効果測定用) |

## 10. diagnosis_results(診断結果スナップショット)

| カラム名 | 型 | 説明 |
|---|---|---|
| result_id | INT (PK) | ID |
| session_id | UUID (FK→diagnosis_sessions) | 対象セッション |
| category_id | VARCHAR (FK→concern_categories) | 該当した悩みカテゴリ |
| recommended_product_ids | JSON | 提案した製品IDのリスト |
| displayed_at | DATETIME | 表示日時 |

---

## リレーション概要図(テキスト表現)

```
concern_categories 1---N product_concern_map N---1 products 1---1 product_clinical_data
concern_categories 1---N concern_general_knowledge
concern_categories 1---N option_concern_map N---1 question_options N---1 questions
diagnosis_sessions 1---N diagnosis_results N---1 concern_categories
```

---

## 管理画面(タスク1で定義した要件)との対応

- 製品追加・更新 → `products` + `product_clinical_data` の編集画面
- 悩みカテゴリ・質問の見直し → `concern_categories` / `questions` / `question_options` の編集画面
- 一般知識の出典確認 → `concern_general_knowledge.is_source_verified` を管理画面上でON/OFF切り替えられるようにする

---

## 次のアクション(タスク5:画面設計へ)

このテーブル構造をもとに、次は診断フォームの画面(ワイヤーフレーム)と結果表示画面の構成をまとめ、Claude Codeへの指示書に必要な情報(画面遷移・API仕様)を固めていきます。
