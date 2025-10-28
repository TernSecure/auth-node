'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSignUp, useTernSecure, useSignUpContext } from '@tern-secure/nextjs';
import type { SignUpResponse } from '@tern-secure/nextjs';

export function SignupForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp } = useSignUp();
  const { createActiveSession } = useTernSecure();
  const ctx = useSignUpContext();
  const { afterSignUpUrl } = ctx;
  const [formError, setFormError] = useState<SignUpResponse | null>(null);

  const signUpWithPassword = async () => {
    const res = await signUp?.withEmailAndPassword({ email, password });
    if (res?.status === 'error') {
      setFormError({
        status: 'error',
        message: res.message,
        error: res.error,
      });
    }

    if (res?.status === 'complete') {
      createActiveSession({ session: res.user, redirectUrl: afterSignUpUrl });
    }
  };

  const handleSignUpWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    signUpWithPassword();
  };

  return (
    <div
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>Create your account</CardTitle>
          <CardDescription>Enter your email below to create your account</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {formError && (
            <Alert
              variant='destructive'
              className='animate-in fade-in-50'
            >
              <AlertDescription>{formError.message}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSignUpWithPassword}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder='m@example.com'
                  required
                />
              </Field>
              <Field>
                <Field className='grid grid-cols-2 gap-4'>
                  <Field>
                    <FieldLabel htmlFor='password'>Password</FieldLabel>
                    <Input
                      id='password'
                      type='password'
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='confirm-password'>Confirm Password</FieldLabel>
                    <Input
                      id='confirm-password'
                      type='password'
                      required
                    />
                  </Field>
                </Field>
                <FieldDescription>Must be at least 8 characters long.</FieldDescription>
              </Field>
              <Field>
                <Button type='submit'>Create Account</Button>
                <FieldDescription className='text-center'>
                  Already have an account? <a href='./sign-in'>Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className='px-6 text-center'>
        By clicking continue, you agree to our <a href='#'>Terms of Service</a> and{' '}
        <a href='#'>Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
