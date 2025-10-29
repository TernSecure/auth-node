'use client';

import { useAuth } from '@tern-secure-node/nextjs';
import { useRouter } from 'next/navigation';

/**
 * Home page component
 * in SSR, use sessionClaims as user object is undefined. in client side use User
 * in case loading spinner is needed, use !user or !isLoaded to show loading until user is defined. other a blank page will be returned.
 * NB: TernSecureAuth class instance await for authstate to be ready in the onAuthStateChanged Listener before emit user event
 * isValid will check if userId is defined.
 */

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const { user, userId, isLoaded, isAuthenticated, isValid, sessionClaims } = auth;
  // on server userObject is undefined, if we dont check !user, there will hydration error
  //if (!user) return <div>Loading...</div>;
  if (!userId) return <div>Loading...</div>;  //for ssr, better to use userId check

  if (!isLoaded) return <div>Loading...</div>;

  if (!isAuthenticated) return <div>User is not valid. Please sign in.</div>;


  const redirectToMoPage = () => {
    router.push('/mo');
  };

  const redirectToDashboard = () => {
    router.push('/dashboard');
  };

  const redirectToProtected = () => {
    router.push('/protected');
  };



  return (
    <div>
      <h1> is user signedIn? {isAuthenticated ? 'Yes' : 'No'}</h1>
      <h1> isLoaded? {isLoaded ? 'Yes' : 'No'}</h1>
      <h1> is user valid? {isValid ? 'Yes' : 'No'}</h1>
      <h1>Welcome, {user?.displayName || user?.email || sessionClaims?.email}</h1>
      <button onClick={redirectToMoPage}>Visit Mo Page</button>

      <button
        onClick={redirectToDashboard}
        className='ml-4 rounded bg-blue-500 px-4 py-2 text-white'
      >
        Dashboard
      </button>
      <button
        onClick={redirectToProtected}
        className='ml-4 rounded bg-blue-500 px-4 py-2 text-white'
      >
        Server Side Page
      </button>
    </div>
  );
}
