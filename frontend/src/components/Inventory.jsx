import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Search, Filter, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
    fetchMedications();
    fetchFacilities();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inventory`);
      const data = await response.json();

      if (data.success) {
        setInventory(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setToast({
        message: 'Failed to fetch inventory: ' + error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMedications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/medications`);
      const data = await response.json();

      if (data.success) {
        setMedications(data.data);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/facilities`);
      const data = await response.json();

      if (data.success) {
        setFacilities(data.data);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleShowAddItemModal = () => {
    setSelectedItem(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleShowEditItemModal = (item) => {
    setSelectedItem(item);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleShowRestockModal = (item) => {
    setSelectedItem(item);
    setModalMode('restock');
    setShowModal(true);
  };

  const handleAddItem = async (itemData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Inventory item added successfully',
          type: 'success',
        });
        setShowModal(false);
        fetchInventory(); // Refresh the inventory list
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
      setToast({
        message: 'Failed to add inventory item: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleUpdateItem = async (itemData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/inventory/${selectedItem.inventory_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Inventory item updated successfully',
          type: 'success',
        });
        setShowModal(false);
        fetchInventory(); // Refresh the inventory list
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating inventory item:', error);
      setToast({
        message: 'Failed to update inventory item: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleRestockItem = async (quantity) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/inventory/${selectedItem.inventory_id}/restock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setToast({
          message: `Successfully added ${quantity} units to inventory`,
          type: 'success',
        });
        setShowModal(false);
        fetchInventory(); // Refresh the inventory list
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error restocking inventory item:', error);
      setToast({
        message: 'Failed to restock inventory item: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          setToast({
            message: 'Inventory item deleted successfully',
            type: 'success',
          });
          fetchInventory(); // Refresh the inventory list
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        setToast({
          message: 'Failed to delete inventory item: ' + error.message,
          type: 'error',
        });
      }
    }
  };

  const getFilteredInventory = () => {
    let filtered = inventory;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.medication_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.facility_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType === 'low') {
      filtered = filtered.filter(
        (item) => item.quantity_on_hand <= item.reorder_level
      );
    } else if (filterType === 'expiring') {
      filtered = filtered.filter((item) => {
        const expiryDate = new Date(item.expiry_date);
        const monthsUntilExpiry =
          (expiryDate - new Date()) / (1000 * 60 * 60 * 24 * 30);
        return monthsUntilExpiry < 3;
      });
    }

    return filtered;
  };

  const renderInventoryGrid = () => {
    const filteredInventory = getFilteredInventory();

    if (loading) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          Loading inventory...
        </p>
      );
    }

    if (filteredInventory.length === 0) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          No inventory items found
        </p>
      );
    }

    return filteredInventory.map((item) => {
      const isLowStock = item.quantity_on_hand <= item.reorder_level;
      const expiryDate = new Date(item.expiry_date);
      const monthsUntilExpiry =
        (expiryDate - new Date()) / (1000 * 60 * 60 * 24 * 30);
      const isExpiringSoon = monthsUntilExpiry < 3;

      return (
        <div
          key={item.inventory_id}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: isLowStock ? '1px solid #dc3545' : 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px',
            }}
          >
            <h3 style={{ margin: 0, color: '#333', fontSize: '16px' }}>
              {item.medication_name}
            </h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              {isLowStock && (
                <span
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertCircle size={12} />
                  LOW STOCK
                </span>
              )}
              {isExpiringSoon && (
                <span
                  style={{
                    background: '#ffc107',
                    color: '#333',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  EXPIRING SOON
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: isLowStock ? '#dc3545' : '#007bff',
              marginBottom: '10px',
            }}
          >
            {item.quantity_on_hand} {item.unit}
          </div>

          <div
            style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}
          >
            <strong>Reorder Level:</strong> {item.reorder_level} {item.unit}
          </div>

          <div
            style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}
          >
            <strong>Expiry:</strong>{' '}
            {new Date(item.expiry_date).toLocaleDateString()}
          </div>

          <div
            style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}
          >
            <strong>Facility:</strong> {item.facility_name}
          </div>

          <div
            style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}
          >
            <strong>Supplier:</strong> {item.supplier}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleShowEditItemModal(item)}
              style={{
                padding: '6px 12px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Edit
            </button>
            <button
              onClick={() => handleShowRestockModal(item)}
              style={{
                padding: '6px 12px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Restock
            </button>
            <button
              onClick={() => handleDeleteItem(item.inventory_id)}
              style={{
                padding: '6px 12px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Delete
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ padding: '20px', paddingTop: '80px' }}>
      {/* Header with Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
            Inventory Management
          </h2>
          <p
            style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}
          >
            Manage medication stock and supplies
          </p>
        </div>
        <button
          onClick={handleShowAddItemModal}
          style={{
            padding: '10px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} />
          Add New Item
        </button>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            color="#6c757d"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              width: '100%',
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter
            size={18}
            color="#6c757d"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              appearance: 'none',
            }}
          >
            <option value="all">All Items</option>
            <option value="low">Low Stock</option>
            <option value="expiring">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* Inventory Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '15px',
        }}
      >
        {renderInventoryGrid()}
      </div>

      {/* Modal */}
      {showModal && (
        <InventoryModal
          mode={modalMode}
          item={selectedItem}
          medications={medications}
          facilities={facilities}
          onClose={() => setShowModal(false)}
          onAdd={handleAddItem}
          onUpdate={handleUpdateItem}
          onRestock={handleRestockItem}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor:
              toast.type === 'success'
                ? '#28a745'
                : toast.type === 'error'
                ? '#dc3545'
                : '#17a2b8',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            animation: 'slideIn 0.3s ease',
            zIndex: 9999,
          }}
        >
          {toast.type === 'success' ? (
            <Check size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}

      {/* Add keyframes for animation */}
      <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
    </div>
  );
};

const InventoryModal = ({
  mode,
  item,
  medications,
  facilities,
  onClose,
  onAdd,
  onUpdate,
  onRestock,
}) => {
  const [formData, setFormData] = useState(
    item || {
      medication_id: '',
      facility_id: '',
      batch_number: '',
      quantity_on_hand: '',
      unit: 'tablets',
      expiry_date: '',
      reorder_level: '',
      supplier: '',
      cost_per_unit: '',
    }
  );

  const [restockQuantity, setRestockQuantity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'add') {
      onAdd(formData);
    } else if (mode === 'edit') {
      onUpdate(formData);
    }
  };

  const handleRestock = (e) => {
    e.preventDefault();
    onRestock(restockQuantity);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (mode === 'restock') {
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
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
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
            <h2 style={{ margin: 0 }}>Restock Item</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '4px',
              }}
            >
              <X size={24} color="#6c757d" />
            </button>
          </div>

          <form onSubmit={handleRestock}>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Medication Name
              </label>
              <input
                type="text"
                value={item.medication_name}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Current Stock
              </label>
              <input
                type="text"
                value={`${item.quantity_on_hand} ${item.unit}`}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Quantity to Add <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                required
                min="1"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
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
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Restock
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
          padding: '30px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: 'calc(100vh - 104px)',
          overflow: 'auto',
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
          <h2 style={{ margin: 0 }}>
            {mode === 'add' ? 'Add Inventory Item' : 'Edit Inventory Item'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '4px',
            }}
          >
            <X size={24} color="#6c757d" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Medication <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="medication_id"
              value={formData.medication_id}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">Select Medication</option>
              {medications.map((med) => (
                <option key={med.medication_id} value={med.medication_id}>
                  {med.medication_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Facility <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="facility_id"
              value={formData.facility_id}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">Select Facility</option>
              {facilities.map((facility) => (
                <option key={facility.facility_id} value={facility.facility_id}>
                  {facility.facility_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Batch Number
            </label>
            <input
              type="text"
              name="batch_number"
              value={formData.batch_number}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Stock Quantity <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="quantity_on_hand"
                value={formData.quantity_on_hand}
                onChange={handleChange}
                required
                min="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Unit <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              >
                <option value="tablets">Tablets</option>
                <option value="capsules">Capsules</option>
                <option value="bottles">Bottles</option>
                <option value="vials">Vials</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Expiry Date <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Reorder Level <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="reorder_level"
                value={formData.reorder_level}
                onChange={handleChange}
                required
                min="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Supplier <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Cost per Unit
              </label>
              <input
                type="number"
                name="cost_per_unit"
                value={formData.cost_per_unit}
                onChange={handleChange}
                step="0.01"
                min="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>

          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
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
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {mode === 'add' ? 'Add Item' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inventory;
