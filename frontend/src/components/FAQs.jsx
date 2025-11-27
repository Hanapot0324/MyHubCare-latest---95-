import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const FAQs = ({ isAdmin: propIsAdmin }) => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedFaqs, setExpandedFaqs] = useState(new Set());
  const [isAdmin, setIsAdmin] = useState(propIsAdmin || false);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    display_order: 0,
    is_published: true,
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  useEffect(() => {
    // Update isAdmin when prop changes
    setIsAdmin(propIsAdmin || false);
  }, [propIsAdmin]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/faqs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFaqs(data.faqs || []);
        }
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFaq(null);
    // Calculate next display order (highest + 1)
    const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order || 0)) : 0;
    setFormData({
      question: '',
      answer: '',
      category: '',
      display_order: maxOrder + 1,
      is_published: true,
    });
    setShowModal(true);
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      display_order: faq.display_order || 0,
      is_published: faq.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (faqId) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/faqs/${faqId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('FAQ deleted successfully');
        fetchFAQs();
      } else {
        alert('Failed to delete FAQ');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Error deleting FAQ');
    }
  };

  const handleSubmit = async () => {
    if (!formData.question || !formData.answer) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingFaq
        ? `${API_BASE_URL}/faqs/${editingFaq.faq_id}`
        : `${API_BASE_URL}/faqs`;
      
      const method = editingFaq ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingFaq ? 'FAQ updated successfully' : 'FAQ created successfully');
        setShowModal(false);
        fetchFAQs();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to save FAQ');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Error saving FAQ');
    }
  };

  const toggleFaq = (faqId) => {
    const newExpanded = new Set(expandedFaqs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFaqs(newExpanded);
  };

  const categories = ['', ...new Set(faqs.map((faq) => faq.category).filter(Boolean))];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory && (isAdmin || faq.is_published);
  });

  const sortedFaqs = [...filteredFaqs].sort((a, b) => a.display_order - b.display_order);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <HelpCircle size={28} color="#D84040" />
            <h2 style={{ margin: 0, color: '#333', fontSize: '28px' }}>Frequently Asked Questions</h2>
          </div>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
            Find answers to common questions about MyHubCares
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleCreate}
            style={{
              padding: '10px 20px',
              background: '#D84040',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <Plus size={18} />
            Add FAQ
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
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
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 12px 10px 36px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
              }}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              minWidth: '150px',
              fontSize: '14px',
            }}
          >
            <option value="">All Categories</option>
            <option value="General">General</option>
            <option value="Account">Account</option>
            <option value="Billing">Billing</option>
            <option value="Technical">Technical</option>
            <option value="Services">Services</option>
            <option value="Privacy">Privacy</option>
            <option value="Support">Support</option>
          </select>
        </div>
      </div>

      {/* FAQs List */}
      {loading ? (
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ color: '#6c757d' }}>Loading FAQs...</p>
        </div>
      ) : sortedFaqs.length === 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ color: '#6c757d' }}>
            {searchTerm || selectedCategory
              ? 'No FAQs found matching your search criteria.'
              : 'No FAQs available at the moment.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedFaqs.map((faq) => {
            const isExpanded = expandedFaqs.has(faq.faq_id);
            return (
              <div
                key={faq.faq_id}
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    padding: '20px',
                    background: 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '15px',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(faq.faq_id)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '15px',
                      padding: 0,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <h3
                          style={{
                            margin: 0,
                            color: '#333',
                            fontSize: '16px',
                            fontWeight: 600,
                          }}
                        >
                          {faq.question}
                        </h3>
                        {faq.category && (
                          <span
                            style={{
                              padding: '4px 10px',
                              background: '#f0f0f0',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: '#6c757d',
                            }}
                          >
                            {faq.category}
                          </span>
                        )}
                        {!faq.is_published && isAdmin && (
                          <span
                            style={{
                              padding: '4px 10px',
                              background: '#ffc107',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: 'white',
                            }}
                          >
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ color: '#D84040' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(faq)}
                        style={{
                          padding: '8px',
                          background: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Edit2 size={16} color="#6c757d" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.faq_id)}
                        style={{
                          padding: '8px',
                          background: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={16} color="#dc3545" />
                      </button>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 20px 20px 20px',
                      color: '#6c757d',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      borderTop: '1px solid #f0f0f0',
                      marginTop: '10px',
                      paddingTop: '20px',
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{faq.answer}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
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
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
                {editingFaq ? 'Edit FAQ' : 'Create New FAQ'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                }}
              >
                <X size={24} color="#6c757d" />
              </button>
            </div>

            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500 }}>
                  Question *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500 }}>
                  Answer *
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500 }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select a category</option>
                  <option value="General">General</option>
                  <option value="Account">Account</option>
                  <option value="Billing">Billing</option>
                  <option value="Technical">Technical</option>
                  <option value="Services">Services</option>
                  <option value="Privacy">Privacy</option>
                  <option value="Support">Support</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ color: '#333', fontSize: '14px' }}>Published</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#f8f9fa',
                    color: '#333',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: '10px 20px',
                    background: '#D84040',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                  }}
                >
                  <Save size={16} />
                  {editingFaq ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQs;