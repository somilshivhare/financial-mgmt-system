export default function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-inner">
        <div className="mkt-footer-brand">
          <div className="mkt-footer-logo" aria-hidden="true" />
          <div>
            <div className="mkt-footer-name">Nbaurum</div>
            <div className="mkt-footer-tagline">Your Dues. Our Duty.</div>
          </div>
        </div>

        <div className="mkt-footer-meta">
          <span>© {new Date().getFullYear()} Nbaurum. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}


