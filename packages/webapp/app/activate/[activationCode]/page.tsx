import { ActivatePodcast } from '@/components/ActivatePodcast';

export default function Page({ params } : { params: { activationCode: string } }) {
  return <ActivatePodcast activationCode={params.activationCode} />;
}
