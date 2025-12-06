import SmartManager from '@/components/SmartManager';

export const dynamic = 'force-dynamic';

export default function Home() {
  const defaultUrl = process.env.DISPATCHARR_URL;
  const defaultUser = process.env.DISPATCHARR_USER;
  const defaultPassword = process.env.DISPATCHARR_PASSWORD;

  return (
    <SmartManager
      defaultUrl={defaultUrl}
      defaultUser={defaultUser}
      defaultPassword={defaultPassword}
    />
  );
}
