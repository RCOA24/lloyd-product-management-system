import { MedicineBoxOutlined } from '@ant-design/icons'

interface BrandLockupProps {
  compact?: boolean
}

export function BrandLockup({ compact = false }: BrandLockupProps) {
  return (
    <div className={`brand-lockup${compact ? ' brand-lockup--compact' : ''}`}>
      <span className="brand-symbol" aria-hidden="true">
        <MedicineBoxOutlined />
      </span>
      <span>
        <strong>Lloyd Product Management</strong>
        <small>Technical examination system</small>
      </span>
    </div>
  )
}
