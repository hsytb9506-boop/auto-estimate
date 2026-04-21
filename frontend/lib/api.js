import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// 요청마다 토큰 자동 첨부
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 → 로그인 페이지
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// AUTH
export const login = (d) => api.post('/auth/login', d).then(r => r.data)
export const getMe = () => api.get('/auth/me').then(r => r.data)

// DOMAINS
export const getDomains = () => api.get('/domains').then(r => r.data)

// CATEGORIES
export const getCategories = (domain) =>
  api.get(`/categories?domain=${domain}`).then(r => r.data)
export const createCategory = (d) => api.post('/categories', d).then(r => r.data)
export const updateCategory = (id, d) => api.put(`/categories/${id}`, d).then(r => r.data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then(r => r.data)

// ITEMS
export const getItems = (domain, categoryId, activeOnly = true) => {
  let url = `/items?domain=${domain}&active_only=${activeOnly}`
  if (categoryId) url += `&category_id=${categoryId}`
  return api.get(url).then(r => r.data)
}
export const getItem = (id) => api.get(`/items/${id}`).then(r => r.data)
export const createItem = (d) => api.post('/items', d).then(r => r.data)
export const updateItem = (id, d) => api.put(`/items/${id}`, d).then(r => r.data)
export const deleteItem = (id) => api.delete(`/items/${id}`).then(r => r.data)

// PRICES
export const updatePrice = (itemId, d) =>
  api.put(`/prices/${itemId}`, d).then(r => r.data)
export const getPriceHistory = (itemId) =>
  api.get(`/prices/${itemId}/history`).then(r => r.data)
export const bulkUpdatePrices = (updates) =>
  api.post('/prices/bulk-json', updates).then(r => r.data)

// PERCENTAGES
export const getPercentages = (domain) =>
  api.get(`/percentages?domain=${domain}`).then(r => r.data)
export const updatePercentage = (id, d) =>
  api.put(`/percentages/${id}`, d).then(r => r.data)

// QUOTES
export const listQuotes = (domain) =>
  api.get(`/quotes?domain=${domain}`).then(r => r.data)
export const getQuote = (id) => api.get(`/quotes/${id}`).then(r => r.data)
export const createQuote = (d) => api.post('/quotes', d).then(r => r.data)
export const updateQuote = (id, d) => api.put(`/quotes/${id}`, d).then(r => r.data)
export const deleteQuote = (id) => api.delete(`/quotes/${id}`).then(r => r.data)

// EXPORT
export const exportExcel = async (id, quoteNumber) => {
  const res = await api.get(`/quotes/${id}/excel`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url; a.download = `견적서_${quoteNumber}.xlsx`; a.click()
  URL.revokeObjectURL(url)
}

export default api
