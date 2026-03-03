const API_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

// Auth API
export const authApi = {
  login: async (username, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Voters API
export const votersApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/voters${params ? `?${params}` : ''}`);
  },

  getById: async (id) => {
    return request(`/voters/${id}`);
  },

  create: async (voter) => {
    return request('/voters', {
      method: 'POST',
      body: JSON.stringify(voter),
    });
  },

  update: async (id, voter) => {
    return request(`/voters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(voter),
    });
  },

  vote: async (id) => {
    return request(`/voters/${id}/vote`, {
      method: 'POST',
    });
  },

  import: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getToken();
    const response = await fetch(`${API_URL}/voters/import`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en la importación');
    }
    
    return data;
  },

  getStats: async () => {
    return request('/voters/stats/summary');
  },

  getReferrers: async () => {
    return request('/voters/referrers');
  },

  getMesas: async () => {
    return request('/voters/mesas');
  },

  deleteAll: async () => {
    return request('/voters/all', {
      method: 'DELETE',
    });
  },
};

export default { authApi, votersApi };
