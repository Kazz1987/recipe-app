import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_INGREDIENTS = 20
const MAX_INGREDIENT_LENGTH = 20
const VALID_SERVINGS = ["1", "2", "3", "4", "5"]

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 }
    )
  }

  const { ingredients, dietMode, servings } = body as {
    ingredients?: unknown
    dietMode?: unknown
    servings?: unknown
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json(
      { error: "食材を1つ以上入力してください" },
      { status: 400 }
    )
  }
  if (ingredients.length > MAX_INGREDIENTS) {
    return NextResponse.json(
      { error: `食材は${MAX_INGREDIENTS}個まで指定できます` },
      { status: 400 }
    )
  }
  if (
    !ingredients.every(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0 &&
        item.trim().length <= MAX_INGREDIENT_LENGTH
    )
  ) {
    return NextResponse.json(
      { error: `食材名は1〜${MAX_INGREDIENT_LENGTH}文字の文字列で指定してください` },
      { status: 400 }
    )
  }
  if (typeof servings !== "string" || !VALID_SERVINGS.includes(servings)) {
    return NextResponse.json(
      { error: "人数の指定が正しくありません" },
      { status: 400 }
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY が設定されていません")
    return NextResponse.json(
      { error: "サーバー設定エラーが発生しました" },
      { status: 500 }
    )
  }

  try {
    const servingsText = servings === "5" ? "5人分以上" : `${servings}人分`
    const dietInstruction = "ダイエット中のユーザー向けに、低カロリー・高タンパクなレシピを優先してください。カロリーは1食500kcal以下を目安にしてください。"
    const basePrompt = `食材：${ingredients.map((i) => i.trim()).join("、")}\n人数：${servingsText}`
    const userPrompt = dietMode
      ? `以下の食材でレシピを3つ提案してください。\n${basePrompt}\n\n${dietInstruction}`
      : `以下の食材でレシピを3つ提案してください。\n${basePrompt}`

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: `あなたはプロの料理研究家です。ユーザーが入力した食材を使って作れるレシピを提案してください。以下のJSON形式で必ず回答してください。それ以外のテキストは含めないでください。

{
  "recipes": [
    {
      "name": "料理名",
      "description": "料理の簡単な説明",
      "difficulty": "簡単 | 普通 | 難しい",
      "cooking_time": "調理時間（分）",
      "servings": "何人分",
      "ingredients": [
        { "name": "食材名", "amount": "分量", "category": "メイン | 調味料 | 油 | 下味 | その他" }
      ],
      "steps": ["手順1", "手順2"],
      "nutrition": {
        "calories": 数値,
        "protein": 数値,
        "fat": 数値,
        "carbs": 数値
      },
      "diet_friendly": true,
      "missing_ingredients": ["あると更に美味しくなる食材"]
    }
  ]
}

ingredientsのcategoryは以下のルールで分類してください：
- "メイン": 主となる食材（肉、魚、野菜など）
- "調味料": 醤油、みりん、砂糖、塩、こしょうなど複数を合わせて使うもの
- "油": サラダ油、オリーブオイル、バターなど炒める・焼くために使う油
- "下味": 肉や魚に事前につける塩・こしょう・酒など
- "その他": 上記に当てはまらないもの`,
      messages: [{ role: "user", content: userPrompt }],
    })

    const content = message.content[0]
    if (content.type !== "text") {
      console.error("予期しないレスポンス形式:", content)
      return NextResponse.json(
        { error: "レシピの生成に失敗しました。もう一度お試しください" },
        { status: 502 }
      )
    }

    const cleanText = content.text.replace(/```json\n?|\n?```/g, "").trim()
    let recipes: unknown
    try {
      recipes = JSON.parse(cleanText)
    } catch (parseError) {
      console.error("レシピJSONの解析に失敗:", parseError, content.text)
      return NextResponse.json(
        { error: "レシピの生成に失敗しました。もう一度お試しください" },
        { status: 502 }
      )
    }

    return NextResponse.json(recipes)
  } catch (error) {
    console.error("レシピ生成エラー:", error)

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "リクエストが混み合っています。しばらく待ってから再度お試しください" },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: "AIサービスとの通信に失敗しました" },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: "レシピの生成に失敗しました。もう一度お試しください" },
      { status: 500 }
    )
  }
}