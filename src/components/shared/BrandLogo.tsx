import logoUrl from '../../assets/logo-horizontal-reversed.svg'

type Props = {
  subtitle?: string
  admin?: boolean
}

export default function BrandLogo({ subtitle, admin = false }: Props) {
  return <span className={`brand-lockup${admin ? ' brand-lockup--admin' : ''}`}>
    <span className="brand-lockup__mark">
      <img className="brand-lockup__image" src={logoUrl} alt="EventHub" />
    </span>
    {subtitle && <span className="brand-lockup__copy"><small>{subtitle}</small></span>}
  </span>
}
