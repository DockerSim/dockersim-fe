'use client'

import React, { useState } from 'react'
import '../../styles/FAQ.css'

interface FAQItem {
  id: number
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: 'Docker 시뮬레이터는 무엇인가요?',
    answer: 'Docker 시뮬레이터는 실제 Docker 환경을 시뮬레이션하여 안전하게 Docker 명령어를 학습할 수 있는 웹 기반 도구입니다. 실제 시스템에 영향을 주지 않으면서 Docker의 기본 개념과 명령어를 익힐 수 있습니다.',
    category: 'basic'
  },
  {
    id: 2,
    question: '시뮬레이터에서 실제 Docker 명령어를 사용할 수 있나요?',
    answer: '네, 시뮬레이터는 주요 Docker 명령어들을 지원합니다. docker run, docker ps, docker stop, docker volume create, docker network create 등의 명령어를 사용할 수 있습니다.',
    category: 'usage'
  },
  {
    id: 3,
    question: '컨테이너와 볼륨을 어떻게 연결하나요?',
    answer: 'docker run 명령어에 -v 옵션을 사용하여 볼륨을 연결할 수 있습니다. 예: docker run -v my-volume:/app/data nginx:latest',
    category: 'usage'
  },
  {
    id: 4,
    question: '네트워크 탭에서 컨테이너가 보이지 않아요.',
    answer: '컨테이너는 생성될 때 기본적으로 bridge 네트워크에 연결됩니다. 다른 네트워크에 연결하려면 docker run 명령어에 --network 옵션을 사용하세요.',
    category: 'troubleshooting'
  },
  {
    id: 5,
    question: '터미널에서 명령어 입력이 안 됩니다.',
    answer: '터미널 입력창을 클릭하여 포커스를 맞춘 후 명령어를 입력하세요. 위/아래 화살표 키로 이전 명령어 히스토리를 확인할 수 있습니다.',
    category: 'troubleshooting'
  },
  {
    id: 6,
    question: '시뮬레이터 데이터가 저장되나요?',
    answer: '현재 시뮬레이터는 브라우저 세션 기반으로 동작하므로 페이지를 새로고침하면 데이터가 초기화됩니다. 실제 Docker 환경과 달리 데이터는 영구적으로 저장되지 않습니다.',
    category: 'basic'
  },
  {
    id: 7,
    question: '컨테이너 시작/중지는 어떻게 하나요?',
    answer: '리소스 제어 패널에서 각 컨테이너의 시작/중지 버튼을 클릭하거나, 터미널에서 docker start/stop 명령어를 사용할 수 있습니다.',
    category: 'usage'
  },
  {
    id: 8,
    question: '볼륨 마운트 경로를 확인하려면?',
    answer: '리소스 제어 패널의 볼륨 섹션에서 각 볼륨의 마운트 경로를 확인할 수 있습니다. 또한 볼륨을 클릭하면 자세한 정보를 볼 수 있습니다.',
    category: 'usage'
  }
]

const categories = [
  { id: 'all', name: '전체' },
  { id: 'basic', name: '기본 개념' },
  { id: 'usage', name: '사용 방법' },
  { id: 'troubleshooting', name: '문제 해결' }
]

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const filteredFAQs = faqData.filter(faq => {
    const categoryMatch = selectedCategory === 'all' || faq.category === selectedCategory
    const searchMatch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    
    return categoryMatch && searchMatch
  })

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id)
  }

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1 className="faq-title">자주 묻는 질문</h1>
        <p className="faq-subtitle">
          Docker 시뮬레이터 사용 중 궁금한 점을 해결해보세요
        </p>
      </div>

      <div className="faq-controls">
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="FAQ 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="faq-list">
        {filteredFAQs.length === 0 ? (
          <div className="empty-state">
            <p>검색 결과가 없습니다.</p>
            <p>다른 키워드로 검색해보세요.</p>
          </div>
        ) : (
          filteredFAQs.map(faq => (
            <div key={faq.id} className="faq-item">
              <button
                className={`faq-question ${openFAQ === faq.id ? 'open' : ''}`}
                onClick={() => toggleFAQ(faq.id)}
              >
                <span className="question-text">{faq.question}</span>
                <span className="toggle-icon">
                  {openFAQ === faq.id ? '−' : '+'}
                </span>
              </button>
              
              {openFAQ === faq.id && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 