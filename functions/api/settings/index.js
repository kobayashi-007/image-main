// POST /api/settings
export async function onRequest(context) {
  const { request, env } = context
  const corsHeaders = getCorsHeaders()

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await request.json()
    const { defaultUsername, defaultPassword, githubToken, repo, branch } = body

    if (!defaultUsername || !defaultPassword || !githubToken || !repo) {
      return new Response(JSON.stringify({ success: false, message: '请填写完整信息' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userData = {
      username: defaultUsername,
      password: defaultPassword,
      githubToken,
      repo,
      branch: branch || 'main',
      siteTitle: body.siteTitle || 'GitHub 图床',
      loginTransparent: body.loginTransparent || false,
      loginOpacity: body.loginOpacity || 0.8,
      loginBackground: body.loginBackground || '',
      customDomain: body.customDomain || '',
      useCustomDomain: body.useCustomDomain || false
    }

    await env.IMAGE_HOST_KV.put(`user:${defaultUsername}`, JSON.stringify(userData))

    let usersList = []
    const existingList = await env.IMAGE_HOST_KV.get('users_list')
    if (existingList) {
      usersList = JSON.parse(existingList)
    }
    if (!usersList.includes(defaultUsername)) {
      usersList.push(defaultUsername)
      await env.IMAGE_HOST_KV.put('users_list', JSON.stringify(usersList))
    }

    return new Response(JSON.stringify({ success: true, message: '配置保存成功' }), {
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