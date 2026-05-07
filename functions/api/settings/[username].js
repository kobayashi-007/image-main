// GET /api/settings/:username
export async function onRequest(context) {
  const { env, params } = context
  const username = params.username
  const corsHeaders = getCorsHeaders()

  try {
    const userData = await env.IMAGE_HOST_KV.get(`user:${username}`)
    if (userData) {
      const user = JSON.parse(userData)
      return new Response(JSON.stringify({
        success: true,
        data: {
          defaultUsername: user.username,
          defaultPassword: user.password,
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
    } else {
      return new Response(JSON.stringify({ success: false, message: '用户不存在' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
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