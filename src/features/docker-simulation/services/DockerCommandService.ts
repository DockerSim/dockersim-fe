import { CommandResult, ParsedContainer, ParsedNetwork, Container, Image, Network } from '../types';
import { dockerErrors, errorHandler } from '../../../utils/errorHandler';

/**
 * DockerCommandService - Docker 명령어 실행을 담당하는 서비스
 * 
 * 책임:
 * - Docker 명령어 파싱 및 실행
 * - 명령어별 로직 처리
 * - 시뮬레이션 결과 생성
 * - 통합 에러 처리
 */
export class DockerCommandService {
  /**
   * Docker 명령어 실행
   */
  static async execute(command: string): Promise<CommandResult> {
    const trimmedCommand = command.trim();
    
    try {
      // docker run 명령어
      if (trimmedCommand.startsWith('docker run')) {
        return await this.handleRunCommand(trimmedCommand);
      }
      
      // docker create 명령어
      if (trimmedCommand.startsWith('docker create')) {
        return await this.handleCreateCommand(trimmedCommand);
      }
      
      // docker ps 명령어
      if (trimmedCommand === 'docker ps' || trimmedCommand === 'docker ps -a') {
        return this.handlePsCommand(trimmedCommand);
      }
      
      // docker images 명령어
      if (trimmedCommand === 'docker images') {
        return this.handleImagesCommand();
      }
      
      // docker pull 명령어
      if (trimmedCommand.startsWith('docker pull')) {
        return await this.handlePullCommand(trimmedCommand);
      }
      
      // docker start 명령어
      if (trimmedCommand.startsWith('docker start')) {
        return this.handleStartCommand(trimmedCommand);
      }
      
      // docker stop 명령어
      if (trimmedCommand.startsWith('docker stop')) {
        return this.handleStopCommand(trimmedCommand);
      }
      
      // docker rm 명령어
      if (trimmedCommand.startsWith('docker rm')) {
        return this.handleRemoveCommand(trimmedCommand);
      }
      
      // docker network create 명령어
      if (trimmedCommand.startsWith('docker network create')) {
        return this.handleNetworkCreateCommand(trimmedCommand);
      }
      
      // 알 수 없는 명령어
      throw dockerErrors.commandFailed(trimmedCommand, { reason: 'Unknown command' });
      
    } catch (error) {
      const appError = errorHandler.handle(error);
      return {
        success: false,
        output: [`Error: ${appError.message}`],
        error: appError.message
      };
    }
  }

  /**
   * docker run 명령어 처리
   */
  private static async handleRunCommand(command: string): Promise<CommandResult> {
    const parsed = this.parseDockerRunCommand(command);
    
    if (!parsed) {
      return {
        success: false,
        output: ['Invalid docker run command format'],
        error: 'Failed to parse docker run command'
      };
    }

    // 시뮬레이션: 컨테이너 생성 중
    await this.simulateDelay(1000);

    const containerId = this.generateId();
    const containerName = parsed.name || `container_${containerId.slice(0, 8)}`;

    return {
      success: true,
      output: [
        `Pulling image ${parsed.image}...`,
        `Creating container ${containerName}...`,
        `Starting container ${containerName}...`,
        `Container ${containerName} is now running`,
        `Container ID: ${containerId}`
      ],
      message: `Container ${containerName} created and started successfully`,
      data: {
        container: {
          id: containerId,
          name: containerName,
          image: parsed.image,
          ports: parsed.ports,
          volumes: parsed.volumes,
          status: 'running',
          createdAt: new Date(),
          network: parsed.networkId || 'bridge'
        }
      }
    };
  }

  /**
   * docker create 명령어 처리
   */
  private static async handleCreateCommand(command: string): Promise<CommandResult> {
    // docker create와 docker run은 동일한 옵션을 사용하므로 같은 파싱 메서드 사용
    const parsed = this.parseDockerRunCommand(command.replace('docker create', 'docker run'));
    
    if (!parsed) {
      return {
        success: false,
        output: ['Invalid docker create command format'],
        error: 'Failed to parse docker create command'
      };
    }

    // 시뮬레이션: 컨테이너 생성 중
    await this.simulateDelay(800);

    const containerId = this.generateId();
    const containerName = parsed.name || `container_${containerId.slice(0, 8)}`;

    return {
      success: true,
      output: [
        `Pulling image ${parsed.image}...`,
        `Creating container ${containerName}...`,
        `Container ${containerName} created`,
        `Container ID: ${containerId}`
      ],
      message: `Container ${containerName} created successfully`,
      data: {
        container: {
          id: containerId,
          name: containerName,
          image: parsed.image,
          ports: parsed.ports,
          volumes: parsed.volumes,
          status: 'stopped',
          createdAt: new Date(),
          network: parsed.networkId || 'bridge'
        }
      }
    };
  }

