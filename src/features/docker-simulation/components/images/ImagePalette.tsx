import { useDockerStore } from '@/store/dockerStore';
import { ImageCard } from './ImageCard';
import type { LocalImage, ImageInfo } from '@/store/dockerStore';

export function ImagePalette() {
  const localImages = useDockerStore(s => s.localImages);
  const remoteResults = useDockerStore(s => s.remoteResults);
  const isLoading = useDockerStore(s => s.isLoading);
  const pullImage = useDockerStore(s => s.pullImage);

  const paletteImages = [
    ...localImages,
    ...remoteResults
      .filter((r: ImageInfo) => !localImages.some((l: LocalImage) => l.repo === r.repo && l.tag === r.tag))
      .map((r: ImageInfo) => ({ ...r, status: 'missing' as const })),
  ];

  return (
    <div>
      {paletteImages.map(img => (
        <ImageCard
          key={img.repo + ':' + img.tag}
          image={img}
          isPulling={isLoading}
          progress={0}
          onPull={() => pullImage(img.repo, img.tag)}
        />
      ))}
    </div>
  );
} 