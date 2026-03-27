import { breeds } from '../dogs/breeds.js';
import Dog from './Dog.jsx';

export default function DogLayer({ level }) {
  const breedIndex = Math.max(0, level - 1) % 5;
  const breed = breeds[breedIndex];

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {/* breedIndex in key forces remount (new positions + new breed) on level milestone */}
      <Dog key={`dog-0-${breedIndex}`} breed={breed} index={0} />
      <Dog key={`dog-1-${breedIndex}`} breed={breed} index={1} />
      <Dog key={`dog-2-${breedIndex}`} breed={breed} index={2} />
    </div>
  );
}
