import { useEffect } from 'react';
import { router } from 'expo-router';

// The scan tab immediately opens the camera modal
export default function ScanTab() {
  useEffect(() => {
    router.push('/camera');
  }, []);

  return null;
}
