'use client';

import React, { useState } from 'react';
import styles from './UploadBar.module.css';

const UploadBar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      // TODO: 실제 업로드 로직 구현
      console.log('Uploading file:', selectedFile.name);
    }
  };

  return (
    <div className={`${styles.uploadBar} ${isExpanded ? styles.expanded : ''}`}>
      <button 
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg 
          viewBox="0 0 24 24" 
          width="24" 
          height="24"
          className={styles.toggleIcon}
        >
          <path 
            fill="currentColor" 
            d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"
          />
        </svg>
        도커 이미지 업로드
      </button>
      <div className={styles.uploadContent}>
        <div className={styles.uploadSection}>
          <input
            type="file"
            id="dockerFile"
            className={styles.fileInput}
            onChange={handleFileChange}
            accept=".tar,.gz,.zip"
          />
          <label htmlFor="dockerFile" className={styles.fileLabel}>
            {selectedFile ? selectedFile.name : 'Dockerfile 또는 이미지 파일 선택'}
          </label>
          <button 
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            업로드
          </button>
        </div>
        <div className={styles.uploadInfo}>
          <p>지원 형식: .tar, .gz, .zip</p>
          <p>최대 크기: 500MB</p>
        </div>
      </div>
    </div>
  );
};

export default UploadBar; 