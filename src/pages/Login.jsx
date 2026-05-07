import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/Login.css'
import { API_URL } from '../config'

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [hasConfig, setHasConfig] = useState(false)
  const DEFAULT_BG = '/video.mp4'
  
  const [siteSettings, setSiteSettings] = useState({
    siteTitle: 'GitHub 图床',
    loginTransparent: false,
    loginOpacity: 0.8,
    loginBackground: DEFAULT_BG
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // 检查是否有配置（用于显示提示）
  const loadSettings = async () => {
    let loadedFromLocal = false
    
    // 先检查localStorage里是否有登录过的用户配置
    const savedConfig = localStorage.getItem('imageHostConfig')
    if (savedConfig) {
      const config = JSON.parse(savedConfig)
      // 如果有用户名，尝试从后端读取最新设置
      if (config.username) {
        try {
          const response = await fetch(`${API_URL}/api/settings/${config.username}`)
          const data = await response.json()
          if (data.success) {
            setSiteSettings({
              siteTitle: data.data.siteTitle || 'GitHub 图床',
              loginTransparent: data.data.loginTransparent || false,
              loginOpacity: data.data.loginOpacity || 0.8,
              loginBackground: data.data.loginBackground || DEFAULT_BG
            })
            // 同时更新localStorage
            localStorage.setItem('imageHostConfig', JSON.stringify({
              ...config,
              siteTitle: data.data.siteTitle,
              loginTransparent: data.data.loginTransparent,
              loginOpacity: data.data.loginOpacity,
              loginBackground: data.data.loginBackground
            }))
            loadedFromLocal = true
          }
        } catch {
          // 读取失败
        }
      }
      
      // 如果没有从后端读取，就用本地的
      if (!loadedFromLocal && config.siteTitle) {
        setSiteSettings({
          siteTitle: config.siteTitle || 'GitHub 图床',
          loginTransparent: config.loginTransparent || false,
          loginOpacity: config.loginOpacity || 0.8,
          loginBackground: config.loginBackground || DEFAULT_BG
        })
        loadedFromLocal = true
      }
    }

    const checkConfig = async () => {
      try {
        // 尝试加载任何一个配置，用于判断是否需要显示提示
        const response = await fetch(`${API_URL}/api/settings/test`)
        const data = await response.json()
        setHasConfig(data.success)
        
        // 如果有默认配置，并且还没有从本地加载，就用默认配置
        if (data.defaultSettings && !loadedFromLocal) {
          setSiteSettings({
            siteTitle: data.defaultSettings.siteTitle || 'GitHub 图床',
            loginTransparent: data.defaultSettings.loginTransparent || false,
            loginOpacity: data.defaultSettings.loginOpacity || 0.8,
            loginBackground: data.defaultSettings.loginBackground || DEFAULT_BG
          })
        }
      } catch {
        setHasConfig(false)
      }
    }
    checkConfig()
  }

  useEffect(() => {
    loadSettings()
  }, [location])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.username || !formData.password) {
      setError('请填写用户名和密码')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      const data = await response.json()

      if (data.success) {
        // 登录成功，保存配置到 localStorage（用于上传功能）
        localStorage.setItem('imageHostConfig', JSON.stringify({
          username: data.data.username,
          githubToken: data.data.githubToken,
          repo: data.data.repo,
          branch: data.data.branch,
          siteTitle: data.data.siteTitle,
          loginTransparent: data.data.loginTransparent,
          loginOpacity: data.data.loginOpacity,
          loginBackground: data.data.loginBackground,
          customDomain: data.data.customDomain,
          useCustomDomain: data.data.useCustomDomain
        }))
        // 更新页面设置
        setSiteSettings({
          siteTitle: data.data.siteTitle || 'GitHub 图床',
          loginTransparent: data.data.loginTransparent || false,
          loginOpacity: data.data.loginOpacity || 0.8,
          loginBackground: data.data.loginBackground || DEFAULT_BG
        })
        navigate('/upload')
      } else {
        setError(data.message || '用户名或密码错误')
      }
    } catch (error) {
      setError('网络错误，请确保后端服务器已启动')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className={`login-container ${siteSettings.loginTransparent ? 'transparent-mode' : ''}`}
      style={{
        '--login-opacity': siteSettings.loginOpacity
      }}
    >
      {siteSettings.loginBackground && (
        siteSettings.loginBackground.endsWith('.mp4') || siteSettings.loginBackground.endsWith('.webm') || siteSettings.loginBackground.endsWith('.ogg') ? (
          <video className="login-bg-video" autoPlay muted loop playsInline>
            <source src={siteSettings.loginBackground} type={`video/${siteSettings.loginBackground.split('.').pop()}`} />
          </video>
        ) : (
          <div className="login-bg-image" style={{ backgroundImage: `url(${siteSettings.loginBackground})` }}></div>
        )
      )}
      <div className="login-left"></div>
      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <img src="/logo.png" alt="Logo" />
            </div>
            <h1>{siteSettings.siteTitle}</h1>
            <p>高效、稳定的图片托管服务</p>
          </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

          {!hasConfig && (
            <div className="login-footer">
              <p className="login-hint">
                首次使用请先 <button className="link-button" onClick={() => navigate('/settings')}>配置设置</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
