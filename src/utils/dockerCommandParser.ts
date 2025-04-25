interface ParsedPort {
  host: string;
  container: string;
}

interface ParsedVolume {
  name: string;
  mountPath: string;
}

interface ParsedContainer {
  name?: string;
  image: string;
  ports: ParsedPort[];
  volumes: ParsedVolume[];
  networkId?: string;
}

interface ParsedNetwork {
  id: string;
  name: string;
  created: string;
}

export function parseDockerNetworkCommand(command: string): ParsedNetwork | null {
  try {
    const parts = command.trim().split(/\s+/);
    console.log('Network command parts:', parts);
    
    // docker network create [name]
    if (parts.length >= 4 && 
        parts[0] === 'docker' && 
        parts[1] === 'network' && 
        parts[2] === 'create') {
      const networkName = parts[3];
      console.log('Creating network with name:', networkName);
      
      return {
        id: `network-${Date.now()}`,
        name: networkName,
        created: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing network command:', error);
    return null;
  }
}

export function parseDockerRunCommand(command: string): ParsedContainer | null {
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
      if (volumeMapping.length === 2) {
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