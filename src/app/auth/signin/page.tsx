'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Github } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function SignIn() {
  const handleGitHubSignIn = () => {
    signIn('github', { callbackUrl: '/' });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <p className="text-center text-gray-600">
          Access your personal dashboard and tools
        </p>

        <div className="space-y-4">
          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGitHubSignIn}
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </Button>
        </div>

        <p className="text-sm text-center text-gray-500">
          Amazon tools remain accessible without login
        </p>
      </Card>
    </div>
  );
}
