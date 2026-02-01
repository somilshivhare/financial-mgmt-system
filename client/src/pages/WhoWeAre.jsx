import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function WhoWeAre() {
  useEffect(() => {
    document.title = 'Who We Are – NB Aurum Solutions Team & Culture'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Meet the team behind NB Aurum Solutions. We build finance software, invoicing, and collections platforms with real-world experience in finance operations.')
    }
  }, [])

  return (
    <>
      <section className="mkt-section-full" aria-labelledby="who-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h1 id="who-heading" className="mkt-section-heading">Who we are</h1>
            <p className="mkt-lead">
              We are product and operations people who have sat inside finance teams—and build software that respects the discipline and detail of their work.
            </p>
          </div>

          <div className="mkt-illustration-block">
            <div className="mkt-image-placeholder caption" style={{ aspectRatio: '4/3' }} aria-hidden="true">
              <span>Our team</span>
              <div className="mkt-image-caption">Building solutions with real-world finance experience</div>
            </div>
            <div>
              <div className="mkt-grid-3" style={{ gap: 24 }}>
                <div className="mkt-card">
                  <h3>Why we built this</h3>
                  <p className="mkt-body">
                    We watched teams stitch together spreadsheets, multiple systems, and email threads just to answer “what’s really due this month?” NB Aurum Solutions exists so that answer is always one page away.
                  </p>
                </div>
                <div className="mkt-card">
                  <h3>Who we serve</h3>
                  <p className="mkt-body">
                    Finance leaders, shared services teams, project-based organizations, and operations leaders accountable for cash flow and customer experience.
                  </p>
                </div>
                <div className="mkt-card">
                  <h3>How we work</h3>
                  <p className="mkt-body">
                    We listen to the details, design calm UIs, and ship only what we can support for the long term. We prefer fewer modules that are deeply reliable over many that are half-built.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full muted" aria-labelledby="philosophy-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 id="philosophy-heading" className="mkt-section-heading">Our philosophy and commitment</h2>
            <p className="mkt-lead">
              How we work, what we value, and why it matters for your success.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Leadership philosophy</h3>
              <p className="mkt-body">
                Our principles are simple: be transparent with customers, say “no” when a feature weakens the product, and never compromise on auditability or correctness. We build trust through consistent, reliable behavior—not marketing promises.
              </p>
              <div className="mkt-image-placeholder" style={{ marginTop: 24, aspectRatio: '16/9' }} aria-hidden="true">
                <span>Leadership</span>
              </div>
            </div>
            <div className="mkt-card">
              <h3>Team culture</h3>
              <p className="mkt-body">
                We work in small cross-functional pods—engineering, product, and support together. Every release is measured against its impact on daily finance and collections workflows. We value clarity, precision, and long-term thinking over quick wins.
              </p>
              <ul className="mkt-benefit-list" style={{ marginTop: 24 }}>
                <li><strong>Customer-first:</strong> Every feature starts with a real problem.</li>
                <li><strong>Quality over speed:</strong> We ship when it’s ready, not when it’s convenient.</li>
                <li><strong>Transparent operations:</strong> We share roadmaps, constraints, and decisions openly.</li>
                <li><strong>Continuous learning:</strong> We improve by working closely with finance teams.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">Join us</h2>
            <p className="mkt-lead">
              Whether you’re evaluating NB Aurum Solutions or planning a rollout, we’re here to help.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
            <Link to="/contact" className="mkt-btn mkt-btn-primary mkt-btn-lg">
              Contact us
            </Link>
            <Link to="/pricing" className="mkt-btn mkt-btn-ghost mkt-btn-lg">
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
