// Cloudflare Pages Functions
// 这个文件处理所有 /api/* 请求

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const path = url.pathname

  // CORS 处理
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // API 路由
    if (path === '/api/settings/test') {
      return await testConfig(env, corsHeaders)
    } else if (path.startsWith('/api/settings/') && request.method === 'GET') {
      const username = path.split('/api/settings/')[1]
      return await getSettings(env, username, corsHeaders)
    } else if (path === '/api/settings' && request.method === 'POST') {
      return await saveSettings(request, env, corsHeaders)
    } else if (path === '/api/login' && request.method === 'POST') {
      return await login(request, env, corsHeaders)
    }

    // 404
    return new Response(JSON.stringify({ success: false, message: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ success: false, message: 'Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 测试是否有配置
async function testConfig(env, corsHeaders) {
  try {
    const usersList = await env.IMAGE_HOST_KV.get('users_list')
    const hasUsers = usersList && JSON.parse(usersList).length > 0
    return new Response(JSON.stringify({ success: hasUsers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch {
    return new Response(JSON.stringify({ success: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 获取用户配置
async function getSettings(env, username, corsHeaders) {
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
    console.error('Get settings error:', error)
    return new Response(JSON.stringify({ success: false, message: '服务器错误' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 保存用户配置
async function saveSettings(request, env, corsHeaders) {
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

    // 保存用户数据
    await env.IMAGE_HOST_KV.put(`user:${defaultUsername}`, JSON.stringify(userData))

    // 更新用户列表
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
    console.error('Save settings error:', error)
    return new Response(JSON.stringify({ success: false, message: '服务器错误' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 登录验证
async function login(request, env, corsHeaders) {
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
    console.error('Login error:', error)
    return new Response(JSON.stringify({ success: false, message: '服务器错误' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
