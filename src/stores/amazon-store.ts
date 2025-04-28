import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type AmazonData = {
  id: string;
  name: string;
  price: number;
  processed?: boolean;
};

type AmazonStore = {
  data: AmazonData[];
  setData: (data: AmazonData[]) => void;
  clearData: () => void;
};

export const useAmazonStore = create<AmazonStore>()(
  immer((set) => ({
    data: [],
    setData: (data) => set({ data }),
    clearData: () => set({ data: [] }),
  })),
);

export type { AmazonData };
