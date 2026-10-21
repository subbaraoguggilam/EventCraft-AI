import React, { useState } from 'react'
import { Plus, Sparkles, Trash2, Mail, Phone, DollarSign, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import type { VendorItem, CreateVendorPayload, VendorStatus, VendorType } from '../../types'
import { vendorsApi, getErrorMessage } from '../../services/api'
import { formatINR } from '../../utils/currency'
import Button from '../Common/Button'
import Input from '../Common/Input'
import Modal from '../Common/Modal'
import Badge from '../Common/Badge'
import EmptyState from '../Common/EmptyState'

export interface VendorsTabProps {
  eventId: string
  items: VendorItem[]
  onRefresh: () => void
}

export const VendorsTab: React.FC<VendorsTabProps> = ({ eventId, items, onRefresh }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [vendorType, setVendorType] = useState<VendorType>('catering')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState<VendorStatus>('pending')
  const [notes, setNotes] = useState('')

  const confirmedCount = items.filter((i) => i.status === 'confirmed').length
  const contactedCount = items.filter((i) => i.status === 'contacted').length
  const pendingCount = items.filter((i) => i.status === 'pending').length

  const handleGenerateVendors = async () => {
    try {
      setIsGenerating(true)
      await vendorsApi.generate(eventId)
      toast.success('AI vendor checklist generated!')
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a vendor or company name')
      return
    }

    try {
      setIsSubmitting(true)
      const payload: CreateVendorPayload = {
        name: name.trim(),
        vendor_type: vendorType,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        price: price ? parseFloat(price) : null,
        status,
        notes: notes.trim() || null,
      }
      await vendorsApi.create(eventId, payload)
      toast.success('Vendor added')
      setIsAddModalOpen(false)
      setName('')
      setVendorType('catering')
      setContactEmail('')
      setContactPhone('')
      setPrice('')
      setStatus('pending')
      setNotes('')
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (item: VendorItem, newStatus: VendorStatus) => {
    try {
      await vendorsApi.update(eventId, item.id, { status: newStatus })
      toast.success(`Updated status to ${newStatus}`)
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      await vendorsApi.delete(eventId, vendorId)
      toast.success('Vendor removed')
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const getStatusBadge = (s: VendorStatus) => {
    switch (s) {
      case 'confirmed':
        return <Badge variant="success" size="sm">Confirmed</Badge>
      case 'contacted':
        return <Badge variant="info" size="sm">Contacted</Badge>
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>
      case 'cancelled':
        return <Badge variant="danger" size="sm">Cancelled</Badge>
      default:
        return <Badge size="sm">{s}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Vendor Management</h2>
          <p className="text-xs text-gray-500 mt-1">
            Track inquiries, quotes, contracts, and supplier contacts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-4 h-4 text-indigo-600" />}
            onClick={handleGenerateVendors}
            isLoading={isGenerating}
          >
            Auto-Generate Checklist
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Status Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Confirmed</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{confirmedCount}</p>
          </div>
          <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            ✓
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">In Discussion</p>
            <p className="text-xl font-bold text-sky-600 mt-0.5">{contactedCount}</p>
          </div>
          <span className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm">
            💬
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Pending Outreach</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <span className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            ⏳
          </span>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Vendor Directory ({items.length})</h3>

        {items.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No vendors added"
            description="Manage all your event service providers in one place. Add suppliers or click Auto-Generate Checklist."
            actionLabel="Add Vendor"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const vendorDisplayName = item.name || (item as any).vendor_name || 'Vendor'
              const vendorPrice = item.price != null ? item.price : (item as any).quoted_price

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {item.vendor_type}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>

                    <h4 className="text-base font-bold text-gray-900 mt-1">{vendorDisplayName}</h4>

                    {item.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.notes}</p>}

                    <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                      {item.contact_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a
                            href={`mailto:${item.contact_email}`}
                            className="hover:text-indigo-600 truncate"
                          >
                            {item.contact_email}
                          </a>
                        </div>
                      )}

                      {item.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{item.contact_phone}</span>
                        </div>
                      )}

                      {vendorPrice != null && (
                        <div className="flex items-center gap-2 font-medium text-gray-900">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Quoted: {formatINR(vendorPrice)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item, e.target.value as VendorStatus)}
                      className="text-xs rounded-lg border border-gray-200 py-1 px-2 focus:ring-1 focus:ring-indigo-500 bg-white"
                      aria-label="Change vendor status"
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => handleDeleteVendor(item.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete vendor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Event Vendor"
        description="Record details and quoted rates for suppliers and service providers."
      >
        <form onSubmit={handleCreateVendor} className="space-y-4">
          <Input
            label="Vendor / Company Name"
            placeholder="e.g. Royal Maharaj Caterers, Genda Phool Decorators"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                value={vendorType}
                onChange={(e) => setVendorType(e.target.value as VendorType)}
                className="block w-full rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="catering">Catering (Halwai & Sweets)</option>
                <option value="photography">Candid Photography & Drone</option>
                <option value="venue">Banquet / Resort Lawn</option>
                <option value="music">Live Dhol & Bollywood DJ</option>
                <option value="decoration">Mandap & Floral Décor</option>
                <option value="transportation">Baraat Horse / Vintage Car</option>
                <option value="other">Mehendi Artist / Pandit Ji / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
                className="block w-full rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Email"
              type="email"
              placeholder="vendor@company.in"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />

            <Input
              label="Contact Phone"
              placeholder="+91 98765 43210"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          <Input
            label="Quoted / Estimated Price (₹)"
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 75000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes & Scope</label>
            <textarea
              rows={2}
              className="block w-full rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              placeholder="Included services, menu choices, payment schedule..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Add Vendor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default VendorsTab
