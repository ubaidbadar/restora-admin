export type AdminRole = 'owner' | 'analyst' | 'support';
export interface AdminMe { id: string; email: string; role: AdminRole }
export interface RestaurantRow { id: string; name: string; status: string; createdAt?: string; updatedAt?: string }
export interface RestaurantList { rows: RestaurantRow[]; count: number; page: number; pageSize: number }
export interface OverviewData {
  restaurants: number; branches: number; orders: number; customers: number; waConnected: number;
  latestRestaurants: RestaurantRow[];
}
export interface RestaurantDetail {
  restaurant: RestaurantRow;
  branches: { id: string; name: string; city?: string; isActive: boolean }[];
  staffCount: number; orderCount: number; customerCount: number;
  connections: { id: string; branchId: string; number: string; status: string; connectedAt?: string; invoiceOnComplete?: boolean }[];
  recentOrders: { id: string; dailyToken: number; branchId: string; type: string; status: string; paymentStatus: string; total: number; createdAt?: string }[];
}
export interface TeamMember { userId: string; email: string; role: AdminRole; enabled: boolean; createdAt?: string }
