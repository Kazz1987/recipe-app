"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type Recipe = {
  name: string
  description: string
  difficulty: string
  cooking_time: string
  servings: string
  ingredients: { name: string; amount: string; category: string }[]
  steps: string[]
  nutrition: { calories: number; protein: number; fat: number; carbs: number }
  diet_friendly: boolean
  missing_ingredients: string[]
}

type Favorite = {
  id: number
  recipeName: string
  recipeData: Recipe
  createdAt: string
}

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [openIds, setOpenIds] = useState<number[]>([])

  const toggleOpen = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetchFavorites()
    }
  }, [status])

  const fetchFavorites = async () => {
    const res = await fetch("/api/favorites")
    const data = await res.json()
    setFavorites(data)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    await fetch("/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setFavorites(favorites.filter((f) => f.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 戻る
          </button>
          <h1 className="text-xl font-bold">❤️ お気に入り</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-4xl mb-4">🍳</p>
            <p className="text-gray-500">お気に入りのレシピはまだありません</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-gray-700 transition"
            >
              レシピを探す
            </button>
          </div>
        ) : (
          favorites.map((fav) => (
            <div key={fav.id} className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
              {/* サマリー部分（常に表示） */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{fav.recipeName}</h3>
                    <p className="text-gray-500 text-sm mt-1">{fav.recipeData.description}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(fav.id)}
                    className="text-red-400 hover:text-red-600 text-sm ml-4 shrink-0"
                  >
                    削除
                  </button>
                </div>

                <div className="flex gap-4 text-sm text-gray-600 mb-4">
                  <span>⏱ {fav.recipeData.cooking_time}分</span>
                  <span>👥 {fav.recipeData.servings}</span>
                  <span>📊 {fav.recipeData.difficulty}</span>
                  {fav.recipeData.diet_friendly && <span>🥗 ヘルシー</span>}
                </div>

                <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">カロリー</p>
                    <p className="font-bold text-sm">{fav.recipeData.nutrition.calories}kcal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">タンパク質</p>
                    <p className="font-bold text-sm">{fav.recipeData.nutrition.protein}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">脂質</p>
                    <p className="font-bold text-sm">{fav.recipeData.nutrition.fat}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">炭水化物</p>
                    <p className="font-bold text-sm">{fav.recipeData.nutrition.carbs}g</p>
                  </div>
                </div>

                {/* 開閉ボタン */}
                <button
                  onClick={() => toggleOpen(fav.id)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 py-1"
                >
                  {openIds.includes(fav.id) ? "▲ 閉じる" : "▼ 材料・作り方を見る"}
                </button>
              </div>

              {/* 詳細部分（開閉） */}
              {openIds.includes(fav.id) && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">材料</h4>
                    {["メイン", "下味", "油", "調味料", "その他"].map((category) => {
                      const items = fav.recipeData.ingredients.filter(
                        (ing) => ing.category === category
                      )
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

                  <div>
                    <h4 className="font-medium mb-2">作り方</h4>
                    <ol className="space-y-2">
                      {fav.recipeData.steps.map((step, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <span className="font-bold text-gray-900 shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  )
}