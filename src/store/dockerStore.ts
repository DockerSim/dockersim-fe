import { create } from 'zustand'

// 타입 정의
export interface Container {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'paused'
  ports: Port[]
  volumes?: Volume[]
  network: string
  created: Date
  command?: string
  environment?: Record<string, string>
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
  driver?: string
  subnet?: string
  gateway?: string
  isNew?: boolean
}

export interface Port {
  hostPort: number
  containerPort: number
  protocol: 'tcp' | 'udp'
}

export interface TerminalHistory {
  id: string
  command: string
  output: string
  timestamp: string
  isError: boolean
}

interface DockerStore {
  // 상태
  containers: Container[]
  volumes: Volume[]
  networks: Network[]
  terminalHistory: TerminalHistory[]
  currentCommand: string

  // 액션
  setCurrentCommand: (command: string) => void
  addTerminalHistory: (history: TerminalHistory) => void
  clearTerminalHistory: () => void
  executeCommand: (command: string) => void
  addMessage: (message: string) => void
  
  // 컨테이너 액션
  addContainer: (container: Container) => void
  removeContainer: (id: string) => void
  updateContainer: (id: string, updates: Partial<Container>) => void
  
  // 볼륨 액션
  addVolume: (volume: Volume) => void
  removeVolume: (id: string) => void
  updateVolume: (id: string, updates: Partial<Volume>) => void
  
  // 네트워크 액션
  addNetwork: (network: Network) => void
  removeNetwork: (id: string) => void
  updateNetwork: (id: string, updates: Partial<Network>) => void
}

