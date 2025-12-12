// API Configuration
const API_URL = 'http://localhost:3000/api'; // Change this to your backend URL

// API Client
class API {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(username, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    this.setToken(data.token);
    return data;
  }

  // Tree endpoints
  async getTrees() {
    return this.request('/trees');
  }

  async plantTree(plotNumber, position, seedType) {
    return this.request('/trees/plant', {
      method: 'POST',
      body: JSON.stringify({ plotNumber, position, seedType })
    });
  }

  async waterTree(treeId) {
    return this.request(`/trees/${treeId}/water`, {
      method: 'POST'
    });
  }

  async harvestTree(treeId) {
    return this.request(`/trees/${treeId}/harvest`, {
      method: 'POST'
    });
  }

  async updateGrowth() {
    return this.request('/trees/update-growth', {
      method: 'POST'
    });
  }
}

// Initialize API client
const api = new API();