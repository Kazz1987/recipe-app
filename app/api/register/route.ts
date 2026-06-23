import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const MAX_EMAIL_LENGTH = 254

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

  const { email, password } = body as { email?: unknown; password?: unknown }

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return NextResponse.json(
      { error: "メールアドレスとパスワードは必須です" },
      { status: 400 }
    )
  }

  const trimmedEmail = email.trim()

  if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
    return NextResponse.json(
      { error: "メールアドレスが長すぎます" },
      { status: 400 }
    )
  }
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return NextResponse.json(
      { error: "メールアドレスの形式が正しくありません" },
      { status: 400 }
    )
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください` },
      { status: 400 }
    )
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } })
    if (existing) {
      return NextResponse.json(
        { error: "このメールアドレスはすでに登録されています" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email: trimmedEmail, password: hashedPassword },
    })

    return NextResponse.json({ message: "登録完了", userId: user.id })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("P2002")
    ) {
      return NextResponse.json(
        { error: "このメールアドレスはすでに登録されています" },
        { status: 409 }
      )
    }
    console.error("ユーザー登録エラー:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}