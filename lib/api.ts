import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // User management
  getUser(): any {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setUser(user: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  // Auth endpoints
  async register(data: any) {
    const response = await this.client.post('/auth/register', data);
    if (response.data.data.tokens) {
      this.setToken(response.data.data.tokens.accessToken);
      this.setUser(response.data.data.user);
    }
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.data.tokens) {
      this.setToken(response.data.data.tokens.accessToken);
      this.setUser(response.data.data.user);
    }
    return response.data;
  }

  async logout() {
    this.clearToken();
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async changePassword(data: any) {
    const response = await this.client.post('/auth/change-password', data);
    return response.data;
  }

  // Inventory endpoints
  async getMedicines(params?: any) {
    const response = await this.client.get('/inventory/medicines', { params });
    return response.data;
  }

  async getMedicineById(id: string) {
    const response = await this.client.get(`/inventory/medicines/${id}`);
    return response.data;
  }

  async searchMedicines(query: string, limit?: number) {
    const response = await this.client.get('/inventory/medicines/search', {
      params: { q: query, limit },
    });
    return response.data;
  }

  async createMedicine(data: any) {
    const response = await this.client.post('/inventory/medicines', data);
    return response.data;
  }

  async updateMedicine(id: string, data: any) {
    const response = await this.client.put(`/inventory/medicines/${id}`, data);
    return response.data;
  }

  async getInventorySummary() {
    const response = await this.client.get('/inventory/summary');
    return response.data;
  }

  async getExpiryAlerts(days?: number) {
    const response = await this.client.get('/inventory/alerts/expiry', {
      params: { days },
    });
    return response.data;
  }

  async getLowStockAlerts() {
    const response = await this.client.get('/inventory/alerts/low-stock');
    return response.data;
  }

  async addBatch(data: any) {
    const response = await this.client.post('/inventory/batches', data);
    return response.data;
  }

  async getBatchesByMedicine(medicineId: string) {
    const response = await this.client.get(`/inventory/batches/medicine/${medicineId}`);
    return response.data;
  }

  async getBatchById(batchId: string) {
    const response = await this.client.get(`/inventory/batches/${batchId}`);
    return response.data;
  }

  // Sales endpoints
  async createSale(data: any) {
    const response = await this.client.post('/sales/sales', data);
    return response.data;
  }

  async getSales(params?: any) {
    const response = await this.client.get('/sales/sales', { params });
    return response.data;
  }

  async getTodaysSales() {
    const response = await this.client.get('/sales/sales/today');
    return response.data;
  }

  async getSaleByInvoice(invoiceNumber: string) {
    const response = await this.client.get(`/sales/sales/invoice/${invoiceNumber}`);
    return response.data;
  }

  async returnSale(id: string, data: any) {
    const response = await this.client.post(`/sales/sales/${id}/return`, data);
    return response.data;
  }

  async getDailySalesReport(date?: string) {
    const response = await this.client.get('/sales/reports/daily', {
      params: { date },
    });
    return response.data;
  }

  // Customer endpoints
  async getCustomers(params?: any) {
    const response = await this.client.get('/customers/customers', { params });
    return response.data;
  }

  async getCustomerById(id: string) {
    const response = await this.client.get(`/customers/customers/${id}`);
    return response.data;
  }

  async getCustomerByPhone(phone: string) {
    const response = await this.client.get(`/customers/customers/phone/${phone}`);
    return response.data;
  }

  async createCustomer(data: any) {
    const response = await this.client.post('/customers/customers', data);
    return response.data;
  }

  async updateCustomer(id: string, data: any) {
    const response = await this.client.put(`/customers/customers/${id}`, data);
    return response.data;
  }

  async recordDuePayment(id: string, data: any) {
    const response = await this.client.post(`/customers/customers/${id}/pay-due`, data);
    return response.data;
  }

  async getCustomerPurchases(id: string, params?: any) {
    const response = await this.client.get(`/customers/customers/${id}/purchases`, { params });
    return response.data;
  }

  // Supplier endpoints
  async getSuppliers(params?: any) {
    const response = await this.client.get('/suppliers', { params });
    return response.data;
  }

  async getSupplierById(id: string) {
    const response = await this.client.get(`/suppliers/${id}`);
    return response.data;
  }

  async createSupplier(data: any) {
    const response = await this.client.post('/suppliers', data);
    return response.data;
  }

  async updateSupplier(id: string, data: any) {
    const response = await this.client.put(`/suppliers/${id}`, data);
    return response.data;
  }

  async toggleSupplierStatus(id: string, isActive: boolean) {
    const response = await this.client.patch(`/suppliers/${id}/status`, { isActive });
    return response.data;
  }

  async deleteSupplier(id: string) {
    const response = await this.client.delete(`/suppliers/${id}`);
    return response.data;
  }

  // Purchase endpoints
  async getPurchases(params?: any) {
    const response = await this.client.get('/purchases', { params });
    return response.data;
  }

  async getPurchaseById(id: string) {
    const response = await this.client.get(`/purchases/${id}`);
    return response.data;
  }

  async createPurchase(data: any) {
    const response = await this.client.post('/purchases', data);
    return response.data;
  }

  async receivePurchase(id: string, data: any) {
    const response = await this.client.post(`/purchases/${id}/receive`, data);
    return response.data;
  }

  async recordPurchasePayment(id: string, data: any) {
    const response = await this.client.post(`/purchases/${id}/payments`, data);
    return response.data;
  }

  async cancelPurchase(id: string, data?: any) {
    const response = await this.client.post(`/purchases/${id}/cancel`, data);
    return response.data;
  }

  // Admin endpoints
  async registerAdmin(data: any) {
    const response = await this.client.post('/admin/register', data);
    if (response.data.data.tokens) {
      this.setToken(response.data.data.tokens.accessToken);
      this.setUser(response.data.data.admin);
    }
    return response.data;
  }

  async loginAdmin(email: string, password: string) {
    const response = await this.client.post('/admin/login', { email, password });
    if (response.data.data.tokens) {
      this.setToken(response.data.data.tokens.accessToken);
      this.setUser(response.data.data.admin);
    }
    return response.data;
  }

  async getAdminDashboard() {
    const response = await this.client.get('/admin/dashboard');
    return response.data;
  }

  async getAdminTenants(params?: any) {
    const response = await this.client.get('/admin/tenants', { params });
    return response.data;
  }

  async updateTenantStatus(tenantId: string, status: string) {
    const response = await this.client.patch(`/admin/tenants/${tenantId}/status`, { status });
    return response.data;
  }

  async getAdminProfile() {
    const response = await this.client.get('/admin/profile');
    return response.data;
  }
}

export const api = new ApiClient();
export default api;

