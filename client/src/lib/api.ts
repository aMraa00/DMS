import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
})

/** Нэвтрэх/бүртгэлийн 401 нь «session дууссан» биш — refresh + retry хэрэггүй */
function isAuthPublicRoute(config: { url?: string }) {
  const path = (config.url ?? '').split('?')[0]
  return (
    path.includes('/auth/login') ||
    path.includes('/auth/register') ||
    path.includes('/auth/refresh')
  )
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const prev = err.config
    if (!prev || prev.skipRefresh) return Promise.reject(err)
    if (err.response?.status === 401) {
      if (isAuthPublicRoute(prev)) return Promise.reject(err)
      if (prev.__retry) return Promise.reject(err)
      prev.__retry = true
      try {
        await api.post('/auth/refresh', undefined, { skipRefresh: true })
        return api(prev)
      } catch {
        return Promise.reject(err)
      }
    }
    return Promise.reject(err)
  },
)
