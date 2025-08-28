'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import '../../../../styles/CommunityWrite.css';

type PostType = 'QUESTION' | 'SIMULATION' | 'TECHNICAL';

interface PostFormData {
  title: string;
  content: string;
  type: PostType;
  tags: string;
}

export default function CommunityEditPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    type: 'QUESTION',
    tags: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        throw new Error('게시글 정보를 불러오는데 실패했습니다.');
      }
      const result = await response.json();
      const postData = result.data;
      setFormData({
        title: postData.title,
        content: postData.content,
        type: postData.type,
        tags: postData.tags.split(',').map((t: string) => `#${t.trim()}`).join(' '),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류 발생');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용은 필수입니다.');
      return;
    }

    const postData = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      tags: formData.tags.split('#').map(tag => tag.trim()).filter(Boolean).join(','),
    };

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('게시글 수정에 실패했습니다.');
      }
      alert('게시글이 성공적으로 수정되었습니다!');
      router.push(`/community/${postId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    if (confirm('수정을 취소하시겠습니까? 변경사항이 저장되지 않습니다.')) {
      router.back();
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="write-container">
      <div className="write-header">
        <h1 className="write-title">게시글 수정</h1>
      </div>
      <form onSubmit={handleSubmit} className="write-form">
        <div className="form-group">
          <label htmlFor="type">카테고리</label>
          <select id="type" name="type" value={formData.type} onChange={handleChange} className="form-select">
            <option value="QUESTION">질문</option>
            <option value="SIMULATION">시뮬레이션</option>
            <option value="TECHNICAL">기술</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="title">제목 <span className="required">*</span></label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="form-input" maxLength={100} />
          <div className="char-count">{formData.title.length}/100</div>
        </div>
        <div className="form-group">
          <label htmlFor="content">내용 <span className="required">*</span></label>
          <textarea id="content" name="content" value={formData.content} onChange={handleChange} className="form-textarea" rows={15} maxLength={5000} />
          <div className="char-count">{formData.content.length}/5000</div>
        </div>
        <div className="form-group">
          <label htmlFor="tags">태그</label>
          <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} className="form-input" placeholder="태그를 #으로 구분하여 입력하세요" />
        </div>
        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="btn-cancel">취소</button>
          <button type="submit" className="btn-submit">수정 완료</button>
        </div>
      </form>
    </div>
  );
}