import { useEffect } from 'react'

export default function WhoWeAre() {
  useEffect(() => {
    document.title = 'Who We Are – Nbaurum ERP Team & Culture'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Meet the team behind Nbaurum ERP. We are product and operations people who have sat inside finance teams, building software that respects the discipline and detail of finance work.')
    }
  }, [])

  return (
    <>
      <section className="mkt-section-full">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h1 className="mkt-section-heading">Who we are</h1>
            <p className="mkt-lead">
              We are product and operations people who have sat inside finance teams—and build software that respects the
              discipline and detail of their work.
            </p>
          </div>

          <div className="mkt-illustration-block">
            <div className="mkt-image-placeholder caption" style={{ aspectRatio: '4/3' }}>
              <span>Our Team</span>
              <div className="mkt-image-caption">Building ERP solutions with real-world finance experience</div>
            </div>
            <div>
              <div className="mkt-grid-3">
                <div className="mkt-card">
                  <h3>Why we built this</h3>
                  <p className="mkt-body">
                    We watched teams stitch together spreadsheets, ERPs, and email threads just to answer “what’s really due
                    this month?” Nbaurum exists so that answer is always one page away.
                  </p>
                </div>
                <div className="mkt-card">
                  <h3>Who we serve</h3>
                  <p className="mkt-body">
                    Finance leaders, shared services teams, project-based organizations, and operations leaders who are
                    accountable for cash flow and customer experience.
                  </p>
                </div>
                <div className="mkt-card">
                  <h3>How we work</h3>
                  <p className="mkt-body">
                    We listen to the details, design calm UIs, and ship only what we can support for the long term. We prefer
                    fewer modules that are deeply reliable over many that are half-built.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section-full muted">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h2 className="mkt-section-heading">Our philosophy and commitment</h2>
            <p className="mkt-lead">
              How we work, what we value, and why it matters for your success.
            </p>
          </div>
          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h3>Leadership philosophy</h3>
              <p className="mkt-body">
                Our leadership principles are simple: be transparent with customers, say “no” when a feature weakens the
                product, and never compromise on auditability or correctness. We believe in building trust through consistent,
                reliable behavior—not marketing promises.
              </p>
              <div className="mkt-image-placeholder" style={{ marginTop: 20, aspectRatio: '16/9' }}>
                <span>Leadership Approach</span>
              </div>
            </div>
            <div className="mkt-card">
              <h3>Team culture</h3>
              <p className="mkt-body">
                We work in small cross-functional pods—engineering, product, and support together. Every release is
                measured against its impact on daily finance and collections workflows. We value clarity, precision, and
                long-term thinking over quick wins.
              </p>
              <ul className="mkt-benefit-list" style={{ marginTop: 20 }}>
                <li>Customer-first: Every feature starts with a real problem.</li>
                <li>Quality over speed: We ship when it's ready, not when it's convenient.</li>
                <li>Transparent operations: We share roadmaps, constraints, and decisions openly.</li>
                <li>Continuous learning: We improve by working closely with finance teams.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
