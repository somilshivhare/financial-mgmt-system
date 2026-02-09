import { useState, useEffect } from 'react'

export default function Contact() {
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    document.title = 'Contact NB Aurum Solutions – Get in Touch'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Contact NB Aurum Solutions for payment collections, consultancy, or platform demo. Power, Solar, Telecom, Railways, PSUs & Government – PAN India. Get in touch.')
    }
  }, [])

  const onSubmit = (e) => {
    e.preventDefault()
    setStatus('sent')
    setTimeout(() => setStatus('idle'), 3500)
  }

  return (
    <>
      <section className="mkt-section-full" aria-labelledby="contact-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="mkt-page-head">
            <h1 id="contact-heading" className="mkt-section-heading">Contact</h1>
            <p className="mkt-lead">
              Ready to secure your cash flow? Share your collections and payment challenges—we'll respond with next steps and a tailored plan. Zero risk performance model · Sector expertise · Your Dues. Our Duty.
            </p>
          </div>

          <div className="mkt-grid-2" style={{ marginTop: 48, gap: 40 }}>
            <div className="mkt-card">
              <h2 style={{ marginTop: 0, marginBottom: 16 }}>How to reach us</h2>
              <p className="mkt-body">
                Whether you need platform demo, collection engagement, or consultancy for Power, Solar, Telecom, Railways, PSUs or Government projects—use the form or contact us directly.
              </p>
              <div className="mkt-contact-meta">
                <div className="mkt-contact-line">
                  <span className="mkt-contact-key">Head office</span>
                  <span className="mkt-contact-val">
                    NB Aurum Solutions
                    <br />
                    Lower Ground Floor, LGF-17, Krishna Apra D Mall,
                    <br />
                    Shakti Khand-2, Indirapuram, Ghaziabad District,
                    <br />
                    Uttar Pradesh – 201014, India
                  </span>
                </div>
                <div className="mkt-contact-line">
                  <span className="mkt-contact-key">Support</span>
                  <span className="mkt-contact-val">support@nbaurumsolutions.com</span>
                </div>
                <div className="mkt-contact-line">
                  <span className="mkt-contact-key">Phone</span>
                  <span className="mkt-contact-val">+91 98608 94146</span>
                </div>
                <div className="mkt-contact-line">
                  <span className="mkt-contact-key">Hours</span>
                  <span className="mkt-contact-val">Mon–Fri, 10:00–18:00 IST</span>
                </div>
              </div>
              <div className="mkt-map-placeholder" style={{ marginTop: 28 }} aria-hidden="true">
                <div className="mkt-map-label">Office location</div>
              </div>
            </div>

            <form className="mkt-card" onSubmit={onSubmit} aria-labelledby="form-heading" noValidate>
              <h2 id="form-heading" style={{ marginTop: 0, marginBottom: 24 }}>Send us a message</h2>
              <div className="mkt-form-grid">
                <div className="mkt-field">
                  <label className="mkt-label" htmlFor="contact-name">
                    Name
                  </label>
                  <input
                    className="mkt-input"
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    required
                    autoComplete="name"
                    aria-required="true"
                  />
                </div>
                <div className="mkt-field">
                  <label className="mkt-label" htmlFor="contact-email">
                    Work email
                  </label>
                  <input
                    className="mkt-input"
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                    aria-required="true"
                  />
                </div>
                <div className="mkt-field">
                  <label className="mkt-label" htmlFor="contact-phone">
                    Phone
                  </label>
                  <input
                    className="mkt-input"
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98608 94146"
                    autoComplete="tel"
                  />
                </div>
                <div className="mkt-field">
                  <label className="mkt-label" htmlFor="contact-company">
                    Company
                  </label>
                  <input
                    className="mkt-input"
                    id="contact-company"
                    name="company"
                    type="text"
                    placeholder="Company name"
                    required
                    autoComplete="organization"
                    aria-required="true"
                  />
                </div>
                <div className="mkt-field mkt-field--full">
                  <label className="mkt-label" htmlFor="contact-message">
                    Message
                  </label>
                  <textarea
                    className="mkt-textarea"
                    id="contact-message"
                    name="message"
                    rows={5}
                    placeholder="Share your collections, payment realization, or platform requirements (e.g. sector, outstanding amounts, need for liaison or dispute support)."
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <button type="submit" className="mkt-btn mkt-btn-primary" style={{ marginTop: 8 }}>
                Send message
              </button>

              {status === 'sent' && (
                <p className="mkt-form-note" role="status" style={{ color: 'var(--mkt-success)', marginTop: 16 }}>
                  Message sent. We'll get back to you soon.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