export const useDockerStore = create<DockerStore>((set, get) => ({
  // 초기 상태
  containers: [],
  volumes: [],
  networks: [
    {
      id: 'bridge',
      name: 'bridge',
      containers: [],
      driver: 'bridge',
      subnet: '172.17.0.0/16',
      gateway: '172.17.0.1'
    }
  ],
  terminalHistory: [],
  currentCommand: '',

  // 액션 구현
  setCurrentCommand: (command: string) => set({ currentCommand: command }),
  
  addTerminalHistory: (history: TerminalHistory) => 
    set((state) => ({ 
      terminalHistory: [...state.terminalHistory, history] 
    })),
  
  clearTerminalHistory: () => set({ terminalHistory: [] }),

  // 단순 메시지 추가 함수 (오류 없이)
  addMessage: (message: string) => {
    const { addTerminalHistory } = get()
    addTerminalHistory({
      id: `msg_${Date.now()}`,
      command: '',
      output: message,
      timestamp: new Date().toISOString(),
      isError: false
    })
  },
  
  executeCommand: (command: string) => {
    const { addTerminalHistory, addContainer, addVolume, addNetwork, clearTerminalHistory } = get()
    const timestamp = new Date().toISOString()
    let output = ''
    let isError = false

    try {
      // 빈 명령어는 무시
      if (!command.trim()) {
        return
      }

      // 간단한 Docker 명령어 시뮬레이션
      if (command.startsWith('docker ps')) {
        output = `CONTAINER ID   IMAGE           COMMAND                  CREATED         STATUS         PORTS                    NAMES`
      } else if (command.startsWith('docker run')) {
        // docker run 명령어 파싱
        const nameMatch = command.match(/--name\s+(\S+)/)
        const imageMatch = command.match(/(\S+)(?:\s+(.*))?$/)
        
        if (imageMatch) {
          const image = imageMatch[1]
          const containerName = nameMatch ? nameMatch[1] : `container_${Date.now()}`
          
          // 새 컨테이너 추가
          addContainer({
            id: containerName,
            name: containerName,
            image: image,
            status: 'running',
            ports: [],
            network: 'bridge',
            created: new Date()
          })
          
          output = `Container ${containerName} created and started`
        } else {
          output = 'Error: Invalid docker run command'
          isError = true
        }
      } else if (command.startsWith('docker pull')) {
        const imageName = command.split(' ').slice(2).join(' ')
        if (imageName) {
          output = `Pulling ${imageName}... Done`
        } else {
          output = 'Error: Image name required'
          isError = true
        }
      } else if (command.startsWith('docker rmi')) {
        const imageName = command.split(' ').slice(2).join(' ')
        if (imageName) {
          output = `Deleted: ${imageName}`
        } else {
          output = 'Error: Image name required'
          isError = true
        }
      } else if (command.startsWith('docker start')) {
        const containerName = command.split(' ')[2]
        if (containerName) {
          output = `Container ${containerName} started`
        } else {
          output = 'Error: Container name required'
          isError = true
        }
      } else if (command.startsWith('docker stop')) {
        const containerName = command.split(' ')[2]
        if (containerName) {
          output = `Container ${containerName} stopped`
        } else {
          output = 'Error: Container name required'
          isError = true
        }
      } else if (command.startsWith('docker pause')) {
        const containerName = command.split(' ')[2]
        if (containerName) {
          output = `Container ${containerName} paused`
        } else {
          output = 'Error: Container name required'
          isError = true
        }
      } else if (command.startsWith('docker rm')) {
        const containerName = command.split(' ')[2]
        if (containerName) {
          output = `Container ${containerName} removed`
        } else {
          output = 'Error: Container name required'
          isError = true
        }
      } else if (command.startsWith('docker volume create')) {
        const volumeName = command.split(' ')[3] || `volume_${Date.now()}`
        
        addVolume({
          id: `vol_${Date.now()}`,
          name: volumeName,
          mountPath: '/var/lib/docker/volumes',
          connectedContainers: []
        })
        
        output = `Volume ${volumeName} created`
      } else if (command.startsWith('docker network create')) {
        const networkName = command.split(' ')[3] || `network_${Date.now()}`
        
        addNetwork({
          id: `net_${Date.now()}`,
          name: networkName,
          containers: []
        })
        
        output = `Network ${networkName} created`
      } else if (command.startsWith('docker network rm')) {
        const networkName = command.split(' ')[3]
        if (networkName) {
          const { removeNetwork } = get()
          removeNetwork(networkName)
          output = `Network ${networkName} removed`
        } else {
          output = 'Error: Network name required'
          isError = true
        }
      } else if (command.startsWith('docker network connect')) {
        const parts = command.split(' ')
        if (parts.length >= 4) {
          const networkName = parts[3]
          const containerName = parts[4]
          output = `Container ${containerName} connected to network ${networkName}`
        } else {
          output = 'Error: Network and container names required'
          isError = true
        }
      } else if (command === 'clear') {
        clearTerminalHistory()
        return
      } else if (command.startsWith('docker')) {
        // 알 수 없는 Docker 명령어도 성공적으로 처리
        output = `Command executed: ${command}`
      } else if (command.startsWith('echo')) {
        // echo 명령어는 완전히 무시하고 아무것도 하지 않음
        return
      } else {
        // 알 수 없는 명령어도 오류로 표시하지 않고 무시
        return
      }
    } catch (error) {
      output = `Error executing command: ${error}`
      isError = true
    }

    // 터미널 히스토리에 추가
    addTerminalHistory({
      id: `cmd_${Date.now()}`,
      command,
      output,
      timestamp,
      isError
    })
  },
  
  // 컨테이너 액션
  addContainer: (container: Container) => 
    set((state) => ({ 
      containers: [...state.containers, container] 
    })),
  
  removeContainer: (id: string) => 
    set((state) => ({ 
      containers: state.containers.filter(c => c.id !== id) 
    })),
  
  updateContainer: (id: string, updates: Partial<Container>) => 
    set((state) => ({ 
      containers: state.containers.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ) 
    })),
  
  // 볼륨 액션
  addVolume: (volume: Volume) => 
    set((state) => ({ 
      volumes: [...state.volumes, volume] 
    })),
  
  removeVolume: (id: string) => 
    set((state) => ({ 
      volumes: state.volumes.filter(v => v.id !== id) 
    })),
  
  updateVolume: (id: string, updates: Partial<Volume>) => 
    set((state) => ({ 
      volumes: state.volumes.map(v => 
        v.id === id ? { ...v, ...updates } : v
      ) 
    })),
  
  // 네트워크 액션
  addNetwork: (network: Network) => 
    set((state) => ({ 
      networks: [...state.networks, network] 
    })),
  
  removeNetwork: (id: string) => 
    set((state) => ({ 
      networks: state.networks.filter(n => n.id !== id) 
    })),
  
  updateNetwork: (id: string, updates: Partial<Network>) => 
    set((state) => ({ 
      networks: state.networks.map(n => 
        n.id === id ? { ...n, ...updates } : n
      ) 
    }))
})) 