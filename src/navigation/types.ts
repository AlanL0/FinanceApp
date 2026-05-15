import type { NavigatorScreenParams } from '@react-navigation/native';

export type SearchStackParamList = {
  SearchHome: undefined;
  StockDetail: {
    symbol: string;
    description?: string;
  };
  Watchlist: { returnToHome?: boolean } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: NavigatorScreenParams<SearchStackParamList> | undefined;
  Portfolio: undefined;
  Learn: undefined;
  Profile: undefined;
};
