import type { ReactNode } from 'react'
import './SectionHeading.css'

interface SectionHeadingProps {
  children: ReactNode
}

function SectionHeading({ children }: SectionHeadingProps) {
  return <h2 className="section-heading">{children}</h2>
}

export default SectionHeading
