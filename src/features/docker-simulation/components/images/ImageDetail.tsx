import React, { useState } from 'react';
import { useDockerStore } from '../../../../store/dockerStore';
import type { LocalImage } from '../../../../store/dockerStore';
import styles from './ImageDetail.module.css';
import detailStyles from '../DockerMasterDetail.module.css';
import { useToast } from '../../../../hooks/useToast';

export function ImageDetail() {
  const selectedImage = useDockerStore(state => state.selectedImage);
  const pullImage = useDockerStore(state => state.pullImage);
  const viewMode = useDockerStore(state => state.viewMode);
  const isLoading = useDockerStore(state => state.isLoading);
  const error = useDockerStore(state => state.error);
  const { toasts, removeToast, showSuccessToast, showErrorToast } = useToast();
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  // 선택된 이미지가 없으면 안내 메시지 표시
  if (!selectedImage) {
    return (
      <div className={`${styles.container} ${detailStyles.imageDetailContainer}`}>
        <div className={styles.emptyState}>
          <p>이미지를 선택하세요</p>
        </div>
      </div>
    );
  }

  // 선택된 이미지가 로컬 이미지인지 확인
  const isLocalImage = 'status' in selectedImage;
  const status = isLocalImage ? (selectedImage as LocalImage).status : null;

  // Docker 명령어 생성
  const pullCommand = `docker pull ${selectedImage.repo}:${selectedImage.tag}`;
  const runCommand = `docker run -d --name my-${selectedImage.repo} ${selectedImage.repo}:${selectedImage.tag}`;

  const handleCopyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      showSuccessToast('명령어가 클립보드에 복사되었습니다');
    } catch (err) {
      showErrorToast('클립보드 복사에 실패했습니다');
    }
  };

  const handlePullImage = async () => {
    if (!selectedImage) return;
    
    setIsPulling(true);
    setPullProgress(0);
    
    try {
      // 진행률 시뮬레이션
      const interval = setInterval(() => {
        setPullProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 500);
      
      await pullImage(selectedImage.repo, selectedImage.tag);
      
      clearInterval(interval);
      setPullProgress(100);
      showSuccessToast('이미지 다운로드가 완료되었습니다');
      
      setTimeout(() => {
        setIsPulling(false);
        setPullProgress(0);
      }, 1000);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : '이미지 다운로드에 실패했습니다');
      setIsPulling(false);
      setPullProgress(0);
    }
  };

  return (
    <div className={`${styles.container} ${detailStyles.imageDetailContainer}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{selectedImage.repo}:{selectedImage.tag}</h2>
        {isLocalImage && (
          <div className={styles.statusBadge} data-status={status}>
            {status === 'pulled' ? '다운로드 완료' : '다운로드 필요'}
          </div>
        )}
      </div>

      <div className={styles.infoSection}>
        <div className={styles.infoItem}>
          <span className={styles.label}>크기</span>
          <span className={styles.value}>{selectedImage.size || '알 수 없음'}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>생성일</span>
          <span className={styles.value}>{selectedImage.created || '알 수 없음'}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>레이어</span>
          <span className={styles.value}>{selectedImage.layers || 0}개</span>
        </div>
        {selectedImage.digest && (
          <div className={styles.infoItem}>
            <span className={styles.label}>Digest</span>
            <span className={styles.value}>{selectedImage.digest}</span>
          </div>
        )}
      </div>

      <div className={styles.commandSection}>
        <h3 className={styles.sectionTitle}>명령어</h3>
        
        <div className={styles.commandItem}>
          <code className={styles.command}>{pullCommand}</code>
          <button 
            className={styles.copyButton} 
            onClick={() => handleCopyCommand(pullCommand)}
            aria-label="복사"
          >
            복사
          </button>
        </div>
        
        <div className={styles.commandItem}>
          <code className={styles.command}>{runCommand}</code>
          <button 
            className={styles.copyButton} 
            onClick={() => handleCopyCommand(runCommand)}
            aria-label="복사"
          >
            복사
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        {isPulling ? (
          <div className={styles.pullProgress}>
            <div 
              className={styles.progressBar}
              style={{ width: `${pullProgress}%` }}
            />
            <span className={styles.progressText}>
              {Math.round(pullProgress)}%
            </span>
          </div>
        ) : (
          <>
            {isLocalImage && status === 'missing' && (
              <button 
                className={styles.pullButton} 
                onClick={handlePullImage}
                disabled={isLoading}
              >
                {isLoading ? '다운로드 중...' : '이미지 다운로드'}
              </button>
            )}
            {(!isLocalImage || (isLocalImage && status === 'pulled')) && (
              <>
                <button className={styles.createButton}>
                  컨테이너 생성
                </button>
                <button className={styles.runButton}>
                  컨테이너 실행
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Toast는 전역에서 관리됨 */}
    </div>
  );
} 