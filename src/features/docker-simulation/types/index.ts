// Docker 시뮬레이션 관련 타입 정의

export interface Port {
  hostPort: string;
  containerPort: string;
}

export interface Volume {
  id: string;
  name: string;
  mountPath?: string;
  hostPath?: string;
  createdAt: Date;
  networkId?: string;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  ports: Array<{
    hostPort: string;
    containerPort: string;
  }>;
  status: 'running' | 'stopped';
  createdAt: Date;
  volumes?: Volume[];
  network?: string;
  lastCommand?: string;
}

export interface Network {
  id: string;
  name: string;
  containers: Container[];
  isNew?: boolean;
}

export interface Image {
  id: string;
  name: string;
  tag: string;
  size: string;
  created: Date;
  isOfficial: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface ProcessStep {
  id: string;
  type: 'pull' | 'create' | 'start' | 'connect' | 'error' | 'search';
  message: string;
  details?: string;
  targetId?: string;
  position?: Position;
  completed?: boolean;
  stepNumber?: number;
  totalSteps?: number;
  containerId?: string;
}

export interface DockerSimulationProps {
  containers?: Container[];
  networks?: Network[];
  images?: Image[];
  onNetworkCreate?: (networkName: string) => void;
}

export interface ModalProps {
  onClose: () => void;
}

// 명령어 관련 타입
export interface CommandResult {
  success: boolean;
  output: string[];
  message?: string;
  error?: string;
  data?: any;
}

export interface ParsedContainer {
  name?: string;
  image: string;
  ports: ParsedPort[];
  volumes: ParsedVolume[];
  networkId?: string;
}

export interface ParsedPort {
  host: string;
  container: string;
}

export interface ParsedVolume {
  name: string;
  mountPath: string;
}

export interface ParsedNetwork {
  id: string;
  name: string;
  created: string;
}

export interface CreateContainerOptions {
  name?: string;
  image: string;
  ports?: Port[];
  volumes?: Volume[];
  networkId?: string;
  [key: string]: any;
} 