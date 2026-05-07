// GET /api/settings/test
export async function onRequest(context) {
  const { env } = context
  const corsHeaders = getCorsHeaders()

  try {
    const usersList = await env.IMAGE_HOST_KV.get('users_list')
    const users = usersList ? JSON.parse(usersList) : []
    const hasUsers = users.length > 0
    
    let defaultSettings = null
    if (hasUsers && users[0]) {
      const firstUser = await env.IMAGE_HOST_KV.get(`user:${users[0]}`)
      if (firstUser) {
        const user = JSON.parse(firstUser)
        defaultSettings = {
          siteTitle: user.siteTitle || 'GitHub 图床',
          loginTransparent: user.loginTransparent || false,
          loginOpacity: user.loginOpacity || 0.8,
          loginBackground: user.loginBackground || ''
        }
      }
    }
    
    return new Response(JSON.stringify({ success: hasUsers, defaultSettings }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('Error:', e)
    return new Response(JSON.stringify({ success: false }), {
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