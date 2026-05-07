import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../styles/Upload.css'

function Upload() {
  const [config, setConfig] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [items, setItems] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [viewingImage, setViewingImage] = useState(null)
  const [repoSize, setRepoSize] = useState(0)
  const [loadingSize, setLoadingSize] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

  const GITHUB_LIMIT = 1024 * 1024 * 1024 // 1GB

  // 生成图片URL的函数
  const getImageUrl = (currentConfig, path) => {
    if (currentConfig.useCustomDomain && currentConfig.customDomain) {
      return `${currentConfig.customDomain}/${path}`
    }
    return `https://cdn.jsdelivr.net/gh/${currentConfig.repo}@${currentConfig.branch}/${path}`
  }

  useEffect(() => {
    const savedConfig = localStorage.getItem('imageHostConfig')
    if (!savedConfig) {
      navigate('/')
      return
    }
    const parsedConfig = JSON.parse(savedConfig)
    setConfig(parsedConfig)
    loadDirectory(parsedConfig, '')
  }, [navigate])

  const handleClickOutside = (e) => {
    if (!e.target.closest('.user-dropdown')) {
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const loadDirectory = useCallback(async (currentConfig, path) => {
    if (!currentConfig) return
    setLoading(true)
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${currentConfig.repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${currentConfig.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )

      const dirs = []
      const images = []

      for (const item of response.data) {
        if (item.type === 'dir') {
          dirs.push({
            type: 'folder',
            name: item.name,
            path: item.path
          })
        } else if (item.type === 'file' && /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(item.name)) {
          images.push({
            type: 'image',
            name: item.name,
            path: item.path,
            sha: item.sha,
            url: getImageUrl(currentConfig, item.path),
            size: item.size
          })
        }
      }

      dirs.sort((a, b) => a.name.localeCompare(b.name))
      images.sort((a, b) => b.name.localeCompare(a.name))

      setItems([...dirs, ...images])
      setCurrentPath(path)
    } catch (error) {
      console.error('加载目录失败:', error)
      if (error.response?.status === 404) {
        setItems([])
      } else {
        setMessage({ type: 'error', text: '加载目录失败' })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateRepoSize = useCallback(async (currentConfig) => {
    if (!currentConfig) return
    setLoadingSize(true)
    
    let totalSize = 0
    
    const traverseDirectory = async (path = '') => {
      try {
        const response = await axios.get(
          `https://api.github.com/repos/${currentConfig.repo}/contents/${path}`,
          {
            headers: {
              'Authorization': `token ${currentConfig.githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        )
        
        for (const item of response.data) {
          if (item.type === 'file') {
            totalSize += item.size
          } else if (item.type === 'dir') {
            await traverseDirectory(item.path)
          }
        }
      } catch (error) {
        console.error('遍历目录失败:', error)
      }
    }
    
    await traverseDirectory()
    setRepoSize(totalSize)
    setLoadingSize(false)
  }, [])

  useEffect(() => {
    if (config) {
      calculateRepoSize(config)
    }
  }, [config, calculateRepoSize])

  const navigateToFolder = (path) => {
    loadDirectory(config, path)
  }

  const goBack = () => {
    if (!currentPath) return
    const parts = currentPath.split('/')
    parts.pop()
    const parentPath = parts.join('/')
    loadDirectory(config, parentPath)
  }

  const handleLogout = () => {
    localStorage.removeItem('imageHostConfig')
    navigate('/')
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: '请选择图片文件' })
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
      setMessage({ type: '', text: '' })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: '请选择图片文件' })
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
      setMessage({ type: '', text: '' })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const uploadToGitHub = async (file) => {
    const { githubToken, repo, branch } = config
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop()
    const path = currentPath ? `${currentPath}/${timestamp}-${random}.${ext}` : `${timestamp}-${random}.${ext}`

    const reader = new FileReader()
    
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1]
          
          await axios.put(
            `https://api.github.com/repos/${repo}/contents/${path}`,
            {
              message: `Upload image: ${file.name}`,
              content: base64,
              branch: branch
            },
            {
              headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          )

          resolve({
            type: 'image',
            name: file.name,
            path: path,
            url: getImageUrl(config, path),
            size: file.size
          })
        } catch (error) {
          reject(error)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await uploadToGitHub(selectedFile)
      setItems(prev => [result, ...prev.filter(item => item.type === 'image')])
      setSelectedFile(null)
      setPreview(null)
      setMessage({ type: 'success', text: '上传成功！' })
      
      // 更新仓库大小
      setRepoSize(prev => prev + selectedFile.size)
      
      setTimeout(() => {
        loadDirectory(config, currentPath)
        calculateRepoSize(config)
      }, 1000)
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '上传失败，请检查配置' 
      })
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (image) => {
    if (!window.confirm(`确定要删除图片 "${image.name}" 吗？`)) {
      return
    }

    try {
      await axios.delete(
        `https://api.github.com/repos/${config.repo}/contents/${image.path}`,
        {
          headers: {
            'Authorization': `token ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          data: {
            message: `Delete image: ${image.name}`,
            sha: image.sha,
            branch: config.branch
          }
        }
      )

      setMessage({ type: 'success', text: '删除成功！' })
      
      // 更新仓库大小
      setRepoSize(prev => prev - image.size)
      
      loadDirectory(config, currentPath)
      setTimeout(() => {
        calculateRepoSize(config)
      }, 500)
    } catch (error) {
      console.error('Delete error:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '删除失败' 
      })
    }
  }

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url)
    setMessage({ type: 'success', text: '链接已复制！' })
    setTimeout(() => setMessage({ type: '', text: '' }), 2000)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getExtension = (filename) => {
    return filename.split('.').pop().toUpperCase()
  }

  const getBreadcrumbs = () => {
    if (!currentPath) return [{ name: '根目录', path: '' }]
    const parts = currentPath.split('/')
    const crumbs = [{ name: '根目录', path: '' }]
    let current = ''
    for (const part of parts) {
      current = current ? `${current}/${part}` : part
      crumbs.push({ name: part, path: current })
    }
    return crumbs
  }

  if (!config) return null

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="upload-container">
      <div className="upload-header">
        <div className="header-left">
          <div className="logo-small">
            <img src="/logo.png" alt="Logo" />
          </div>
          <div>
            <h2>GitHub 图床</h2>
            <p className="repo-info">{config.repo}</p>
          </div>
        </div>
        <div className="header-right">
          <button className="refresh-button" onClick={() => loadDirectory(config, currentPath)} title="刷新">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
            </svg>
          </button>
          <div className="user-dropdown">
            <button 
              className="user-dropdown-button" 
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="user-avatar">{config.username?.charAt(0).toUpperCase()}</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </button>
            {showDropdown && (
              <div className="user-dropdown-menu">
                <div className="user-info">
                  <div className="user-name">欢迎，{config.username}</div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/settings'); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"></path>
                    <path d="M19.4 15a1 1 0 100 2h1a1 1 0 100-2h-1"></path>
                    <path d="M12 19a7 7 0 100-14 7 7 0 000 14z"></path>
                  </svg>
                  设置
                </button>
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                    <polyline points="16 17l5-5-5-5"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="upload-content">
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="toolbar">
          <div className="toolbar-left">
            <div className="path-bar">
              {currentPath && (
                <button className="path-button" onClick={goBack} title="返回上一级">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"></path>
                  </svg>
                </button>
              )}
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="path-item">
                  {index > 0 && <span className="path-separator">/</span>}
                  <button 
                    className="path-link" 
                    onClick={() => navigateToFolder(crumb.path)}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="toolbar-right">
            <div className="storage-info">
              <div className="storage-progress-container">
                <div className="storage-progress-bar" style={{ width: `${Math.min((repoSize / GITHUB_LIMIT) * 100, 100)}%` }}></div>
              </div>
              <div className="storage-text">
                {loadingSize ? '计算中...' : `${formatSize(repoSize)} / ${formatSize(GITHUB_LIMIT)}`}
              </div>
            </div>
            <label className="toolbar-button primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              上传
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden-input"
              />
            </label>
          </div>
        </div>

        {selectedFile && (
          <div className="upload-preview-bar">
            <div className="preview-mini">
              <img src={preview} alt="Preview" />
            </div>
            <span className="preview-name">{selectedFile.name}</span>
            <div className="preview-actions">
              <button className="action-button cancel" onClick={() => { setSelectedFile(null); setPreview(null); }}>
                取消
              </button>
              <button className="action-button confirm" onClick={handleUpload} disabled={uploading}>
                {uploading ? '上传中...' : '确认上传'}
              </button>
            </div>
          </div>
        )}

        <div className="file-manager-section">
          <div className="section-header">
            <div className="header-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>文件</span>
              <span className="count-info">
                {loading ? '加载中...' : `已全部加载，共 ${items.length} 个`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner"></div>
              <p>正在加载...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"></path>
              </svg>
              <p>此目录为空</p>
            </div>
          ) : (
            <div className="file-grid">
              {items.map((item) => (
                item.type === 'folder' ? (
                  <div 
                    key={item.path} 
                    className="file-item folder-item"
                    onClick={() => navigateToFolder(item.path)}
                  >
                    <div className="folder-icon-box">
                      <div className="folder-back"></div>
                      <div className="folder-front"></div>
                    </div>
                    <p className="file-name">{item.name}</p>
                  </div>
                ) : (
                  <div key={item.path} className="file-item image-item">
                    <div className="image-wrapper-box" onClick={() => setViewingImage(item)}>
                      <img src={item.url} alt={item.name} className="card-image" loading="lazy" />
                      <div className="image-actions">
                        <button 
                          className="icon-button"
                          onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }}
                          title="复制链接"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                        </button>
                        <button 
                          className="icon-button danger"
                          onClick={(e) => { e.stopPropagation(); deleteImage(item); }}
                          title="删除"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="file-name" title={item.name} onClick={() => setViewingImage(item)}>{item.name}</p>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 图片查看器 */}
      {viewingImage && (
        <div className="image-viewer" onClick={() => setViewingImage(null)}>
          <div className="viewer-content" onClick={(e) => e.stopPropagation()}>
            <div className="viewer-header">
              <span className="viewer-title">{viewingImage.name}</span>
              <button className="viewer-close" onClick={() => setViewingImage(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="viewer-image">
              <img src={viewingImage.url} alt={viewingImage.name} />
            </div>
            <div className="viewer-footer">
              <div className="viewer-info">
                <span className="info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {getExtension(viewingImage.name)}
                </span>
                <span className="info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4"></path>
                    <path d="M12 18v4"></path>
                    <path d="M4.93 4.93l2.83 2.83"></path>
                    <path d="M16.24 16.24l2.83 2.83"></path>
                    <path d="M2 12h4"></path>
                    <path d="M18 12h4"></path>
                    <path d="M4.93 19.07l2.83-2.83"></path>
                    <path d="M16.24 7.76l2.83-2.83"></path>
                  </svg>
                  {formatSize(viewingImage.size)}
                </span>
              </div>
              <div className="viewer-actions">
                <button className="copy-link-btn" onClick={() => copyUrl(viewingImage.url)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  复制图片链接
                </button>
                <a href={viewingImage.url} download={viewingImage.name} className="download-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  下载图片
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Upload
