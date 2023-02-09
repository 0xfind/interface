import { createContext } from "react"

export const MISSING_PROVIDER = Symbol()
export const BlockNumberContext = createContext<
  | {
    value?: number
    fastForward(block: number): void
  }
  | typeof MISSING_PROVIDER
>(MISSING_PROVIDER)