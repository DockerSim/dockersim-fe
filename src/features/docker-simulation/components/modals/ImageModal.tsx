import React from 'react';
import { Image, ModalProps } from '../../types';
import styles from '../terminal/Terminal.module.css';

interface ImageModalProps extends ModalProps {
  images: Image[];
}

export const ImageModal: React.FC<ImageModalProps> = ({ onClose, images }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chromeModal} onClick={e => e.stopPropagation()}>
        <div className={styles.chromeHeader}>
          <div className={styles.tabSection}>
            <div className={styles.activeTab}>
              <span className={styles.tabIcon}>🖼️</span>
              이미지 목록
            </div>
          </div>
          <button className={styles.chromeClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.imagesList}>
            {images.length === 0 ? (
              <div className={styles.emptyState}>
                <p>다운로드한 이미지가 없습니다.</p>
                <p className={styles.helperText}>Docker Pull 명령어를 사용하여 이미지를 다운로드하세요.</p>
                <code className={styles.commandExample}>docker pull nginx:latest</code>
              </div>
            ) : (
              <table className={styles.imagesTable}>
                <thead>
                  <tr>
                    <th>이미지명</th>
                    <th>태그</th>
                    <th>크기</th>
                    <th>생성일</th>
                    <th>타입</th>
                  </tr>
                </thead>
                <tbody>
                  {images.map(image => (
                    <tr key={image.id}>
                      <td>{image.name}</td>
                      <td>{image.tag}</td>
                      <td>{image.size}</td>
                      <td>{image.created.toLocaleDateString()}</td>
                      <td>
                        {image.isOfficial ? (
                          <span className={styles.officialBadge}>공식</span>
                        ) : (
                          <span className={styles.communityBadge}>커뮤니티</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 