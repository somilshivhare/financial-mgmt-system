import { useState, useEffect } from 'react'

export default function Contact() {
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    document.title = 'Contact Nbaurum – Get in Touch'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Contact Nbaurum for sales inquiries, support, or questions about our enterprise finance platform. We\'re here to help structure your invoicing and collections workflows.')
    }
  }, [])

  const onSubmit = (e) => {
    e.preventDefault()
    setStatus('sent')
    setTimeout(() => setStatus('idle'), 3500)
  }

  return (
    <>
      <section className="mkt-section-full">
        <div className="mkt-container">
          <div className="mkt-page-head">
            <h1 className="mkt-section-heading">Contact</h1>
            <p className="mkt-lead">
              Share your current finance and collections workflow—we'll respond with next steps and a tailored demo plan.
            </p>
          </div>

          <div className="mkt-grid-2" style={{ marginTop: 48 }}>
            <div className="mkt-card">
              <h2 style={{ marginTop: 0 }}>How to reach us</h2>
              <p className="mkt-body">
                If you are evaluating Nbaurum or planning a rollout, use this form or email us directly. Existing customers
                can also raise requests from inside the product.
              </p>
              <div className="mkt-contact-meta">
                <div className="mkt-contact-line">
                  <span className="mkt-contact-key">Head office</span>
                  <span className="mkt-contact-val">
                    Nbaurum Pvt. Ltd.
                    <br />
                    4th Floor, Business District
                    <br />
                    Bengaluru, India
                  </span>
                </div>
                <div className="mkt-contact-line">
                  <span className="mkt-contact-key">Support</span>
                  <span className="mkt-contact-val">support@nbaurum.com · +91-00000-00000</span>
                </div>
                <div className="mkt-contact-line">
                  <span className="mkt-contact-key">Hours</span>
                  <span className="mkt-contact-val">Mon–Fri, 10:00–18:00 IST</span>
                </div>
              </div>
              <div className="mkt-map-placeholder" style={{ marginTop: 24 }}>
                <div className="mkt-map-label">Office location</div>
              </div>
            </div>

            <form className="mkt-card" onSubmit={onSubmit}>
              <h2 style={{ marginTop: 0, marginBottom: 24 }}>Send us a message</h2>
              <div className="mkt-form-grid">
                <div className="mkt-field">
                  <label className="mkt-label" htmlFor="name">
                    Name
                  </label>
                  <input className="mkt-input" id="name" name="name" type="text" placeholder="Your name" required />
                </div>
                <div className="mkt-field">
                  <label className="mkt-label" htmlFor="email">
                    Work email
                  </label>
                  <input
                    className="mkt-input"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                  />
                </div>
                <div className="mkt-field">
                  <label className="mkt-label" htmlFor="phone">
                    Phone
                  </label>
                  <input
                    className="mkt-input"
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91-00000-00000"
                  />
                </div>
                <div className="mkt-field">
                  <label className="mkt-label" htmlFor="company">
                    Company
                  </label>
                  <input
                    className="mkt-input"
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Company name"
                    required
                  />
                </div>
                <div className="mkt-field mkt-field--full">
                  <label className="mkt-label" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    className="mkt-textarea"
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Share context about your invoicing, receivables, and collections challenges."
                    required
                  />
                </div>
              </div>

              <button type="submit" className="mkt-btn mkt-btn-primary">
                Send message
              </button>

              {status === 'sent' && (
                <div className="mkt-form-note" role="status" style={{ color: 'rgba(34, 197, 94, 0.90)' }}>
                  Message sent. We'll get back to you soon.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
