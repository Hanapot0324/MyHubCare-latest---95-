// web/src/pages/Referrals.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);

  // Dummy referrals data matching the picture exactly
  const dummyReferrals = [
    {
      id: 1,
      patientName: 'John Doe',
      fromBranch: 'My Hub Cares Ortigas Main',
      toBranch: 'My Hub Cares Pasay',
      referralDate: '10/20/2025',
      reason: 'Requires specialized treatment for co-infection management',
      status: 'ACCEPTED',
      urgency: 'Urgent',
      notes:
        'Patient requires specialized care for co-infection management not available at current facility.',
    },
    {
      id: 2,
      patientName: 'Carlos Rodriguez',
      fromBranch: 'My Hub Cares Pasay',
      toBranch: 'My Hub Cares Alabang',
      referralDate: '10/15/2025',
      reason: 'Transfer request by patient - moving to Cebu',
      status: 'ACCEPTED',
      urgency: 'Routine',
      notes: 'Patient relocating for work.',
    },
  ];

  useEffect(() => {
    setReferrals(dummyReferrals);
  }, []);

  const handleViewDetails = (referral) => {
    setSelectedReferral(referral);
    setShowDetailsModal(true);
  };

  const handleCreateReferral = () => {
    setShowCreateModal(true);
  };

  const renderReferralList = () => {
    if (referrals.length === 0) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          No referrals found
        </p>
      );
    }

    return referrals.map((referral) => (
      <div
        key={referral.id}
        style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: '0 0 8px 0',
                color: '#212529',
                fontSize: '18px',
                fontWeight: '500',
              }}
            >
              {referral.patientName}
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '6px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ color: '#0d6efd', fontSize: '14px' }}>
                From: {referral.fromBranch}
              </div>
              <div style={{ color: '#0d6efd', fontSize: '14px' }}>
                To: {referral.toBranch}
              </div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>
                📅 {referral.referralDate}
              </div>
            </div>
            <div
              style={{
                marginBottom: '10px',
                color: '#495057',
                fontSize: '14px',
              }}
            >
              Reason: {referral.reason}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: '#d1e7dd',
                color: '#0f5132',
              }}
            >
              {referral.status}
            </span>
            <button
              onClick={() => handleViewDetails(referral)}
              style={{
                padding: '6px 12px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '400',
              }}
            >
              View
            </button>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div
      style={{
        padding: '20px',
        paddingTop: '80px',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2
            style={{
              margin: '0 0 4px 0',
              color: '#212529',
              fontSize: '24px',
              fontWeight: '600',
            }}
          >
            Patient Referrals
          </h2>
          <p style={{ margin: '0', color: '#6c757d', fontSize: '14px' }}>
            Manage patient referrals and care coordination
          </p>
        </div>
        <button
          onClick={handleCreateReferral}
          style={{
            padding: '8px 16px',
            background: '#0d6efd',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '400',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} />
          Create Referral
        </button>
      </div>

      {/* Search and Filter */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search
            size={18}
            color="#6c757d"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            placeholder="Search referrals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px 8px 40px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              width: '100%',
              fontSize: '14px',
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              appearance: 'none',
              fontSize: '14px',
              backgroundColor: 'white',
              paddingRight: '30px',
              width: '100%',
            }}
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div>{renderReferralList()}</div>

      {/* Create Referral Modal */}
      {showCreateModal && (
        <CreateReferralModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Referral Details Modal */}
      {showDetailsModal && (
        <ReferralDetailsModal
          referral={selectedReferral}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

const CreateReferralModal = ({ onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Create Patient Referral
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} color="#6c757d" />
          </button>
        </div>

        <form>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                fontSize: '14px',
              }}
            >
              Patient
            </label>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="">Select patient</option>
              <option value="John Doe">John Doe</option>
              <option value="Maria Santos">Maria Santos</option>
              <option value="Carlos Rodriguez">Carlos Rodriguez</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                From MyHubCares Branch
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select branch</option>
                <option value="My Hub Cares Ortigas Main">
                  My Hub Cares Ortigas Main
                </option>
                <option value="My Hub Cares Pasay">My Hub Cares Pasay</option>
                <option value="My Hub Cares Alabang">
                  My Hub Cares Alabang
                </option>
              </select>
            </div>

            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                To MyHubCares Branch
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select branch</option>
                <option value="My Hub Cares Ortigas Main">
                  My Hub Cares Ortigas Main
                </option>
                <option value="My Hub Cares Pasay">My Hub Cares Pasay</option>
                <option value="My Hub Cares Alabang">
                  My Hub Cares Alabang
                </option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Referral Date
              </label>
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Urgency Level
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                fontSize: '14px',
              }}
            >
              Reason for Referral
            </label>
            <textarea
              rows="3"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                fontSize: '14px',
              }}
            >
              Additional Notes
            </label>
            <textarea
              rows="3"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                background: '#0d6efd',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Create Referral
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReferralDetailsModal = ({ referral, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Referral Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} color="#6c757d" />
          </button>
        </div>

        <div>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                fontSize: '14px',
                color: '#6c757d',
              }}
            >
              Patient Name
            </label>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                fontSize: '14px',
              }}
            >
              {referral.patientName}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#6c757d',
                }}
              >
                From MyHubCares Branch
              </label>
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '14px',
                }}
              >
                {referral.fromBranch}
              </div>
            </div>

            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#6c757d',
                }}
              >
                To MyHubCares Branch
              </label>
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '14px',
                }}
              >
                {referral.toBranch}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#6c757d',
                }}
              >
                Referral Date
              </label>
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '14px',
                }}
              >
                📅 {referral.referralDate}
              </div>
            </div>

            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#6c757d',
                }}
              >
                Status
              </label>
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '14px',
                }}
              >
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#d1e7dd',
                    color: '#0f5132',
                  }}
                >
                  {referral.status}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                fontSize: '14px',
                color: '#6c757d',
              }}
            >
              Urgency Level
            </label>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                fontSize: '14px',
              }}
            >
              {referral.urgency}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                fontSize: '14px',
                color: '#6c757d',
              }}
            >
              Reason for Referral
            </label>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                fontSize: '14px',
                minHeight: '60px',
              }}
            >
              {referral.reason}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                fontSize: '14px',
                color: '#6c757d',
              }}
            >
              Additional Notes
            </label>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                fontSize: '14px',
                minHeight: '60px',
              }}
            >
              {referral.notes}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
