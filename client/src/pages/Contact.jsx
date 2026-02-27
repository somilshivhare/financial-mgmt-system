import { useState, useEffect } from 'react'
import { Mail, Clock, Send, CheckCircle2, Loader2, Shield, Zap, Users, TrendingUp, Award, MessageSquare, ArrowRight } from 'lucide-react'

export default function Contact() {
  const [status, setStatus] = useState('idle')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  useEffect(() => {
    document.title = 'Contact NB Aurum Solutions – Get in Touch'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Contact NB Aurum Solutions for payment collections, consultancy, or platform demo. Power, Solar, Telecom, Railways, PSUs & Government – PAN India. Get in touch.')
    }
  }, [])

  const validateField = (name, value) => {
    let error = ''
    switch (name) {
      case 'email':
        if (!value) {
          error = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address'
        }
        break
      case 'name':
        if (!value.trim()) {
          error = 'Name is required'
        }
        break
      case 'company':
        if (!value.trim()) {
          error = 'Company name is required'
        }
        break
      case 'message':
        if (!value.trim()) {
          error = 'Message is required'
        } else if (value.trim().length < 10) {
          error = 'Message must be at least 10 characters'
        }
        break
      default:
        break
    }
    return error
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const validateForm = () => {
    const newErrors = {}
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key])
      if (error) newErrors[key] = error
    })
    setErrors(newErrors)
    setTouched({
      name: true,
      email: true,
      company: true,
      message: true
    })
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setStatus('sending')
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setStatus('sent')
      setFormData({
        name: '',
        email: '',
        company: '',
        message: ''
      })
      setErrors({})
      setTouched({})
      setTimeout(() => setStatus('idle'), 5000)
    } catch (error) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'nbaurum@gmail.com',
      details: 'Preferred for billing, access, and general requests',
      color: 'var(--mkt-primary)',
      link: 'mailto:nbaurum@gmail.com'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      content: 'Mon–Fri, 10:00–6:00 IST',
      details: 'We respond within 24 hours',
      color: 'var(--mkt-primary)'
    }
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="contact-hero" aria-labelledby="contact-heading">
        <div className="mkt-container mkt-container-wide">
          <div className="contact-hero-content">
            <h1 id="contact-heading" className="contact-hero-title">
              Get in Touch
            </h1>
            <p className="contact-hero-subtitle">
              Ready to secure your cash flow? Share your collections and payment challenges—we'll respond with next steps and a tailored plan.
            </p>
            <div className="contact-hero-tagline">
              <span>Zero risk performance model</span>
              <span className="contact-hero-divider">·</span>
              <span>Sector expertise</span>
              <span className="contact-hero-divider">·</span>
              <span>Your Dues. Our Duty.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mkt-section-full contact-main">
        <div className="mkt-container mkt-container-wide">
          {/* Contact Info Cards */}
          <div className="contact-info-grid">
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <div key={index} className="contact-info-card">
                  <div className="contact-info-icon" style={{ backgroundColor: `${info.color}15`, color: info.color }}>
                    <Icon size={24} />
                  </div>
                  <div className="contact-info-content">
                    <h3 className="contact-info-title">{info.title}</h3>
                    {info.link ? (
                      <a href={info.link} className="contact-info-link">
                        {info.content}
                      </a>
                    ) : (
                      <p className="contact-info-text">{info.content}</p>
                    )}
                    <p className="contact-info-details">{info.details}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Form and Address Section */}
          <div className="contact-form-section">
            <div className="contact-form-wrapper">
              <div className="contact-form-header">
                <h2 className="contact-form-title">Send us a message</h2>
                <p className="contact-form-description">
                  Whether you need platform demo, collection engagement, or consultancy for Power, Solar, Telecom, Railways, PSUs or Government projects—we're here to help.
                </p>
              </div>

              <form className="contact-form" onSubmit={onSubmit} aria-labelledby="form-heading" noValidate>
                <div className="mkt-form-grid">
                  <div className="mkt-field">
                    <label className="mkt-label" htmlFor="contact-name">
                      Name <span className="contact-required">*</span>
                    </label>
                    <input
                      className={`mkt-input ${errors.name && touched.name ? 'mkt-input-error' : ''}`}
                      id="contact-name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      autoComplete="name"
                      aria-required="true"
                      aria-invalid={errors.name && touched.name ? 'true' : 'false'}
                    />
                    {errors.name && touched.name && (
                      <span className="contact-error" role="alert">{errors.name}</span>
                    )}
                  </div>

                  <div className="mkt-field">
                    <label className="mkt-label" htmlFor="contact-email">
                      Work Email <span className="contact-required">*</span>
                    </label>
                    <input
                      className={`mkt-input ${errors.email && touched.email ? 'mkt-input-error' : ''}`}
                      id="contact-email"
                      name="email"
                      type="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      autoComplete="email"
                      aria-required="true"
                      aria-invalid={errors.email && touched.email ? 'true' : 'false'}
                    />
                    {errors.email && touched.email && (
                      <span className="contact-error" role="alert">{errors.email}</span>
                    )}
                  </div>

                  <div className="mkt-field">
                    <label className="mkt-label" htmlFor="contact-company">
                      Company <span className="contact-required">*</span>
                    </label>
                    <input
                      className={`mkt-input ${errors.company && touched.company ? 'mkt-input-error' : ''}`}
                      id="contact-company"
                      name="company"
                      type="text"
                      placeholder="Company name"
                      value={formData.company}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      autoComplete="organization"
                      aria-required="true"
                      aria-invalid={errors.company && touched.company ? 'true' : 'false'}
                    />
                    {errors.company && touched.company && (
                      <span className="contact-error" role="alert">{errors.company}</span>
                    )}
                  </div>

                  <div className="mkt-field mkt-field--full">
                    <label className="mkt-label" htmlFor="contact-message">
                      Message <span className="contact-required">*</span>
                    </label>
                    <textarea
                      className={`mkt-textarea ${errors.message && touched.message ? 'mkt-input-error' : ''}`}
                      id="contact-message"
                      name="message"
                      rows={6}
                      placeholder="Share your collections, payment realization, or platform requirements (e.g. sector, outstanding amounts, need for liaison or dispute support)."
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-required="true"
                      aria-invalid={errors.message && touched.message ? 'true' : 'false'}
                    />
                    {errors.message && touched.message && (
                      <span className="contact-error" role="alert">{errors.message}</span>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={`contact-submit-btn ${status === 'sending' ? 'contact-submit-btn-loading' : ''}`}
                  disabled={status === 'sending' || status === 'sent'}
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="contact-submit-icon" size={18} />
                      Sending...
                    </>
                  ) : status === 'sent' ? (
                    <>
                      <CheckCircle2 className="contact-submit-icon" size={18} />
                      Message Sent!
                    </>
                  ) : (
                    <>
                      <Send className="contact-submit-icon" size={18} />
                      Send Message
                    </>
                  )}
                </button>

                {status === 'sent' && (
                  <div className="contact-success-message" role="status">
                    <CheckCircle2 size={20} />
                    <div>
                      <strong>Message sent successfully!</strong>
                      <p>We'll get back to you within 24 hours.</p>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className="contact-error-message" role="alert">
                    <p>Something went wrong. Please try again or contact us directly.</p>
                  </div>
                )}
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="contact-why-section">
        <div className="mkt-container mkt-container-wide">
          <div className="contact-why-header">
            <h2 className="contact-why-title">Why Choose NB Aurum Solutions?</h2>
            <p className="contact-why-subtitle">
              We combine cutting-edge technology with deep sector expertise to deliver results that matter.
            </p>
          </div>
          <div className="contact-why-grid">
            <div className="contact-why-card">
              <div className="contact-why-icon">
                <Shield size={32} />
              </div>
              <h3 className="contact-why-card-title">20+ Years Experience</h3>
              <p className="contact-why-card-text">
                Deep expertise in Power, Solar, Telecom, Railways, PSUs & Government projects across PAN India.
              </p>
            </div>
            <div className="contact-why-card">
              <div className="contact-why-icon">
                <Zap size={32} />
              </div>
              <h3 className="contact-why-card-title">Zero Risk Model</h3>
              <p className="contact-why-card-text">
                No Collection, No Fee. You only pay when we successfully recover your dues.
              </p>
            </div>
            <div className="contact-why-card">
              <div className="contact-why-icon">
                <Users size={32} />
              </div>
              <h3 className="contact-why-card-title">Single Point of Contact</h3>
              <p className="contact-why-card-text">
                Dedicated team member for your account with regular MIS and transparent reporting.
              </p>
            </div>
            <div className="contact-why-card">
              <div className="contact-why-icon">
                <TrendingUp size={32} />
              </div>
              <h3 className="contact-why-card-title">Proven Results</h3>
              <p className="contact-why-card-text">
                Track record of aggressive payment realization and dispute resolution across sectors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="contact-trust-section">
        <div className="mkt-container mkt-container-wide">
          <div className="contact-trust-content">
            <div className="contact-trust-image">
              <img 
                src="/hero.png" 
                alt="NB Aurum Solutions - Trusted Partner" 
                className="contact-trust-img"
              />
            </div>
            <div className="contact-trust-text">
              <div className="contact-trust-badge">
                <Award size={20} />
                <span>Trusted by Industry Leaders</span>
              </div>
              <h2 className="contact-trust-title">Your Dues. Our Duty.</h2>
              <p className="contact-trust-description">
                We understand the complexities of B2G projects, utility coordination, and government processes. 
                Our platform provides enterprise-grade controls while our consultancy team handles the heavy lifting 
                of liaison, documentation, and aggressive payment realization.
              </p>
              <div className="contact-trust-features">
                <div className="contact-trust-feature">
                  <CheckCircle2 size={20} className="contact-trust-check" />
                  <span>Full auditability and compliance-ready documentation</span>
                </div>
                <div className="contact-trust-feature">
                  <CheckCircle2 size={20} className="contact-trust-check" />
                  <span>Strategic liaison with utilities, PSUs & government bodies</span>
                </div>
                <div className="contact-trust-feature">
                  <CheckCircle2 size={20} className="contact-trust-check" />
                  <span>Dispute & claim management with diplomatic negotiation</span>
                </div>
                <div className="contact-trust-feature">
                  <CheckCircle2 size={20} className="contact-trust-check" />
                  <span>MIS, Reporting & Compliance - all in one place</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Happens Next Section */}
      <section className="contact-next-section">
        <div className="mkt-container mkt-container-wide">
          <div className="contact-next-header">
            <h2 className="contact-next-title">What Happens Next?</h2>
            <p className="contact-next-subtitle">
              Our streamlined process ensures you get started quickly and see results faster.
            </p>
          </div>
          <div className="contact-next-steps">
            <div className="contact-next-step">
              <div className="contact-next-number">1</div>
              <div className="contact-next-content">
                <h3 className="contact-next-step-title">Submit Your Inquiry</h3>
                <p className="contact-next-step-text">
                  Fill out the form above or reach out via email/phone. Share your sector, outstanding amounts, 
                  and specific requirements.
                </p>
              </div>
            </div>
            <div className="contact-next-step">
              <div className="contact-next-number">2</div>
              <div className="contact-next-content">
                <h3 className="contact-next-step-title">Initial Consultation</h3>
                <p className="contact-next-step-text">
                  We'll review your situation within 24 hours and schedule a call to understand your challenges 
                  and discuss potential solutions.
                </p>
              </div>
            </div>
            <div className="contact-next-step">
              <div className="contact-next-number">3</div>
              <div className="contact-next-content">
                <h3 className="contact-next-step-title">Tailored Proposal</h3>
                <p className="contact-next-step-text">
                  Receive a customized plan outlining our approach, timeline, and expected outcomes based on 
                  your specific needs.
                </p>
              </div>
            </div>
            <div className="contact-next-step">
              <div className="contact-next-number">4</div>
              <div className="contact-next-content">
                <h3 className="contact-next-step-title">Get Started</h3>
                <p className="contact-next-step-text">
                  Once approved, we'll assign a dedicated point of contact and begin working on your collections 
                  and payment realization immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="contact-faq-section">
        <div className="mkt-container mkt-container-wide">
          <div className="contact-faq-header">
            <h2 className="contact-faq-title">Frequently Asked Questions</h2>
            <p className="contact-faq-subtitle">
              Quick answers to common questions about our services and process.
            </p>
          </div>
          <div className="contact-faq-grid">
            <div className="contact-faq-item">
              <h3 className="contact-faq-question">What sectors do you specialize in?</h3>
              <p className="contact-faq-answer">
                We specialize in Power, Solar, Telecom, Railways, PSUs & Government projects across PAN India. 
                Our team has deep understanding of sector-specific processes and requirements.
              </p>
            </div>
            <div className="contact-faq-item">
              <h3 className="contact-faq-question">How does the "No Collection, No Fee" model work?</h3>
              <p className="contact-faq-answer">
                You only pay when we successfully recover your dues. There are no upfront costs or fixed fees. 
                Our compensation is directly tied to results, ensuring alignment with your goals.
              </p>
            </div>
            <div className="contact-faq-item">
              <h3 className="contact-faq-question">What information do I need to provide?</h3>
              <p className="contact-faq-answer">
                Share your sector, outstanding amounts, customer details, and any specific challenges you're facing. 
                The more context you provide, the better we can tailor our approach.
              </p>
            </div>
            <div className="contact-faq-item">
              <h3 className="contact-faq-question">How quickly will I get a response?</h3>
              <p className="contact-faq-answer">
                We respond to all inquiries within 24 hours during business days.
              </p>
            </div>
            <div className="contact-faq-item">
              <h3 className="contact-faq-question">Do you provide platform demos?</h3>
              <p className="contact-faq-answer">
                Yes! We offer free platform demos to show you how our SaaS solution can help manage your AR, 
                collections, and reporting. Schedule a demo through the contact form.
              </p>
            </div>
            <div className="contact-faq-item">
              <h3 className="contact-faq-question">What kind of support do you provide?</h3>
              <p className="contact-faq-answer">
                We provide comprehensive support including strategic liaison, documentation, dispute management, 
                regular MIS reporting, and a dedicated single point of contact for your account.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
