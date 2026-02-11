import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMarketingLanguage } from '../contexts/MarketingLanguageContext'
import '../styles/who-we-are-styles.css'
import { 
  Shield, Target, Users, Award, TrendingUp, CheckCircle2, 
  MapPin, BarChart3, Handshake, FileText,
  ArrowRight, Star, Building2, Heart, Lightbulb, Scale, Users2
} from 'lucide-react'

export default function WhoWeAre() {
  const { t } = useMarketingLanguage()
  
  useEffect(() => {
    document.title = 'Who We Are – NB Aurum Solutions Team & Philosophy'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Meet the team behind NB Aurum Solutions. Payment collections & consultancy for Power, Solar, Telecom, Railways, PSUs & Government. 20+ years expertise, integrity first, PAN-India.')
    }
  }, [])

  const stats = [
    { number: '20+', label: 'Years of Experienced Professionals' },
    { number: 'PAN', label: 'India Coverage' },
    { number: '95%', label: 'Risk-Free Model' },
    { number: '24/7', label: 'Support Available' }
  ]

  const values = [
    {
      icon: Shield,
      title: 'Integrity First',
      description: 'We operate with complete transparency and ethical practices in all our dealings.'
    },
    {
      icon: Target,
      title: 'Results-Driven',
      description: 'Our success is measured by your success. We focus on outcomes that matter.'
    },
    {
      icon: Handshake,
      title: 'Relationship Building',
      description: 'We preserve and strengthen relationships while recovering your dues.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering the highest standards in every engagement.'
    }
  ]

  const sectors = [
    { name: 'Power', description: 'Expertise in power sector collections and liaison' },
    { name: 'Solar', description: 'Specialized support for renewable energy projects' },
    { name: 'Telecom', description: 'Comprehensive solutions for telecom infrastructure' },
    { name: 'Railways', description: 'Deep understanding of railway project requirements' },
    { name: 'PSUs', description: 'Proven track record with public sector undertakings' },
    { name: 'Government', description: 'Specialized in government project collections' }
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="who-hero-section" aria-labelledby="who-heading">
        <div className="who-hero-background">
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=85" alt="NB Aurum Solutions - Professional Team" className="who-hero-image" />
          <div className="who-hero-overlay"></div>
        </div>
        <div className="mkt-container mkt-container-wide">
          <div className="who-hero-content">
            <div className="who-hero-badge">
              <Award size={20} />
              <span>{t('whoWeAre.eyebrow') || 'About Us'}</span>
            </div>
            <h1 id="who-heading" className="who-hero-title">
              {t('whoWeAre.heading') || 'Who We Are'}
            </h1>
            <p className="who-hero-lead">
              {t('whoWeAre.lead') || 'Your trusted partner in payment collections and consultancy. With over 20 years of expertise, we specialize in Power, Solar, Telecom, Railways, PSUs & Government projects across PAN India.'}
            </p>
            <div className="who-hero-tagline">
              <span>Your Dues. Our Duty.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="who-stats-section">
        <div className="mkt-container mkt-container-wide">
          <div className="who-stats-header">
            <h2 className="who-stats-title">Our Achievements</h2>
          </div>
          <div className="who-stats-grid">
            {stats.map((stat, index) => (
              <>
                <div key={index} className="who-stat-item">
                  <div className="who-stat-number">{stat.number}</div>
                  <div className="who-stat-label">{stat.label}</div>
                </div>
                {index < stats.length - 1 && <div className="who-stat-divider"></div>}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="who-story-section">
        <div className="mkt-container mkt-container-wide">
          <div className="who-story-content">
            <div className="who-story-text">
              <h2 className="who-story-title">Our Story</h2>
              <p className="who-story-lead">
                Founded with a vision to transform payment collections and consultancy in India's infrastructure sectors, 
                NB Aurum Solutions has been at the forefront of helping businesses recover their dues while preserving 
                valuable relationships.
              </p>
              <p className="who-story-text-content">
                Over two decades of experience has taught us that successful collections require more than persistence—they 
                demand deep sector knowledge, diplomatic negotiation skills, and a commitment to ethical practices. We've 
                built our reputation on three core pillars: understanding your business, respecting your relationships, 
                and delivering measurable results.
              </p>
              <p className="who-story-text-content">
                Today, we serve clients across Power, Solar, Telecom, Railways, PSUs, and Government sectors, combining 
                our proven consultancy expertise with cutting-edge technology to provide comprehensive solutions that work.
              </p>
            </div>
            <div className="who-story-image">
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=85" alt="NB Aurum Solutions Team" className="who-story-img" />
            </div>
          </div>
        </div>
      </section>

      {/* Why / Who / How - three pillars */}
      <section className="who-pillars-section">
        <div className="mkt-container mkt-container-wide">
          <div className="who-pillars-header">
            <h2 className="who-pillars-title">
              {t('whoWeAre.pillars.heading') || 'Our Foundation'}
            </h2>
            <p className="who-pillars-subtitle">
              Three pillars that define who we are and how we work
            </p>
          </div>
          <div className="who-pillars-grid">
            <div className="who-pillar-card">
              <div className="who-pillar-number">01</div>
              <h3 className="who-pillar-title">{t('whoWeAre.pillars.why.title') || 'Why We Exist'}</h3>
              <p className="who-pillar-text">
                {t('whoWeAre.pillars.why.text') || 'We exist to solve the critical challenge of payment collections in India\'s infrastructure sectors. Your cash flow is essential to your business, and we\'re here to ensure you get what you\'re owed—without damaging relationships or compromising ethics.'}
              </p>
            </div>
            <div className="who-pillar-card">
              <div className="who-pillar-number">02</div>
              <h3 className="who-pillar-title">{t('whoWeAre.pillars.who.title') || 'Who We Are'}</h3>
              <p className="who-pillar-text">
                {t('whoWeAre.pillars.who.text') || 'We are a team of experienced professionals with deep sector expertise in Power, Solar, Telecom, Railways, PSUs, and Government projects. Our consultants understand the nuances of each sector and have built relationships that enable effective liaison and negotiation.'}
              </p>
            </div>
            <div className="who-pillar-card">
              <div className="who-pillar-number">03</div>
              <h3 className="who-pillar-title">{t('whoWeAre.pillars.how.title') || 'How We Work'}</h3>
              <p className="who-pillar-text">
                {t('whoWeAre.pillars.how.text') || 'We combine strategic liaison, diplomatic negotiation, and comprehensive documentation with our SaaS platform for complete visibility. Our risk-free model means you only pay when we succeed, ensuring alignment with your goals.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="who-values-section">
        <div className="mkt-container mkt-container-wide">
          <div className="who-values-header">
            <h2 className="who-values-title">Our Core Values</h2>
            <p className="who-values-subtitle">
              The principles that guide everything we do
            </p>
          </div>
          <div className="who-values-grid">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div key={index} className="who-value-card">
                  <div className="who-value-icon-wrapper">
                    <Icon size={28} className="who-value-icon" />
                  </div>
                  <h3 className="who-value-title">{value.title}</h3>
                  <p className="who-value-description">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Philosophy & Commitment */}
      <section className="who-philosophy-section">
        <div className="mkt-container mkt-container-wide">
          <div className="who-philosophy-header">
            <div className="who-philosophy-header-badge">
              <Heart size={20} />
              <span>Our Foundation</span>
            </div>
            <h2 className="who-philosophy-title-main">
              {t('whoWeAre.philosophy.heading') || 'Our Philosophy & Commitment'}
            </h2>
            <p className="who-philosophy-subtitle">
              {t('whoWeAre.philosophy.lead') || 'We believe in doing business the right way—with integrity, transparency, and a focus on long-term relationships.'}
            </p>
          </div>

          <div className="who-philosophy-content-wrapper">
            {/* Philosophy Section */}
            <div className="who-philosophy-main-card">
              <div className="who-philosophy-main-header">
                <div className="who-philosophy-main-icon-wrapper">
                  <Lightbulb size={48} className="who-philosophy-main-icon" />
                </div>
                <h3 className="who-philosophy-main-title">
                  {t('whoWeAre.philosophy.philosophyTitle') || 'Our Philosophy'}
                </h3>
              </div>
              <div className="who-philosophy-main-content">
                <p className="who-philosophy-main-text">
                  {t('whoWeAre.philosophy.philosophyText') || 'We believe that successful collections require a balance of persistence and diplomacy. Our approach prioritizes preserving relationships while ensuring you receive what you\'re owed. Every engagement is handled with professionalism, respect, and a commitment to ethical practices.'}
                </p>
                <div className="who-philosophy-principles">
                  <div className="who-philosophy-principle">
                    <Scale size={24} className="who-philosophy-principle-icon" />
                    <div>
                      <h4 className="who-philosophy-principle-title">Balance & Diplomacy</h4>
                      <p className="who-philosophy-principle-text">Finding the right balance between persistence and respect</p>
                    </div>
                  </div>
                  <div className="who-philosophy-principle">
                    <Heart size={24} className="who-philosophy-principle-icon" />
                    <div>
                      <h4 className="who-philosophy-principle-title">Relationship First</h4>
                      <p className="who-philosophy-principle-text">Preserving valuable business relationships while recovering dues</p>
                    </div>
                  </div>
                  <div className="who-philosophy-principle">
                    <Shield size={24} className="who-philosophy-principle-icon" />
                    <div>
                      <h4 className="who-philosophy-principle-title">Ethical Excellence</h4>
                      <p className="who-philosophy-principle-text">Professionalism and ethical practices in every interaction</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Commitment Section */}
            <div className="who-commitment-main-card">
              <div className="who-commitment-main-header">
                <div className="who-commitment-main-icon-wrapper">
                  <Target size={48} className="who-commitment-main-icon" />
                </div>
                <h3 className="who-commitment-main-title">
                  {t('whoWeAre.philosophy.commitmentTitle') || 'Our Commitment'}
                </h3>
              </div>
              <div className="who-commitment-content">
                <p className="who-commitment-intro">
                  We commit to delivering excellence through these core principles:
                </p>
                <div className="who-commitment-items">
                  <div className="who-commitment-item">
                    <div className="who-commitment-item-icon-wrapper">
                      <Handshake size={24} className="who-commitment-item-icon" />
                    </div>
                    <div className="who-commitment-item-content">
                      <h4 className="who-commitment-item-title">
                        {t('whoWeAre.philosophy.diplomaticApproach') || 'Diplomatic Approach'}
                      </h4>
                      <p className="who-commitment-item-text">We negotiate with respect and professionalism, ensuring relationships remain intact</p>
                    </div>
                  </div>
                  <div className="who-commitment-item">
                    <div className="who-commitment-item-icon-wrapper">
                      <Scale size={24} className="who-commitment-item-icon" />
                    </div>
                    <div className="who-commitment-item-content">
                      <h4 className="who-commitment-item-title">
                        {t('whoWeAre.philosophy.ethicalRecovery') || 'Ethical Recovery'}
                      </h4>
                      <p className="who-commitment-item-text">All practices comply with legal and ethical standards, maintaining transparency</p>
                    </div>
                  </div>
                  <div className="who-commitment-item">
                    <div className="who-commitment-item-icon-wrapper">
                      <Shield size={24} className="who-commitment-item-icon" />
                    </div>
                    <div className="who-commitment-item-content">
                      <h4 className="who-commitment-item-title">
                        {t('whoWeAre.philosophy.riskFreeModel') || 'Risk-Free Model'}
                      </h4>
                      <p className="who-commitment-item-text">No Collection, No Fee – you only pay for results, ensuring alignment with your goals</p>
                    </div>
                  </div>
                  <div className="who-commitment-item">
                    <div className="who-commitment-item-icon-wrapper">
                      <Users2 size={24} className="who-commitment-item-icon" />
                    </div>
                    <div className="who-commitment-item-content">
                      <h4 className="who-commitment-item-title">
                        {t('whoWeAre.philosophy.singlePoint') || 'Single Point of Contact'}
                      </h4>
                      <p className="who-commitment-item-text">Dedicated team member with regular MIS updates and transparent communication</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sectors We Serve */}
      <section className="who-sectors-section">
        <div className="mkt-container mkt-container-wide">
          <div className="who-sectors-header">
            <h2 className="who-sectors-title">Sectors We Serve</h2>
            <p className="who-sectors-subtitle">
              Deep expertise across India's key infrastructure sectors
            </p>
          </div>
          <div className="who-sectors-grid">
            {sectors.map((sector, index) => (
              <div key={index} className="who-sector-card">
                <div className="who-sector-icon">
                  <Building2 size={24} />
                </div>
                <h3 className="who-sector-name">{sector.name}</h3>
                <p className="who-sector-description">{sector.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="who-choose-section">
        <div className="mkt-container mkt-container-wide">
          <div className="who-choose-content">
            <div className="who-choose-image">
              <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=85" alt="Why Choose NB Aurum" className="who-choose-img" />
            </div>
            <div className="who-choose-text">
              <h2 className="who-choose-title">Why Choose NB Aurum Solutions?</h2>
              <div className="who-choose-features">
                <div className="who-choose-feature">
                  <TrendingUp size={24} className="who-choose-feature-icon" />
                  <div>
                    <h3 className="who-choose-feature-title">Proven Track Record</h3>
                    <p className="who-choose-feature-text">
                      20+ years of experienced professionals delivering successful collections and consultancy across multiple sectors
                    </p>
                  </div>
                </div>
                <div className="who-choose-feature">
                  <BarChart3 size={24} className="who-choose-feature-icon" />
                  <div>
                    <h3 className="who-choose-feature-title">Complete Transparency</h3>
                    <p className="who-choose-feature-text">
                      Regular MIS reports and a single point of contact keep you informed every step of the way
                    </p>
                  </div>
                </div>
                <div className="who-choose-feature">
                  <FileText size={24} className="who-choose-feature-icon" />
                  <div>
                    <h3 className="who-choose-feature-title">Compliance Ready</h3>
                    <p className="who-choose-feature-text">
                      All documentation and processes are audit-ready and compliance-focused
                    </p>
                  </div>
                </div>
                <div className="who-choose-feature">
                  <Users size={24} className="who-choose-feature-icon" />
                  <div>
                    <h3 className="who-choose-feature-title">Sector Expertise</h3>
                    <p className="who-choose-feature-text">
                      Deep understanding of Power, Solar, Telecom, Railways, PSUs & Government processes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Strip */}
      <section className="who-values-strip-section">
        <div className="mkt-container mkt-container-wide">
          <div className="who-values-strip">
            <div className="who-value-strip-item">
              <Star size={20} className="who-value-strip-icon" />
              <span>{t('whoWeAre.values.integrityFirst') || 'Integrity First'}</span>
            </div>
            <div className="who-value-strip-item">
              <Star size={20} className="who-value-strip-icon" />
              <span>{t('whoWeAre.values.fullCompliance') || 'Full Compliance'}</span>
            </div>
            <div className="who-value-strip-item">
              <Star size={20} className="who-value-strip-icon" />
              <span>{t('whoWeAre.values.reputationPreserving') || 'Reputation Preserving'}</span>
            </div>
            <div className="who-value-strip-item">
              <Star size={20} className="who-value-strip-icon" />
              <span>{t('whoWeAre.values.neverSayNo') || 'Never Say No'}</span>
            </div>
            <div className="who-value-strip-item">
              <Star size={20} className="who-value-strip-icon" />
              <span>{t('whoWeAre.values.panIndia') || 'PAN India Coverage'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="who-cta-section">
        <div className="mkt-container mkt-container-wide">
          <div className="who-cta-content">
            <h2 className="who-cta-title">
              {t('whoWeAre.cta.heading') || 'Ready to Get Started?'}
            </h2>
            <p className="who-cta-lead">
              {t('whoWeAre.cta.lead') || 'Let\'s discuss how we can help secure your cash flow and recover your dues while preserving your valuable relationships.'}
            </p>
            <div className="who-cta-actions">
              <Link to="/contact" className="who-cta-btn who-cta-btn-primary">
                {t('whoWeAre.cta.getInTouch') || 'Get in Touch'}
                <ArrowRight size={20} />
              </Link>
              <Link to="/pricing" className="who-cta-btn who-cta-btn-secondary">
                {t('whoWeAre.cta.viewEngagement') || 'View Engagement Models'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
