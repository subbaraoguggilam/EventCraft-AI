import React, { useState } from 'react'
import { Plus, Sparkles, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import toast from 'react-hot-toast'
import type { BudgetItem, CreateBudgetItemPayload } from '../../types'
import { budgetApi, getErrorMessage } from '../../services/api'
import Button from '../Common/Button'
import Input from '../Common/Input'
import Modal from '../Common/Modal'
import EmptyState from '../Common/EmptyState'

export interface BudgetTabProps {
  eventId: string
  totalBudget?: number
  items: BudgetItem[]
  onRefresh: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  Venue: '#6366f1',
  Catering: '#ec4899',
  'Photography/Videography': '#8b5cf6',
  Photography: '#8b5cf6',
  Entertainment: '#f59e0b',
  Decorations: '#10b981',
  Floral: '#14b8a6',
  Audio: '#3b82f6',
  Other: '#64748b',
}

const DEFAULT_COLOR = '#94a3b8'

export const BudgetTab: React.FC<BudgetTabProps> = ({
  eventId,
  totalBudget = 0,
  items,
  onRefresh,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [category, setCategory] = useState('Venue')
  const [name, setName] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [actualCost, setActualCost] = useState('')
  const [paid, setPaid] = useState(false)

  const totalEstimated = items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0)
  const totalActual = items.reduce((sum, item) => sum + (item.actual_cost || 0), 0)
  const remaining = (totalBudget || totalEstimated) - totalActual

  // Chart data grouped by category
  const categoryData = items.reduce<Record<string, number>>((acc, item) => {
    const cat = item.category || 'Other'
    acc[cat] = (acc[cat] || 0) + (item.actual_cost || item.estimated_cost || 0)
    return acc
  }, {})

  const chartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }))

  const handleGenerateBudget = async () => {
    try {
      setIsGenerating(true)
      await budgetApi.generate(eventId)
      toast.success('AI budget generated!')
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter an item name')
      return
    }

    try {
      setIsSubmitting(true)
      const payload: CreateBudgetItemPayload = {
        category,
        description: name.trim(),
        estimated_cost: parseFloat(estimatedCost) || 0,
        actual_cost: actualCost ? parseFloat(actualCost) : null,
        paid,
      }
      await budgetApi.create(eventId, payload)
      toast.success('Budget item added')
      setIsAddModalOpen(false)
      setName('')
      setEstimatedCost('')
      setActualCost('')
      setPaid(false)
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePaid = async (item: BudgetItem) => {
    try {
      await budgetApi.update(eventId, item.id, { paid: !item.paid })
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await budgetApi.delete(eventId, itemId)
      toast.success('Item removed')
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Budget Tracker</h2>
          <p className="text-xs text-gray-500 mt-1">
            Track allocations, payments, and actual costs in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-4 h-4 text-indigo-600" />}
            onClick={handleGenerateBudget}
            isLoading={isGenerating}
          >
            Auto-Allocate with AI
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Target
          </p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            ${(totalBudget || totalEstimated).toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Estimated Cost
          </p>
          <p className="text-xl font-bold text-indigo-600 mt-1">
            ${totalEstimated.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actual Spent
          </p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            ${totalActual.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Remaining Budget
          </p>
          <p
            className={`text-xl font-bold mt-1 ${
              remaining < 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            ${remaining.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Visual Chart & Breakdown */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Spend by Category</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLOR}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`$${val.toLocaleString()}`, 'Amount']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Line Items ({items.length})</h3>
        </div>

        {items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<AlertCircle className="w-8 h-8" />}
              title="No budget items yet"
              description="Start tracking expenses by adding an item or click Auto-Allocate with AI to generate a smart plan."
              actionLabel="Add Item"
              onAction={() => setIsAddModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Item</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold text-right">Estimated</th>
                  <th className="px-6 py-3 font-semibold text-right">Actual</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePaid(item)}
                        className="flex items-center gap-1.5 text-xs font-medium"
                        title={item.paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                      >
                        {item.paid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300" />
                        )}
                        <span className={item.paid ? 'text-emerald-700' : 'text-gray-400'}>
                          {item.paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.description || (item as any).name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-700">
                      ${(item.estimated_cost || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {item.actual_cost != null ? `$${item.actual_cost.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Budget Expense"
        description="Add an expected expense or actual receipt."
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <Input
            label="Item Description"
            placeholder="e.g. Venue Deposit, DJ sound setup"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="Venue">Venue</option>
              <option value="Catering">Catering</option>
              <option value="Photography">Photography/Videography</option>
              <option value="Entertainment">Entertainment / Music</option>
              <option value="Decorations">Decorations & Flowers</option>
              <option value="Transportation">Transportation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Estimated Cost ($)"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              required
            />
            <Input
              label="Actual Cost ($)"
              type="number"
              min="0"
              step="any"
              placeholder="Optional"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is-paid-checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300"
            />
            <label htmlFor="is-paid-checkbox" className="text-sm font-medium text-gray-700">
              Already paid
            </label>
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
              Add Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default BudgetTab
