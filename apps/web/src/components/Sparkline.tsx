import React from 'react'

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  strokeWidth?: number
  fill?: string
  zeroBaseline?: boolean
  baselineStroke?: string
  baselineWidth?: number
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  width = 120,
  height = 32,
  stroke = '#60a5fa',
  strokeWidth = 2,
  fill = 'none',
  zeroBaseline = false,
  baselineStroke = '#6b7280',
  baselineWidth = 1,
}) => {
  if (!values || values.length === 0) {
    return <svg width={width} height={height} />
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = values.length > 1 ? width / (values.length - 1) : width
  const points = values.map((v, i) => {
    const x = i * stepX
    // invert y (0 at top). pad 2px
    const y = height - ((v - min) / span) * (height - 4) - 2
    return `${x},${y}`
  })
  const d = `M ${points.join(' L ')}`

  let zeroY: number | null = null
  if (zeroBaseline && min <= 0 && max >= 0) {
    zeroY = height - ((0 - min) / span) * (height - 4) - 2
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {zeroY !== null && (
        <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke={baselineStroke} strokeWidth={baselineWidth} strokeDasharray="3,3" />
      )}
      <path d={d} stroke={stroke} strokeWidth={strokeWidth} fill={fill} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default Sparkline
