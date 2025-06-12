import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

export function ImageCard({ image, isPulling, progress, onPull }: {
  image: { repo: string; tag: string; status: 'pulled' | 'missing' },
  isPulling: boolean,
  progress: number,
  onPull: () => void
}) {
  return (
    <div style={{ border: '1px solid #ccc', margin: 4, padding: 8, display: 'flex', alignItems: 'center' }}>
      <span>{image.repo}:{image.tag}</span>
      {image.status === 'pulled' ? (
        <span style={{ color: 'green', marginLeft: 8 }}>●</span>
      ) : (
        <Tippy content={isPulling ? `Pulling... ${progress}%` : '이미지 풀'}>
          <span
            style={{ marginLeft: 8, cursor: isPulling ? 'not-allowed' : 'pointer' }}
            onClick={() => !isPulling && onPull()}
          >
            ☁️
          </span>
        </Tippy>
      )}
      {isPulling && (
        <Tippy content={`진행률: ${progress}%`}>
          <div style={{
            marginLeft: 8, width: 60, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`, height: '100%', background: '#4caf50', transition: 'width 0.3s'
            }} />
          </div>
        </Tippy>
      )}
    </div>
  );
} 