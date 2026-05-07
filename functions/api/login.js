// POST /api/login
export async function onRequest(context) {
  const { request, env } = context
  const corsHeaders = getCorsHeaders()

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: '请填写用户名和密码' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userData = await env.IMAGE_HOST_KV.get(`user:${username}`)
    if (userData) {
      const user = JSON.parse(userData)
      if (user.password === password) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            username: user.username,
            githubToken: user.githubToken,
            repo: user.repo,
            branch: user.branch,
            siteTitle: user.siteTitle || 'GitHub 图床',
            loginTransparent: user.loginTransparent || false,
            loginOpacity: user.loginOpacity || 0.8,
            loginBackground: user.loginBackground || '',
            customDomain: user.customDomain || '',
            useCustomDomain: user.useCustomDomain || false
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ success: false, message: '用户名或密码错误' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ success: false, message: '服务器错误' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: getCorsHeaders() })
}

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}