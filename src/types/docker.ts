export interface Container {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'paused'
  ports: Port[]
  volumes?: Volume[]
  network?: string
  created: Date
  isNew?: boolean
}

export interface Volume {
  id: string
  name: string
  mountPath: string
  containerPath?: string
  connectedContainers: string[]
  networkId?: string
  isNew?: boolean
}

export interface Network {
  id: string
  name: string
  containers: Container[]
  isNew?: boolean
}

export interface Port {
  hostPort: number
  containerPort: number
  protocol: 'tcp' | 'udp'
}

export interface Image {
  id: string
  name: string
  tag: string
  size: string
  created: Date
  isOfficial?: boolean
}

export interface ProcessStep {
  id: string
  type: 'search' | 'pull' | 'create' | 'start' | 'connect' | 'error'
  message: string
  details?: string
  position?: Position
  containerId?: string
  stepNumber?: number
  totalSteps?: number
  completed?: boolean
}

export interface Position {
  x: number
  y: number
}

export interface VolumeConnectionProps {
  container: Container
  volume: Volume
  isConnecting: boolean
  index?: number
  containerCount?: number
}

export interface TerminalCommand {
  command: string
  output: string
  timestamp: Date
  isError?: boolean
} 