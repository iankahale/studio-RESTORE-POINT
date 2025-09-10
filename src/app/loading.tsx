import { AnimatedLogo } from '@/components/animated-logo';

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <AnimatedLogo />
    </div>
  );
}