  /**
   * docker ps 명령어 처리
   */
  private static handlePsCommand(command: string): CommandResult {
    const showAll = command.includes('-a');
    
    // 실제 구현에서는 스토어에서 컨테이너 목록을 가져와야 함
    // 여기서는 시뮬레이션 데이터 반환
    return {
      success: true,
      output: [
        'CONTAINER ID   IMAGE          COMMAND   CREATED          STATUS          PORTS           NAMES',
        '컨테이너 목록은 터미널 우측의 "컨테이너 리스트" 버튼을 클릭하여 확인하세요.'
      ]
    };
  }

  /**
   * docker images 명령어 처리
   */
  private static handleImagesCommand(): CommandResult {
    return {
      success: true,
      output: [
        'REPOSITORY   TAG       IMAGE ID       CREATED         SIZE',
        '이미지 목록은 터미널 우측의 "로컬 이미지" 버튼을 클릭하여 확인하세요.'
      ]
    };
  }

  /**
   * docker pull 명령어 처리
   */
  private static async handlePullCommand(command: string): Promise<CommandResult> {
    const parts = command.split(' ');
    if (parts.length < 3) {
      return {
        success: false,
        output: ['Usage: docker pull <image>'],
        error: 'Invalid pull command format'
      };
    }

    const imageName = parts[2];
    
    // 시뮬레이션: 이미지 다운로드
    await this.simulateDelay(2000);

    return {
      success: true,
      output: [
        `Pulling ${imageName}...`,
        `Download complete`,
        `Image ${imageName} pulled successfully`
      ],
      message: `Image ${imageName} downloaded`,
      data: { imageName }
    };
  }

  /**
   * docker start/stop/rm 명령어 처리
   */
  private static handleStartCommand(command: string): CommandResult {
    const containerName = command.split(' ')[2];
    if (!containerName) {
      return {
        success: false,
        output: ['Usage: docker start <container>'],
        error: 'Container name required'
      };
    }

    return {
      success: true,
      output: [`Container ${containerName} started`],
      message: `Container ${containerName} started successfully`
    };
  }

  private static handleStopCommand(command: string): CommandResult {
    const containerName = command.split(' ')[2];
    if (!containerName) {
      return {
        success: false,
        output: ['Usage: docker stop <container>'],
        error: 'Container name required'
      };
    }

    return {
      success: true,
      output: [`Container ${containerName} stopped`],
      message: `Container ${containerName} stopped successfully`
    };
  }

  private static handleRemoveCommand(command: string): CommandResult {
    const containerName = command.split(' ')[2];
    if (!containerName) {
      return {
        success: false,
        output: ['Usage: docker rm <container>'],
        error: 'Container name required'
      };
    }

    return {
      success: true,
      output: [`Container ${containerName} removed`],
      message: `Container ${containerName} removed successfully`
    };
  }

  /**
   * docker network create 명령어 처리
   */
  private static handleNetworkCreateCommand(command: string): CommandResult {
    const parts = command.split(' ');
    if (parts.length < 4) {
      return {
        success: false,
        output: ['Usage: docker network create <name>'],
        error: 'Network name required'
      };
    }

    const networkName = parts[3];
    const networkId = this.generateId();

    return {
      success: true,
      output: [`Network ${networkName} created with ID: ${networkId}`],
      message: `Network ${networkName} created successfully`,
      data: {
        network: {
          id: networkId,
          name: networkName,
          containers: [],
          created: new Date().toISOString()
        }
      }
    };
  }

  /**
   * docker run 명령어 파싱
   */
  private static parseDockerRunCommand(command: string): ParsedContainer | null {
    const parts = command.split(' ').filter(part => part !== '\\');
    if (parts[0] !== 'docker' || parts[1] !== 'run') return null;

    const result: ParsedContainer = {
      image: '',
      ports: [],
      volumes: []
    };

    let i = 2;
    while (i < parts.length) {
      if (parts[i] === '-d' || parts[i] === '--detach') {
        i++;
        continue;
      }

      if (parts[i] === '--name' && parts[i + 1]) {
        result.name = parts[i + 1];
        i += 2;
        continue;
      }

      if ((parts[i] === '-p' || parts[i] === '--publish') && parts[i + 1]) {
        const portMapping = parts[i + 1].split(':');
        if (portMapping.length === 2) {
          result.ports.push({
            host: portMapping[0],
            container: portMapping[1]
          });
        }
        i += 2;
        continue;
      }

      if ((parts[i] === '-v' || parts[i] === '--volume') && parts[i + 1]) {
        const volumeMapping = parts[i + 1].split(':');
        if (volumeMapping.length >= 2) {
          result.volumes.push({
            name: volumeMapping[0],
            mountPath: volumeMapping[1]
          });
        }
        i += 2;
        continue;
      }

      if (parts[i] === '--network' && parts[i + 1]) {
        result.networkId = parts[i + 1];
        i += 2;
        continue;
      }

      if (!parts[i].startsWith('-')) {
        result.image = parts[i];
        break;
      }

      i++;
    }

    return result.image ? result : null;
  }

  /**
   * 유틸리티 메서드들
   */
  private static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private static async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 