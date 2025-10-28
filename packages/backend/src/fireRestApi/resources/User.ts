import type { TernSecureUserData } from '@tern-secure/types';

import type { UserJson } from './JSON';

export class User {
  constructor(readonly data: TernSecureUserData) {}

  static fromJSON(data: UserJson): User {
    const res = new User({
      localId: data.localId,
      email: data.email,
      emailVerified: data.emailVerified,
      displayName: data.displayName,
      photoUrl: data.photoUrl,
      providerUserInfo: data.providerUserInfo || [],
      disabled: data.disabled,
      lastLoginAt: data.lastLoginAt,
      createdAt: data.createdAt,
      validSince: data.validSince,
      customAuth: data.customAuth,
    });
    return res;
  }
}
