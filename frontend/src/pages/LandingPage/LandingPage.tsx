import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    window.location.href = '/dashboard';
  }, []);
  return <></>;
}
