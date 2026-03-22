import { create } from "zustand";
import type { Position, Trade } from "@/types/api";

interface PortfolioState {
  positions: Position[];
  trades: Trade[];
  buyingPower: number;
  totalValue: number;
  setPositions: (positions: Position[]) => void;
  setTrades: (trades: Trade[]) => void;
  setBuyingPower: (buyingPower: number) => void;
  setTotalValue: (totalValue: number) => void;
  addTrade: (trade: Trade) => void;
  updatePosition: (position: Position) => void;
  removePosition: (ticker: string) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  positions: [],
  trades: [],
  buyingPower: 100000,
  totalValue: 100000,
  setPositions: (positions) => set({ positions }),
  setTrades: (trades) => set({ trades }),
  setBuyingPower: (buyingPower) => set({ buyingPower }),
  setTotalValue: (totalValue) => set({ totalValue }),
  addTrade: (trade) => set((s) => ({ trades: [trade, ...s.trades] })),
  updatePosition: (position) =>
    set((s) => ({
      positions: s.positions.some((p) => p.id === position.id)
        ? s.positions.map((p) => (p.id === position.id ? position : p))
        : [...s.positions, position],
    })),
  removePosition: (ticker) =>
    set((s) => ({ positions: s.positions.filter((p) => p.ticker !== ticker) })),
}));
