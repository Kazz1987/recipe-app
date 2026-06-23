# 🍳 AIレシピアプリ

食材を入力するとAIがレシピを提案してくれるWebアプリです。

## 🌐 デモ

https://recipe-app-waj3.vercel.app

### テスト用アカウント
- メールアドレス: `test@example.com`
- パスワード: `test1234`

## ✨ 機能

- 🥘 **AIレシピ提案** - 食材を入力するとClaude AIが3つのレシピを提案
- 👥 **人数選択** - 1〜5人分以上の分量で提案
- 🥗 **ダイエットモード** - 500kcal以下のヘルシーレシピを優先
- 📊 **栄養素表示** - カロリー・タンパク質・脂質・炭水化物を表示
- 🗂️ **材料カテゴリ分け** - メイン・調味料・油・下味に分類
- ❤️ **お気に入り保存** - 気に入ったレシピをDBに保存
- 🔐 **ユーザー認証** - メール・パスワードでのログイン/新規登録

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | Next.js 16 / TypeScript / Tailwind CSS |
| AI | Claude API (claude-sonnet-4-6) |
| 認証 | NextAuth.js v4 |
| データベース | Neon (PostgreSQL) |
| ORM | Prisma 7 |
| デプロイ | Vercel |

## 📁 ディレクトリ構成
recipe-app/

├── app/

│   ├── api/

│   │   ├── auth/[...nextauth]/  # NextAuth認証

│   │   ├── favorites/           # お気に入りCRUD

│   │   ├── recipe/              # Claude APIレシピ生成

│   │   └── register/            # ユーザー登録

│   ├── favorites/               # お気に入りページ

│   ├── login/                   # ログインページ

│   ├── register/                # 新規登録ページ

│   ├── layout.tsx

│   ├── page.tsx                 # メインページ

│   └── providers.tsx

├── lib/

│   └── prisma.ts                # Prismaクライアント

├── prisma/

│   ├── schema.prisma            # DBスキーマ

│   └── migrations/

└── prisma.config.ts

## 🚀 ローカル開発

### 必要なもの
- Node.js 18以上
- Neon PostgreSQLアカウント
- Anthropic APIキー

### セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/Kazz1987/recipe-app.git
cd recipe-app

# パッケージインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envを編集してください

# DBマイグレーション
npx prisma migrate dev

# 開発サーバー起動
npm run dev
```

### 環境変数
DATABASE_URL=        # NeonのPostgreSQL接続URL

NEXTAUTH_SECRET=     # NextAuth用シークレットキー

NEXTAUTH_URL=        # アプリのURL（開発時はhttp://localhost:3000）

ANTHROPIC_API_KEY=   # Anthropic APIキー

## 📝 今後の予定

- [ ] Googleログイン対応
- [ ] レシピの検索・フィルター機能
- [ ] i18n対応（英語）
- [ ] レシピの評価機能

