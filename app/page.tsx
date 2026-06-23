"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

type Ingredient = { name: string; amount: string; category: string }
type Recipe = {
  name: string
  description: string
  difficulty: string
  cooking_time: string
  servings: string
  ingredients: Ingredient[]
  steps: string[]
  nutrition: { calories: number; protein: number; fat: number; carbs: number }
  diet_friendly: boolean
  missing_ingredients: string[]
}

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [input, setInput] = useState("")
  const [ingredients, setIngredients] = useState<string[]>([])
  const [dietMode, setDietMode] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [servings, setServings] = useState("2")

  const MAX_INGREDIENTS = 20
  const MAX_INGREDIENT_LENGTH = 20

  const addIngredient = () => {
    const trimmed = input.trim()
    if (!trimmed) {
      setError("食材名を入力してください")
      return
    }
    if (trimmed.length > MAX_INGREDIENT_LENGTH) {
      setError(`食材名は${MAX_INGREDIENT_LENGTH}文字以内で入力してください`)
      return
    }
    if (ingredients.includes(trimmed)) {
      setError("すでに追加されている食材です")
      return
    }
    if (ingredients.length >= MAX_INGREDIENTS) {
      setError(`食材は${MAX_INGREDIENTS}個まで追加できます`)
      return
    }
    setError("")
    setIngredients([...ingredients, trimmed])
    setInput("")
  }

  const removeIngredient = (item: string) => {
    setIngredients(ingredients.filter((i) => i !== item))
  }

  const handleSearch = async () => {
  if (ingredients.length === 0) {
    setError("食材を1つ以上追加してください")
    return
  }
  setLoading(true)
  setError("")
  setRecipes([])

  try {
    const res = await fetch("/api/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, dietMode, servings }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "レシピの取得に失敗しました")
    } else {
      setRecipes(data.recipes)
    }
  } catch {
    setError("通信エラーが発生しました。ネットワーク接続を確認してください")
  } finally {
    setLoading(false)
  }
}

  const handleSave = async (recipe: Recipe, index: number) => {
    if (!session) {
      router.push("/login")
      return
    }

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeName: recipe.name, recipeData: recipe }),
      })

      if (res.ok) {
        setSavedIds([...savedIds, index])
      } else {
        const data = await res.json()
        setError(data.error || "お気に入りの保存に失敗しました")
      }
    } catch {
      setError("通信エラーが発生しました。ネットワーク接続を確認してください")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">🍳 AIレシピ</h1>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-gray-500">{session.user?.email}</span>
                <button
                  onClick={() => router.push("/favorites")}
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  お気に入り
                </button>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition"
              >
                ログイン
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 食材入力 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4">食材を入力</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addIngredient()}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="例：鶏肉、トマト、玉ねぎ"
            />
            <button
              onClick={addIngredient}
              className="bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 transition"
            >
              追加
            </button>
          </div>

          {/* 食材タグ */}
          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {ingredients.map((item) => (
                <span
                  key={item}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {item}
                  <button
                    onClick={() => removeIngredient(item)}
                    className="text-gray-400 hover:text-gray-600 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* ダイエットモード */}
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dietMode}
                onChange={(e) => setDietMode(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                🥗 ダイエットモード（500kcal以下のレシピを優先）
              </span>
            </label>
          </div>

          {/* 人数選択 */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-gray-700">👥 人数：</label>
            <select
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="1">1人分</option>
              <option value="2">2人分</option>
              <option value="3">3人分</option>
              <option value="4">4人分</option>
              <option value="5">5人分以上</option>
            </select>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            {loading ? "レシピを生成中..." : "レシピを提案してもらう"}
          </button>
        </div>

        {/* レシピ一覧 */}
        {recipes.map((recipe, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold">{recipe.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{recipe.description}</p>
              </div>
              <button
                onClick={() => handleSave(recipe, index)}
                disabled={savedIds.includes(index)}
                className="text-2xl ml-4"
              >
                {savedIds.includes(index) ? "❤️" : "🤍"}
              </button>
            </div>

            {/* 基本情報 */}
            <div className="flex gap-4 text-sm text-gray-600 mb-4">
              <span>⏱ {recipe.cooking_time}分</span>
              <span>👥 {recipe.servings}</span>
              <span>📊 {recipe.difficulty}</span>
              {recipe.diet_friendly && <span>🥗 ヘルシー</span>}
            </div>

            {/* 栄養素 */}
            <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">カロリー</p>
                <p className="font-bold text-sm">{recipe.nutrition.calories}kcal</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">タンパク質</p>
                <p className="font-bold text-sm">{recipe.nutrition.protein}g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">脂質</p>
                <p className="font-bold text-sm">{recipe.nutrition.fat}g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">炭水化物</p>
                <p className="font-bold text-sm">{recipe.nutrition.carbs}g</p>
              </div>
            </div>

            {/* 食材 */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">材料</h4>
              {["メイン", "下味", "油", "調味料", "その他"].map((category) => {
                const items = recipe.ingredients.filter((ing) => ing.category === category)
                if (items.length === 0) return null
                return (
                  <div key={category} className="mb-3">
                    <p className="text-xs font-medium text-gray-400 mb-1">
                      【{category === "調味料" ? "合わせ調味料" : category}】
                    </p>
                    <ul className="space-y-1">
                      {items.map((ing, i) => (
                        <li key={i} className="text-sm text-gray-600 flex justify-between">
                          <span>{ing.name}</span>
                          <span>{ing.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            {/* 手順 */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">作り方</h4>
              <ol className="space-y-2">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="font-bold text-gray-900 shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* あると良い食材 */}
            {recipe.missing_ingredients.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium mb-1">
                  💡 あると更に美味しくなる食材
                </p>
                <p className="text-sm text-amber-600">
                  {recipe.missing_ingredients.join("、")}
                </p>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  )
}