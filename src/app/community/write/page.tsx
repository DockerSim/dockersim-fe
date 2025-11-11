'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import '../../../styles/CommunityWrite.css'
import { communityApi } from '@/api/community'; // communityApi 임포트
import { PostType } from '@/app/community/page'; // PostType 임포트

export default function CommunityWritePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'QUESTION' as PostType,
    tags: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    const postData = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      tags: formData.tags.split('#').map(tag => tag.trim()).filter(Boolean).join(','),
    };

    try {
      const result = await communityApi.createPost(postData); // communityApi.createPost 호출

      if (result.code === 'SUCCESS') {
        alert('게시글이 성공적으로 작성되었습니다!')
        router.push('/community')
      } else {
        throw new Error(result.message || '게시글 작성에 실패했습니다.');
      }

    } catch (error) {
      console.error('Post creation failed:', error);
      alert(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCancel = () => {
    if (confirm('작성을 취소하시겠습니까? 입력한 내용은 저장되지 않습니다.')) {
      router.push('/community')
    }
  }

  return (
    <div className="write-container">
      <div className="write-header">
        <h1 className="write-title">새 게시글 작성</h1>
        <p className="write-subtitle">Docker 시뮬레이터와 관련된 질문이나 경험을 공유해보세요</p>
      </div>

      <form onSubmit={handleSubmit} className="write-form">
        <div className="form-group">
          <label htmlFor="type">카테고리</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="form-select"
          >
            <option value="QUESTION">질문</option>
            <option value="SIMULATION">시뮬레이션</option>
            <option value="TECHNICAL">기술</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="title">제목 <span className="required">*</span></label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            placeholder="게시글 제목을 입력하세요"
            maxLength={100}
          />
          <div className="char-count">
            {formData.title.length}/100
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="content">내용 <span className="required">*</span></label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="form-textarea"
            placeholder="게시글 내용을 입력하세요"
            rows={15}
            maxLength={5000}
          />
          <div className="char-count">
            {formData.content.length}/5000
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tags">태그</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="form-input"
            placeholder="태그를 #으로 구분하여 입력하세요 (예: docker#ci/cd#쿠버네티스)"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="btn-cancel">
            취소
          </button>
          <button type="submit" className="btn-submit">
            게시글 작성
          </button>
        </div>
      </form>
    </div>
  )
}
