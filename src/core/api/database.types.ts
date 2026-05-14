export type TradeSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type TradeStatus = 'executed' | 'pending' | 'cancelled';
export type PendingOrderStatus = 'pending' | 'filled' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  virtual_balance: number;
  created_at: string;
}

export interface Holding {
  id: string;
  user_id: string;
  symbol: string;
  shares: number;
  avg_cost_basis: number;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  side: TradeSide;
  order_type: OrderType;
  shares: number;
  price: number;
  total: number;
  status: TradeStatus;
  executed_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  added_at: string;
}

export interface PendingOrder {
  id: string;
  user_id: string;
  symbol: string;
  side: TradeSide;
  limit_price: number;
  shares: number;
  status: PendingOrderStatus;
  created_at: string;
  expires_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      holdings: {
        Row: Holding;
        Insert: Omit<Holding, 'id' | 'updated_at'> & { id?: string; updated_at?: string };
        Update: Partial<Omit<Holding, 'id' | 'user_id'>>;
      };
      trades: {
        Row: Trade;
        Insert: Omit<Trade, 'id' | 'executed_at'> & { id?: string; executed_at?: string };
        Update: Partial<Omit<Trade, 'id' | 'user_id'>>;
      };
      watchlist: {
        Row: WatchlistItem;
        Insert: Omit<WatchlistItem, 'id' | 'added_at'> & { id?: string; added_at?: string };
        Update: Partial<Omit<WatchlistItem, 'id' | 'user_id'>>;
      };
      pending_orders: {
        Row: PendingOrder;
        Insert: Omit<PendingOrder, 'id' | 'created_at' | 'expires_at'> & {
          id?: string;
          created_at?: string;
          expires_at?: string;
        };
        Update: Partial<Omit<PendingOrder, 'id' | 'user_id'>>;
      };
    };
  };
}
