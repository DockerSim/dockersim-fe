import { useState, useCallback } from 'react';
import { Volume } from '../types';

// 더미 볼륨 데이터
const DUMMY_VOLUMES: Volume[] = [
  {
    id: 'vol_mysql_data',
    name: 'mysql_data',
    mountPath: '/var/lib/mysql',
    createdAt: new Date('2024-03-10'),
    networkId: 'bridge'
  },
  {
    id: 'vol_app_logs',
    name: 'app_logs',
    mountPath: '/var/log/app',
    createdAt: new Date('2024-03-12'),
    networkId: 'bridge'
  },
  {
    id: 'vol_nginx_config',
    name: 'nginx_config',
    mountPath: '/etc/nginx/conf.d',
    createdAt: new Date('2024-03-09'),
    networkId: 'bridge'
  }
];

interface UseVolumeManagementReturn {
  volumes: Volume[];
  selectedVolume: Volume | null;
  newVolumeId: string | null;
  setVolumes: React.Dispatch<React.SetStateAction<Volume[]>>;
  setSelectedVolume: React.Dispatch<React.SetStateAction<Volume | null>>;
  setNewVolumeId: React.Dispatch<React.SetStateAction<string | null>>;
  createVolume: (name: string, mountPath?: string, networkId?: string) => Volume;
  removeVolume: (volumeId: string) => void;
  handleVolumeClick: (volume: Volume) => void;
}

export const useVolumeManagement = (): UseVolumeManagementReturn => {
  // 더미 데이터로 초기화
  const [volumes, setVolumes] = useState<Volume[]>(DUMMY_VOLUMES);
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null);
  const [newVolumeId, setNewVolumeId] = useState<string | null>(null);

  const createVolume = useCallback((name: string, mountPath: string = '/data', networkId?: string): Volume => {
    // 이미 존재하는지 확인
    const existingVolume = volumes.find(v => v.name === name);
    if (existingVolume) {
      return existingVolume;
    }

    const newVolume: Volume = {
      id: `vol_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: name,
      mountPath: mountPath,
      createdAt: new Date(),
      networkId: networkId || 'bridge'
    };

    setVolumes(prev => [...prev, newVolume]);
    setNewVolumeId(newVolume.id);

    return newVolume;
  }, [volumes]);

  const removeVolume = useCallback((volumeId: string) => {
    setVolumes(prev => prev.filter(v => v.id !== volumeId));
    if (selectedVolume?.id === volumeId) {
      setSelectedVolume(null);
    }
  }, [selectedVolume]);

  const handleVolumeClick = useCallback((volume: Volume) => {
    if (volume.id) {
      setSelectedVolume(volume);
    } else {
      setSelectedVolume(null);
    }
  }, []);

  return {
    volumes,
    selectedVolume,
    newVolumeId,
    setVolumes,
    setSelectedVolume,
    setNewVolumeId,
    createVolume,
    removeVolume,
    handleVolumeClick
  };
}; 