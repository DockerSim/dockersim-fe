import React, { useState } from 'react'
import Modal from '@/components/common/Modal'

interface LevelModalProps {
  show: boolean
  onClose: () => void
  onSelect: (level: number, step: number) => void
}

const LevelModal: React.FC<LevelModalProps> = ({ show, onClose, onSelect }) => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  if (!show) return null

  const levels = [
    {
      level: 1,
      title: '초급',
      description: 'Docker의 기본 개념과 명령어를 학습합니다.',
      steps: [
        '컨테이너 생성 및 실행',
        '이미지 관리'
      ]
    },
    {
      level: 2,
      title: '중급',
      description: '볼륨, 네트워크, 포트 매핑을 학습합니다.',
      steps: [
        '볼륨 마운트',
        '네트워크 연결',
        '포트 매핑'
      ]
    },
    {
      level: 3,
      title: '고급',
      description: 'Docker Compose와 멀티 컨테이너 애플리케이션을 학습합니다.',
      steps: [
        'Docker Compose 기초',
        '멀티 컨테이너 구성',
        '컨테이너 오케스트레이션'
      ]
    }
  ]

  return (
    <Modal title="Docker 학습 레벨 선택" onClose={onClose}>
      <div className="row g-4">
        {levels.map((level) => (
          <div key={level.level} className="col-12">
            <div 
              className={`card ${selectedLevel === level.level ? 'border-primary' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedLevel(level.level)}
            >
              <div className="card-body">
                <h5 className="card-title d-flex justify-content-between">
                  <span>{level.title}</span>
                  <span className="badge bg-primary">Level {level.level}</span>
                </h5>
                <p className="card-text text-muted">{level.description}</p>
                
                {selectedLevel === level.level && (
                  <div className="mt-3">
                    <h6 className="mb-3">학습 단계</h6>
                    <div className="list-group">
                      {level.steps.map((step, index) => (
                        <button
                          key={index}
                          className="list-group-item list-group-item-action"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelect(level.level, index + 1)
                            onClose()
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Step {index + 1}: {step}</span>
                            <i className="bi bi-arrow-right"></i>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default LevelModal 