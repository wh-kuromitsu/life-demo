export const config = {
  matcher: '/(.*)',
}

export default function middleware(request) {
  const basicAuth = request.headers.get('authorization')

  if (basicAuth) {
    const [user, pwd] = atob(basicAuth.split(' ')[1]).split(':')
    if (user === 'admin' && pwd === 'password') {
      return // ← そのまま通過
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}
