const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  health: () => request('/health'),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  getProfile: () => request('/users/profile'),
  updateProfile: (body) => request('/users/profile', { method: 'PUT', body }),
  deleteProfile: () => request('/users/profile', { method: 'DELETE' }),
  getUsers: () => request('/users'),
  getUser: (id) => request(`/users/${id}`),
  createUser: (body) => request('/users', { method: 'POST', body }),
  updateUser: (id, body) => request(`/users/${id}`, { method: 'PUT', body }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  getRestaurants: () => request('/restaurants'),
  getRestaurant: (id) => request(`/restaurants/${id}`),
  createRestaurant: (body) => request('/restaurants', { method: 'POST', body }),
  updateRestaurant: (id, body) => request(`/restaurants/${id}`, { method: 'PUT', body }),
  deleteRestaurant: (id) => request(`/restaurants/${id}`, { method: 'DELETE' }),
  getCategories: () => request('/categories'),
  getCategory: (id) => request(`/categories/${id}`),
  createCategory: (body) => request('/categories', { method: 'POST', body }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PUT', body }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  getFoodItems: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/food-items${query ? `?${query}` : ''}`);
  },
  createFoodItem: (body) => request('/food-items', { method: 'POST', body }),
  updateFoodItem: (id, body) => request(`/food-items/${id}`, { method: 'PUT', body }),
  deleteFoodItem: (id) => request(`/food-items/${id}`, { method: 'DELETE' }),
  uploadFoodImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = getToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/food-items/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Image upload failed');
    return data;
  },
  getCart: () => request('/cart'),
  addToCart: (body) => request('/cart/items', { method: 'POST', body }),
  removeFromCart: (foodItemId) => request(`/cart/items/${foodItemId}`, { method: 'DELETE' }),
  clearCart: () => request('/cart', { method: 'DELETE' }),
  checkout: (body) => request('/orders/checkout', { method: 'POST', body }),
  getOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  updateOrder: (id, body) => request(`/orders/${id}`, { method: 'PUT', body }),
  updateOrderStatus: (id, body) => request(`/orders/${id}`, { method: 'PUT', body }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  getPayments: () => request('/payments'),
  getPayment: (id) => request(`/payments/${id}`),
  createPayment: (body) => request('/payments', { method: 'POST', body }),
  updatePayment: (id, body) => request(`/payments/${id}`, { method: 'PUT', body }),
  deletePayment: (id) => request(`/payments/${id}`, { method: 'DELETE' }),
  getDeliveries: () => request('/delivery'),
  getDelivery: (id) => request(`/delivery/${id}`),
  createDelivery: (body) => request('/delivery', { method: 'POST', body }),
  updateDelivery: (id, body) => request(`/delivery/${id}`, { method: 'PUT', body }),
  deleteDelivery: (id) => request(`/delivery/${id}`, { method: 'DELETE' }),
  getAllCarts: () => request('/cart/admin/all'),
  deleteCart: (customerId) => request(`/cart/admin/${customerId}`, { method: 'DELETE' }),
};
