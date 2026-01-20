import { useState } from 'react'

export default function Contact() {
  const [status, setStatus] = useState('idle')

  const onSubmit = (e) => {
    e.preventDefault()
    // No backend requested; keep it simple and non-blocking.
    setStatus('sent')
    setTimeout(() => setStatus('idle'), 3500)
  }

  return (
    <section className="mkt-section">
      <div className="mkt-container">
        <div className="mkt-page-head">
          <h1 className="mkt-h1">Contact</h1>
          <p className="mkt-lead">
            Tell us about your invoicing and collections workflow. We’ll respond with next steps.
          </p>
        </div>

        <div className="mkt-grid-2">
          <div className="mkt-card">
            <h2 className="mkt-h3">Reach out</h2>
            <p className="mkt-body">
              Use this form to share your requirements. If you’re already a customer, please sign in and use the in-app flow.
            </p>
            <div className="mkt-contact-meta">
              <div className="mkt-contact-line">
                <span className="mkt-contact-key">Email</span>
                <span className="mkt-contact-val">support@nbaurum.com</span>
              </div>
              <div className="mkt-contact-line">
                <span className="mkt-contact-key">Hours</span>
                <span className="mkt-contact-val">Mon–Fri, 10:00–18:00</span>
              </div>
            </div>
          </div>

          <form className="mkt-card" onSubmit={onSubmit}>
            <div className="mkt-form-grid">
              <div className="mkt-field">
                <label className="mkt-label" htmlFor="name">Name</label>
                <input className="mkt-input" id="name" name="name" type="text" placeholder="Your name" required />
              </div>
              <div className="mkt-field">
                <label className="mkt-label" htmlFor="email">Work email</label>
                <input className="mkt-input" id="email" name="email" type="email" placeholder="name@company.com" required />
              </div>
              <div className="mkt-field mkt-field--full">
                <label className="mkt-label" htmlFor="message">Message</label>
                <textarea className="mkt-textarea" id="message" name="message" rows={5} placeholder="What are you trying to solve?" required />
              </div>
            </div>

            <button type="submit" className="mkt-btn mkt-btn-primary">
              Send message
            </button>

            {status === 'sent' && (
              <div className="mkt-form-note" role="status">
                Message sent. We’ll get back to you soon.
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}


