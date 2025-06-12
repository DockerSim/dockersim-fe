import { useDockerStore } from '../store/dockerStore';
import { ImageCard } from './ImageCard';
import type { LocalImage, RemoteResult } from '../store/dockerStore';

export function ImagePalette() {
  const localImages = useDockerStore<LocalImage[]>(s => s.localImages);
  const remoteResults = useDockerStore<RemoteResult[]>(s => s.remoteResults);
  const isPulling = useDockerStore<Record<string, boolean>>(s => s.isPulling);
  const progress = useDockerStore<Record<string, number>>(s => s.progress);
  const pullImage = useDockerStore(s => s.pullImage);

  const paletteImages = [
    ...localImages,
    ...remoteResults
      .filter((r: RemoteResult) => !localImages.some((l: LocalImage) => l.repo === r.repo && l.tag === r.tag))
      .map((r: RemoteResult) => ({ ...r, status: 'missing' as const })),
  ];

  return (
    <div>
      {paletteImages.map(img => (
        <ImageCard
          key={img.repo + ':' + img.tag}
          image={img}
          isPulling={!!isPulling[`${img.repo}:${img.tag}`]}
          progress={progress[`${img.repo}:${img.tag}`] || 0}
          onPull={() => pullImage(img.repo, img.tag)}
        />
      ))}
    </div>
  );
} 