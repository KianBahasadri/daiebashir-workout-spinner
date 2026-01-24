import { type ReactNode } from 'react'

// Helper components for math notation
export const Frac = ({ num, den }: { num: ReactNode; den: ReactNode }) => (
  <span className="math-frac">
    <span className="math-frac-num">{num}</span>
    <span className="math-frac-den">{den}</span>
  </span>
)

export const Sup = ({ children }: { children: ReactNode }) => (
  <sup className="math-sup">{children}</sup>
)

export const Sub = ({ children }: { children: ReactNode }) => (
  <sub className="math-sub">{children}</sub>
)

export const Var = ({ children }: { children: ReactNode }) => (
  <span className="math-var">{children}</span>
)

export const Num = ({ children }: { children: ReactNode }) => (
  <span className="math-num">{children}</span>
)

export const Op = ({ children }: { children: ReactNode }) => (
  <span className="math-op">{children}</span>
)
