import React, { useState } from 'react'
import { Plus, Sparkles, Trash2, Calendar, CheckCircle2, Circle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import type { TimelineItem, CreateTimelineItemPayload, Priority } from '../../types'
import { timelineApi, getErrorMessage } from '../../services/api'
import Button from '../Common/Button'
import Input from '../Common/Input'
import Modal from '../Common/Modal'
import Badge from '../Common/Badge'
import EmptyState from '../Common/EmptyState'

export interface TimelineTabProps {
  eventId: string
  items: TimelineItem[]
  onRefresh: () => void
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ eventId, items, onRefresh }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  const completedCount = items.filter((i) => i.completed || (i as any).is_completed).length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const filteredItems = items.filter((item) => {
    const isDone = item.completed || (item as any).is_completed
    if (filter === 'pending') return !isDone
    if (filter === 'completed') return isDone
    return true
  })

  const handleGenerateTimeline = async () => {
    try {
      setIsGenerating(true)
      await timelineApi.generate(eventId)
      toast.success('AI milestones generated!')
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a milestone title')
      return
    }

    try {
      setIsSubmitting(true)
      const payload: CreateTimelineItemPayload = {
        title: title.trim(),
        description: description.trim() || '',
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        priority,
        completed: false,
      }
      await timelineApi.create(eventId, payload)
      toast.success('Milestone added')
      setIsAddModalOpen(false)
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('medium')
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleComplete = async (item: TimelineItem) => {
    const currentStatus = item.completed || (item as any).is_completed
    try {
      await timelineApi.update(eventId, item.id, { completed: !currentStatus })
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await timelineApi.delete(eventId, itemId)
      toast.success('Milestone deleted')
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'high':
        return <Badge variant="danger" size="sm">High Priority</Badge>
      case 'medium':
        return <Badge variant="warning" size="sm">Medium</Badge>
      case 'low':
        return <Badge variant="info" size="sm">Low</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Timeline & Task Milestones</h2>
          <p className="text-xs text-gray-500 mt-1">
            Stay on schedule with intelligent milestone tracking and reminders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-4 h-4 text-indigo-600" />}
            onClick={handleGenerateTimeline}
            isLoading={isGenerating}
          >
            Auto-Generate Timeline
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Progress Bar & Filter Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-xs font-semibold text-gray-700">Overall Progress</div>
            <div className="text-sm text-gray-500">
              {completedCount} of {totalCount} completed ({progressPercent}%)
            </div>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'pending'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'completed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Milestones List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title="No milestones found"
            description="Add tasks to your schedule or click Auto-Generate Timeline to produce an AI-guided plan."
            actionLabel="Add Task"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="relative border-l-2 border-indigo-100 ml-4 space-y-6">
            {filteredItems.map((item) => {
              const isDone = item.completed || (item as any).is_completed
              const formattedDate = item.due_date
                ? new Date(item.due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Flexible'

              return (
                <div key={item.id} className="relative pl-6 group">
                  {/* Timeline Node Icon */}
                  <button
                    onClick={() => handleToggleComplete(item)}
                    className="absolute -left-3 top-1 bg-white rounded-full focus:outline-none"
                    title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 bg-white" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-indigo-600 bg-white transition-colors" />
                    )}
                  </button>

                  {/* Task Card */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-gray-50/70 border-gray-200 opacity-75'
                        : 'bg-white border-gray-200/80 hover:border-indigo-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4
                          className={`text-sm font-semibold transition-colors ${
                            isDone ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formattedDate}</span>
                          </span>
                          {getPriorityBadge(item.priority)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Timeline Milestone"
        description="Schedule an important task with deadline and priority."
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <Input
            label="Milestone Title"
            placeholder="e.g. Book DJ, Finalize Guest List, Order Cake"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              className="block w-full rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              placeholder="Notes, requirements, or links"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="block w-full rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
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
              Add Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default TimelineTab
