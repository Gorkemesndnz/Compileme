import { create } from 'zustand'

interface EducationTreeState {
  expandedNodes: Record<string, boolean>
  toggleNode: (nodeId: string) => void
  setNodeExpanded: (nodeId: string, expanded: boolean) => void
  clearExpandedNodes: () => void
}

export const useEducationTreeStore = create<EducationTreeState>((set) => ({
  expandedNodes: {},
  toggleNode: (nodeId) =>
    set((state) => ({
      expandedNodes: {
        ...state.expandedNodes,
        [nodeId]: !state.expandedNodes[nodeId],
      },
    })),
  setNodeExpanded: (nodeId, expanded) =>
    set((state) => ({
      expandedNodes: {
        ...state.expandedNodes,
        [nodeId]: expanded,
      },
    })),
  clearExpandedNodes: () => set({ expandedNodes: {} }),
}))
