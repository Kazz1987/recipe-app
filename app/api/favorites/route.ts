import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// お気に入り一覧取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(favorites)
  } catch (error) {
    console.error("お気に入り取得エラー:", error)
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}

const MAX_RECIPE_NAME_LENGTH = 100

// お気に入り追加
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: "リクエストの形式が正しくありません" },
        { status: 400 }
      )
    }

    const { recipeName, recipeData } = body as {
      recipeName?: unknown
      recipeData?: unknown
    }

    if (typeof recipeName !== "string" || recipeName.trim().length === 0) {
      return NextResponse.json(
        { error: "レシピ名を指定してください" },
        { status: 400 }
      )
    }
    if (recipeName.length > MAX_RECIPE_NAME_LENGTH) {
      return NextResponse.json(
        { error: `レシピ名は${MAX_RECIPE_NAME_LENGTH}文字以内で指定してください` },
        { status: 400 }
      )
    }
    if (!recipeData || typeof recipeData !== "object") {
      return NextResponse.json(
        { error: "レシピデータの形式が正しくありません" },
        { status: 400 }
      )
    }

    const favorite = await prisma.favorite.create({
      data: { userId: user.id, recipeName: recipeName.trim(), recipeData },
    })

    return NextResponse.json(favorite)
  } catch (error) {
    console.error("お気に入り追加エラー:", error)
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}

// お気に入り削除
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: "リクエストの形式が正しくありません" },
        { status: 400 }
      )
    }

    const { id } = body as { id?: unknown }
    if (typeof id !== "number" || !Number.isInteger(id)) {
      return NextResponse.json(
        { error: "削除対象のIDが正しくありません" },
        { status: 400 }
      )
    }

    const favorite = await prisma.favorite.findUnique({ where: { id } })
    if (!favorite) {
      return NextResponse.json(
        { error: "お気に入りが見つかりません" },
        { status: 404 }
      )
    }
    if (favorite.userId !== user.id) {
      return NextResponse.json(
        { error: "このお気に入りを削除する権限がありません" },
        { status: 403 }
      )
    }

    await prisma.favorite.delete({ where: { id } })

    return NextResponse.json({ message: "削除完了" })
  } catch (error) {
    console.error("お気に入り削除エラー:", error)
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}