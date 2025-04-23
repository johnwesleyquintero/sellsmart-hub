'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GithubIcon, LinkedinIcon } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function SignIn() {
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
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          >
            <GithubIcon className="w-5 h-5" />
            Continue with GitHub
          </Button>

          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={async () => {
              try {
                await signIn('linkedin', { callbackUrl: '/dashboard' });
              } catch {
                alert(
                  'LinkedIn authentication is currently unavailable. Please check back soon or use another login method.',
                );
              }
            }}
            variant="outline"
          >
            <LinkedinIcon className="w-5 h-5" />
            Continue with LinkedIn
          </Button>
        </div>

        <p className="text-sm text-center text-gray-500">
          Amazon tools remain accessible without login
        </p>
      </Card>
    </div>
  );
}
