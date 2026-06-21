import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskAPI } from '../api/services'
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'
import { Calendar, User, Flag, ArrowLeft, Plus, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const COLUMNS = [
  { id: 'TODO', label: 'To Do', color: 'border-t-slate-500', dotColor: 'bg-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-blue-500', dotColor: 'bg-blue-400' },
  { id: 'REVIEW', label: 'Review', color: 'border-t-amber-500', dotColor: 'bg-amber-400' },
  { id: 'COMPLETED', label: 'Completed', color: 'border-t-emerald-500', dotColor: 'bg-emerald-400' },
]

const PRIORITY_COLORS = {
  LOW: 'text-slate-400', MEDIUM: 'text-blue-400', HIGH: 'text-amber-400', CRITICAL: 'text-red-400'
}

function TaskCard({ task, overlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}
      className={clsx('kanban-card bg-slate-800', overlay && 'shadow-2xl shadow-indigo-500/20 rotate-1 scale-105')}>
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 line-clamp-2">{task.title}</p>
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {task.priority && (
              <span className={clsx('flex items-center gap-1 text-xs font-medium', PRIORITY_COLORS[task.priority])}>
                <Flag size={10} /> {task.priority}
              </span>
            )}
            {task.dueDate && (
              <span className={clsx('flex items-center gap-1 text-xs', task.overdue ? 'text-red-400' : 'text-slate-500')}>
                <Calendar size={10} /> {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
            {task.assignee && (
              <span className="flex items-center gap-1 text-xs text-slate-500 ml-auto">
                <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] text-white">
                  {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
                </div>
                {task.assignee.firstName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KanbanColumn({ column, tasks }) {
  return (
    <div className={clsx('kanban-column bg-slate-800/40 border-t-2', column.color)} style={{ minWidth: '260px' }}>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', column.dotColor)} />
          <h3 className="text-sm font-semibold text-slate-200">{column.label}</h3>
          <span className="text-xs font-mono text-slate-500 bg-slate-700/60 px-1.5 py-0.5 rounded">{tasks.length}</span>
        </div>
        <button className="btn-ghost p-1 text-slate-500">
          <Plus size={14} />
        </button>
      </div>

      <SortableContext items={tasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {tasks.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      </SortableContext>
    </div>
  )
}

export default function KanbanPage() {
  const { projectId } = useParams()
  const queryClient = useQueryClient()
  const [activeTask, setActiveTask] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['kanban', projectId],
    queryFn: () => taskAPI.getKanban(projectId),
  })

  const moveMutation = useMutation({
    mutationFn: taskAPI.move,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanban', projectId] }),
    onError: () => toast.error('Failed to move task'),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const board = data?.data
  const columns = {
    TODO: board?.todo || [],
    IN_PROGRESS: board?.inProgress || [],
    REVIEW: board?.review || [],
    COMPLETED: board?.completed || [],
  }

  const findTaskAndColumn = (taskId) => {
    for (const [colId, tasks] of Object.entries(columns)) {
      const task = tasks.find(t => t.id.toString() === taskId)
      if (task) return { task, colId }
    }
    return null
  }

  const handleDragStart = ({ active }) => {
    const result = findTaskAndColumn(active.id)
    if (result) setActiveTask(result.task)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null)
    if (!over) return

    const fromResult = findTaskAndColumn(active.id)
    if (!fromResult) return

    // Determine target column
    let toColId = null
    for (const [colId, tasks] of Object.entries(columns)) {
      if (colId === over.id || tasks.some(t => t.id.toString() === over.id)) {
        toColId = colId
        break
      }
    }

    if (!toColId || toColId === fromResult.colId) return

    moveMutation.mutate({ taskId: fromResult.task.id, newStatus: toColId })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-96 w-64 rounded-xl flex-shrink-0" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="page-header mb-4">
        <div className="flex items-center gap-3">
          <Link to="/projects" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="page-title">{board?.projectName || 'Kanban Board'}</h1>
            <p className="page-subtitle">Drag tasks between columns to update their status</p>
          </div>
        </div>
        <div className="flex gap-2">
          {COLUMNS.map(col => (
            <span key={col.id} className="text-xs text-slate-500 hidden md:block">
              <span className={clsx('inline-block w-2 h-2 rounded-full mr-1', col.dotColor)} />
              {col.label}: {columns[col.id]?.length || 0}
            </span>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners}
        onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map(col => (
            <KanbanColumn key={col.id} column={col} tasks={columns[col.id] || []} />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} overlay />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
