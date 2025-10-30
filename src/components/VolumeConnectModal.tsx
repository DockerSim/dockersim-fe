import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Container, Volume } from '../store/dockerStore';

interface VolumeConnectModalProps {
  containers: Container[];
  volumes: Volume[];
  open: boolean;
  onConnect: (volumeId: string, containerId: string, mountPath: string) => void;
  onClose: () => void;
}

const VolumeConnectModal: React.FC<VolumeConnectModalProps> = ({ containers, volumes, open, onConnect, onClose }) => {
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>('');
  const [selectedContainerId, setSelectedContainerId] = useState<string>('');
  const [mountPath, setMountPath] = useState<string>('/data'); // 기본 경로 설정

  // 모달이 열릴 때 상태 초기화
  useEffect(() => {
    if (open) {
      setSelectedVolumeId('');
      setSelectedContainerId('');
      setMountPath('/data');
    }
  }, [open]);

  if (!open) return null;

  const handleConnect = () => {
    if (selectedVolumeId && selectedContainerId && mountPath) {
      onConnect(selectedVolumeId, selectedContainerId, mountPath);
    }
  };

  // 연결 가능한 볼륨 (아직 어떤 컨테이너에도 연결되지 않은 볼륨)만 필터링
  const availableVolumes = volumes.filter(v => !v.connectedContainers || v.connectedContainers.length === 0);

  return createPortal(
    <div className="modal-backdrop" style={{ position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.3)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="modal-content" style={{ background:'#fff', borderRadius:12, padding:32, minWidth:340, boxShadow:'0 4px 24px rgba(0,0,0,0.15)' }}>
        <h2 style={{ fontSize:20, fontWeight:700, marginBottom:24 }}>볼륨 연결</h2>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontWeight:600, display:'block', marginBottom:8 }}>볼륨 선택</label>
          <select value={selectedVolumeId} onChange={e => setSelectedVolumeId(e.target.value)} style={{ width:'100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">연결할 볼륨을 선택하세요</option>
            {availableVolumes.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontWeight:600, display:'block', marginBottom:8 }}>컨테이너 선택</label>
          <select value={selectedContainerId} onChange={e => setSelectedContainerId(e.target.value)} style={{ width:'100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">연결될 컨테이너를 선택하세요</option>
            {containers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={{ fontWeight:600, display:'block', marginBottom:8 }}>컨테이너 내 마운트 경로</label>
          <input type="text" value={mountPath} onChange={e => setMountPath(e.target.value)} placeholder="예: /app/data" style={{ width:'100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:6, background:'#eee', border:'none', fontWeight:600, cursor:'pointer' }}>취소</button>
          <button onClick={handleConnect} disabled={!selectedVolumeId || !selectedContainerId || !mountPath} style={{ padding:'10px 20px', borderRadius:6, background:'#2563eb', color:'#fff', border:'none', fontWeight:600, cursor:'pointer', opacity: (!selectedVolumeId || !selectedContainerId || !mountPath) ? 0.5 : 1 }}>연결</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VolumeConnectModal;