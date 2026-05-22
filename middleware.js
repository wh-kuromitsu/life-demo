import { NextResponse } from 'next/server'

export const config = {
  // 静的ファイルやアイコン、APIルートなどをBasic認証の対象から除外する推奨設定
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

export default function middleware(request) {
  const basicAuth = request.headers.get('authorization')

  if (basicAuth) {
    try {
      // Base64デコード
      const decoded = atob(basicAuth.split(' ')[1])

      // パスワードに「:」が含まれていても安全に分割するため、最初の「:」の位置を探す
      const colonIndex = decoded.indexOf(':')

      if (colonIndex !== -1) {
        const user = decoded.substring(0, colonIndex)
        const pwd = decoded.substring(colonIndex + 1)

        // 認証情報のチェック
        if (user === 'admin' && pwd === ':Lm$F+w~mt6h') {
          return NextResponse.next() // ← 正しく通過させる
        }
      }
    } catch (error) {
      console.error('Basic auth decode error:', error)
    }
  }

  // 認証失敗、または未入力の場合は401を返す
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}
