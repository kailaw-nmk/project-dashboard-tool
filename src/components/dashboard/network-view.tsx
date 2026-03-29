'use client'

import { memo, useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import type { StatusOption } from '@/types/schema'

const EDGE_COLORS: Record<string, string> = {
  api: '#3b82f6',
  data: '#22c55e',
  event: '#f97316',
  other: '#9ca3af',
}

interface SystemNodeData {
  label: string
  status: string
  statusOption: StatusOption | undefined
  phase: string
  [key: string]: unknown
}

const SystemNode = memo(function SystemNode({ data }: NodeProps<Node<SystemNodeData>>) {
  const borderColor = data.statusOption?.color ?? '#d4d4d8'

  return (
    <div
      className="rounded-lg border-2 bg-card px-4 py-3 shadow-sm"
      style={{ borderColor }}
    >
      <Handle type="target" position={Position.Left} className="!bg-zinc-400" />
      <div className="text-sm font-medium">{data.label}</div>
      <div className="text-xs text-muted-foreground">{data.phase}</div>
      <Handle type="source" position={Position.Right} className="!bg-zinc-400" />
    </div>
  )
})

const nodeTypes = { systemNode: SystemNode }

export function NetworkView() {
  const { systems, dependencies, settings } = useProjectStore(
    useShallow((s) => ({
      systems: s.projectData?.systems ?? [],
      dependencies: s.projectData?.dependencies ?? [],
      settings: s.projectData?.settings,
    })),
  )
  const updateSystem = useProjectStore((s) => s.updateSystem)
  const setSelectedSystemId = useProjectStore((s) => s.setSelectedSystemId)

  const initialNodes: Node<SystemNodeData>[] = useMemo(
    () =>
      systems.map((sys) => ({
        id: sys.id,
        position: sys.position,
        type: 'systemNode',
        data: {
          label: sys.name,
          status: sys.status,
          statusOption: settings?.statusOptions.find((o) => o.id === sys.status),
          phase:
            settings?.phaseOptions.find((o) => o.id === sys.phase)?.label ?? sys.phase,
        },
      })),
    [systems, settings],
  )

  const initialEdges: Edge[] = useMemo(
    () =>
      dependencies.map((dep) => ({
        id: dep.id,
        source: dep.sourceSystemId,
        target: dep.targetSystemId,
        label: dep.label,
        animated: true,
        style: { stroke: EDGE_COLORS[dep.type] ?? EDGE_COLORS.other },
        labelStyle: { fontSize: 11 },
      })),
    [dependencies],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_event, node) => {
      updateSystem(node.id, { position: { x: node.position.x, y: node.position.y } })
    },
    [updateSystem],
  )

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedSystemId(node.id)
    },
    [setSelectedSystemId],
  )

  return (
    <div className="h-[600px] w-full rounded-lg border bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
