const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = 3001

// 中间件
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data.json')

// 初始化数据文件
function initDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      users: []
    }, null, 2))
  }
}

// 读取数据
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    initDataFile()
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

// 写入数据
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// 初始化
initDataFile()

// API 路由

// 测试是否有配置
app.get('/api/settings/test', (req, res) => {
  try {
    const data = readData()
    res.json({
      success: data.users.length > 0
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// 获取用户配置
app.get('/api/settings/:username', (req, res) => {
  try {
    const data = readData()
    const user = data.users.find(u => u.username === req.params.username)
    
    if (user) {
      res.json({
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
      })
    } else {
      res.json({ success: false, message: '用户不存在' })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// 保存用户配置
app.post('/api/settings', (req, res) => {
  try {
    const { defaultUsername, defaultPassword, githubToken, repo, branch } = req.body
    
    if (!defaultUsername || !defaultPassword || !githubToken || !repo) {
      return res.json({ success: false, message: '请填写完整信息' })
    }

    const data = readData()
    const existingUserIndex = data.users.findIndex(u => u.username === defaultUsername)
    
    const userData = {
      username: defaultUsername,
      password: defaultPassword,
      githubToken,
      repo,
      branch: branch || 'main',
      siteTitle: req.body.siteTitle || 'GitHub 图床',
      loginTransparent: req.body.loginTransparent || false,
      loginOpacity: req.body.loginOpacity || 0.8,
      loginBackground: req.body.loginBackground || '',
      customDomain: req.body.customDomain || '',
      useCustomDomain: req.body.useCustomDomain || false
    }

    if (existingUserIndex >= 0) {
      data.users[existingUserIndex] = userData
    } else {
      data.users.push(userData)
    }
    
    writeData(data)
    res.json({ success: true, message: '配置保存成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// 登录验证
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.json({ success: false, message: '请填写用户名和密码' })
    }

    const data = readData()
    const user = data.users.find(u => u.username === username && u.password === password)
    
    if (user) {
      res.json({
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
      })
    } else {
      res.json({ success: false, message: '用户名或密码错误' })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})