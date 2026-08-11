'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminReleaseDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/admin/releases/${id}/edit`);
    }
  }, [id, router]);

  return (
    <div className="py-12 text-center font-mono text-xs text-[#888888]">
      REDIRECTING TO RELEASE EDITOR...
    </div>
  );
}
