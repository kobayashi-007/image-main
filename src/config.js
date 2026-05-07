// API 配置
const isProduction = import.meta.env.PROD

export const API_URL = isProduction
  ? '' // 生产环境使用相对路径（与前端同域名）
  : 'http://localhost:3001' // 开发环境
