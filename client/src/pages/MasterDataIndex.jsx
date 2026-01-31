import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Truck, CreditCard, IdCard, FileCheck2, Users, ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import { getAllStepsLockedStatus } from '../api/masterData'
import '../styles/MasterData.css'

function MasterDataIndex() {
  const navigate = useNavigate()
  const [lockedSteps, setLockedSteps] = useState({})
  const [loadingLockStatus, setLoadingLockStatus] = useState(true)

  const items = useMemo(
    () => [
      {
        key: 'company-profile',
        title: 'Company Profile',
        description: 'Organization details, GSTIN, address, banking info.',
        icon: Building2,
        step: 1,
      },
      {
        key: 'customer-profile',
        title: 'Customer Profile',
        description: 'Customer master for invoicing and contact info.',
        icon: Users,
        step: 2,
      },
      {
        key: 'consignee-profile',
        title: 'Consignee Profile',
        description: 'Ship-to location details and delivery preferences.',
        icon: Truck,
        step: 3,
      },
      {
        key: 'payer-profile',
        title: 'Payer Profile',
        description: 'Bill-to and payment responsible party details.',
        icon: CreditCard,
        step: 4,
      },
      {
        key: 'employee-profile',
        title: 'Employee Profile',
        description: 'Sales/ops team profiles for approvals and tracking.',
        icon: IdCard,
        step: 5,
      },
      {
        key: 'payment-terms',
        title: 'Payment Terms',
        description: 'Net days, discounts, penalties, and terms settings.',
        icon: FileCheck2,
        step: 6,
      },
      {
        key: 'review-submit',
        title: 'Review All Master Data',
        description: 'Review all saved master data records. You can continue creating new records at any time.',
        icon: CheckCircle2,
        step: 7,
      },
    ],
    [],
  )

  // Load locked status for all steps
  useEffect(() => {
    const loadLockStatus = async () => {
      try {
        setLoadingLockStatus(true)
        const status = await getAllStepsLockedStatus()
        setLockedSteps(status)
      } catch (error) {
        console.error('[MasterDataIndex] Failed to load lock status:', error)
        // On error, allow all steps (not locked)
        setLockedSteps({})
      } finally {
        setLoadingLockStatus(false)
      }
    }
    
    loadLockStatus()
    
    // Listen for updates when master data is saved
    const handleUpdate = () => {
      loadLockStatus()
    }
    
    window.addEventListener('masterDataUpdated', handleUpdate)
    return () => {
      window.removeEventListener('masterDataUpdated', handleUpdate)
    }
  }, [])
  
  const handleRowClick = (key) => {
    if (key === 'review-submit') {
      navigate('/master-data/review')
    } else {
      // Always allow creating new records - navigate to form
      // Locked status only applies when editing existing records, not creating new ones
      navigate(`/master-data/new/${key}`)
    }
  }

  const handleKeyDown = (e, key) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRowClick(key)
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <button
        type="button"
        onClick={() => navigate('/master-data')}
        className="md-breadcrumb-link"
      >
        <ArrowLeft className="md-breadcrumb-icon" />
        Back to Master Data
      </button>

      {/* Page Header */}
      <div className="md-index-header">
        <div className="md-eyebrow">Index</div>
        <h1 className="md-title">Create New Master Data</h1>
        <p className="md-subtitle">Choose one of the master data modules to continue.</p>
      </div>

      {/* Table Container */}
      <div className="md-index-table-container">
        <table className="md-index-table">
          <thead>
            <tr>
              <th className="md-index-table-header md-index-table-step">Step</th>
              <th className="md-index-table-header md-index-table-module">Module Name</th>
              <th className="md-index-table-header md-index-table-description">Description</th>
              <th className="md-index-table-header md-index-table-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const Icon = item.icon
              const isLocked = item.key !== 'review-submit' && lockedSteps[item.key]
              const isReviewStep = item.key === 'review-submit'
              
              return (
                <tr
                  key={item.key}
                  className={`md-index-table-row ${isReviewStep ? 'md-index-table-row-review' : ''}`}
                  onClick={() => handleRowClick(item.key)}
                  onKeyDown={(e) => handleKeyDown(e, item.key)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${item.title}`}
                >
                  <td className="md-index-table-cell md-index-table-step">
                    <span className="md-index-step-number">{item.step}</span>
                  </td>
                  <td className="md-index-table-cell md-index-table-module">
                    <div className="md-index-module-content">
                      <div className="md-index-module-icon-wrapper">
                        <Icon className="md-index-module-icon" />
                      </div>
                      <span className="md-index-module-title">
                        {item.title}
                        {isLocked && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981', fontWeight: '500' }}>(Has Records)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="md-index-table-cell md-index-table-description">
                    <span className="md-index-module-description">
                      {item.description}
                    </span>
                  </td>
                  <td className="md-index-table-cell md-index-table-action">
                    <ArrowRight className="md-index-action-icon" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MasterDataIndex
