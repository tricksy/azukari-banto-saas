import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ReceptionWizard } from '@/components/reception/ReceptionWizard';

async function ReceptionContent() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <ReceptionWizard workerId={session.workerId} />
      </div>
    </div>
  );
}

export default function ReceptionPage() {
  return (
    <Suspense fallback={
      <div className="p-4">
        <div className="h-8 bg-shironeri animate-pulse mb-6" />
        <div className="h-64 bg-shironeri animate-pulse" />
      </div>
    }>
      <ReceptionContent />
    </Suspense>
  );
}
