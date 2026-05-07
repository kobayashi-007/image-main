import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/Settings.css'
import { API_URL } from '../config'

function Settings() {
  const [settings, setSettings] = useState({
    defaultUsername: '',
    defaultPassword: '',
    githubToken: '',
    repo: '',
    branch: 'main',
    siteTitle: 'GitHub 图床',
    loginTransparent: false,
    loginOpacity: 0.8,
    loginBackground: '',
    customDomain: '',
    useCustomDomain: false
  })
  const [originalSettings, setOriginalSettings] = useState({})
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const initSettings = async () => {
      // 优先从 location.state 读取
      let username = location.state?.username
      // 如果没有，尝试从 localStorage 读取当前登录用户
      if (!username) {
        const savedConfig = localStorage.getItem('imageHostConfig')
        if (savedConfig) {
          username = JSON.parse(savedConfig).username
        }
      }
      if (username) {
        await loadUserSettings(username)
      } else {
        // 如果没有找到用户名，尝试检查是否有任何配置
        try {
          const response = await fetch(`${API_URL}/api/settings/test`)
          const data = await response.json()
          if (data.success) {
            // 如果有配置但不知道用户名，先不加载，让用户填写
          }
        } catch {
          // 忽略错误
        }
      }
    }
    initSettings()
  }, [location.state])

  const loadUserSettings = async (username) => {
    try {
      const response = await fetch(`${API_URL}/api/settings/${username}`)
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
        setOriginalSettings(data.data)
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async () => {
    // 如果有原有配置，保留原有的 GitHub 配置
    const saveData = { ...settings }
    
    if (Object.keys(originalSettings).length > 0) {
      // 如果是修改已有配置，保留原有的 GitHub 配置
      if (!saveData.githubToken && originalSettings.githubToken) {
        saveData.githubToken = originalSettings.githubToken
      }
      if (!saveData.repo && originalSettings.repo) {
        saveData.repo = originalSettings.repo
      }
      if (!saveData.branch && originalSettings.branch) {
        saveData.branch = originalSettings.branch
      }
      // 用户名密码也保留原有值，如果用户没有修改
      if (!saveData.defaultPassword && originalSettings.defaultPassword) {
        saveData.defaultPassword = originalSettings.defaultPassword
      }
      // 保留原有个性化设置，如果用户没有修改（注意：空字符串表示用户想清空）
      if (typeof originalSettings.loginOpacity !== 'undefined' && typeof saveData.loginOpacity === 'undefined') {
        saveData.loginOpacity = originalSettings.loginOpacity
      }
      if (typeof originalSettings.loginTransparent !== 'undefined' && typeof saveData.loginTransparent === 'undefined') {
        saveData.loginTransparent = originalSettings.loginTransparent
      }
      if (typeof originalSettings.loginBackground !== 'undefined' && typeof saveData.loginBackground === 'undefined') {
        saveData.loginBackground = originalSettings.loginBackground
      }
      if (typeof originalSettings.customDomain !== 'undefined' && typeof saveData.customDomain === 'undefined') {
        saveData.customDomain = originalSettings.customDomain
      }
      if (typeof originalSettings.useCustomDomain !== 'undefined' && typeof saveData.useCustomDomain === 'undefined') {
        saveData.useCustomDomain = originalSettings.useCustomDomain
      }
    } else {
      // 如果是第一次保存，设置默认值
      saveData.siteTitle = saveData.siteTitle || 'GitHub 图床'
      saveData.loginTransparent = saveData.loginTransparent || false
      saveData.loginOpacity = saveData.loginOpacity || 0.8
      saveData.loginBackground = saveData.loginBackground || ''
      saveData.customDomain = saveData.customDomain || ''
      saveData.useCustomDomain = saveData.useCustomDomain || false
    }

    if (!saveData.defaultUsername) {
      setMessage({ type: 'error', text: '请填写用户名' })
      return
    }
    if (!saveData.defaultPassword) {
      setMessage({ type: 'error', text: '请填写密码' })
      return
    }
    if (!saveData.githubToken) {
      setMessage({ type: 'error', text: '请填写 GitHub Token' })
      return
    }
    if (!saveData.repo) {
      setMessage({ type: 'error', text: '请填写仓库名称' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: '设置保存成功！' })
        setTimeout(() => {
          navigate('/')
        }, 1500)
      } else {
        setMessage({ type: 'error', text: data.message || '保存失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请确保后端服务器已启动' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-container">
      <div className="settings-header-bar">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            返回
          </button>
          <h1>系统设置</h1>
        </div>
      </div>

      <div className="settings-grid">
        {message.text && (
          <div className={`notification ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* 网站设置 */}
        <div className="settings-card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
            </svg>
            网站设置
          </div>
          <div className="card-content">
            <div className="setting-item">
              <div className="setting-label">
                <span>网站标题</span>
              </div>
              <div className="setting-control">
                <input
                  type="text"
                  name="siteTitle"
                  value={settings.siteTitle}
                  onChange={handleChange}
                  className="setting-input"
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>默认用户名</span>
                <span className="required">*</span>
              </div>
              <div className="setting-control">
                <input
                  type="text"
                  name="defaultUsername"
                  value={settings.defaultUsername}
                  onChange={handleChange}
                  className="setting-input"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>默认密码</span>
                <span className="required">*</span>
              </div>
              <div className="setting-control">
                <input
                  type="password"
                  name="defaultPassword"
                  value={settings.defaultPassword}
                  onChange={handleChange}
                  className="setting-input"
                  placeholder="请输入密码"
                />
              </div>
            </div>
          </div>
        </div>

        {/* GitHub 设置 */}
        <div className="settings-card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"></path>
            </svg>
            GitHub 设置
          </div>
          <div className="card-content">
            <div className="setting-item">
              <div className="setting-label">
                <span>GitHub Token</span>
                <span className="required">*</span>
              </div>
              <div className="setting-control">
                <input
                  type="password"
                  name="githubToken"
                  value={settings.githubToken}
                  onChange={handleChange}
                  className="setting-input"
                  placeholder="ghp_xxxxxxxxxxxxxxxx"
                />
                <p className="setting-hint">如果将此项目推送到公开仓库，请不要填写真实Token！</p>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>仓库名称</span>
                <span className="required">*</span>
              </div>
              <div className="setting-control">
                <input
                  type="text"
                  name="repo"
                  value={settings.repo}
                  onChange={handleChange}
                  className="setting-input"
                  placeholder="用户名/仓库名"
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>分支名称</span>
              </div>
              <div className="setting-control">
                <input
                  type="text"
                  name="branch"
                  value={settings.branch}
                  onChange={handleChange}
                  className="setting-input"
                  placeholder="main 或 master"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 个性化设置 */}
        <div className="settings-card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
            个性化设置
          </div>
          <div className="card-content">
            <div className="setting-item">
              <div className="setting-label">
                <span>登录透明效果</span>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="loginTransparent"
                    checked={settings.loginTransparent}
                    onChange={(e) => setSettings({ ...settings, loginTransparent: e.target.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            {settings.loginTransparent && (
              <div className="setting-item">
                <div className="setting-label">
                  <span>透明程度</span>
                </div>
                <div className="setting-control">
                  <div className="opacity-slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.loginOpacity * 100}
                      onChange={(e) => setSettings({ ...settings, loginOpacity: e.target.value / 100 })}
                      className="opacity-slider"
                    />
                    <span className="opacity-value">{Math.round(settings.loginOpacity * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="setting-item">
              <div className="setting-label">
                <span>登录背景</span>
              </div>
              <div className="setting-control">
                <input
                  type="text"
                  name="loginBackground"
                  value={settings.loginBackground}
                  onChange={handleChange}
                  className="setting-input"
                  placeholder="图片或视频链接"
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>图片域名</span>
              </div>
              <div className="setting-control">
                <input
                  type="text"
                  name="customDomain"
                  value={settings.customDomain}
                  onChange={handleChange}
                  className="setting-input"
                  placeholder="https://域名.com/"
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>使用自定义域名</span>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="useCustomDomain"
                    checked={settings.useCustomDomain}
                    onChange={(e) => setSettings({ ...settings, useCustomDomain: e.target.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div className="settings-card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            关于
          </div>
          <div className="card-content">
            <div className="about-item">
              <span className="about-label">项目名称</span>
              <span className="about-value">GitHub 图床</span>
            </div>
            <div className="about-item">
              <span className="about-label">版本</span>
              <span className="about-value">v1.0.0</span>
            </div>
            <div className="about-item">
              <span className="about-label">技术栈</span>
              <span className="about-value">React + Express</span>
            </div>
            <div className="about-item">
              <span className="about-label">GitHub</span>
              <a href="#" className="about-link">https://github.com</a>
            </div>
          </div>
        </div>

      </div>

      <div className="save-bar">
        <button className="save-btn" onClick={handleSave} disabled={loading}>
          {loading ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  )
}

export default Settings
