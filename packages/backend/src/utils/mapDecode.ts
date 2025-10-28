import type { DecodedIdToken } from "@tern-secure/types";
import type {
  JWTPayload,
} from "jose";

export function mapJwtPayloadToDecodedIdToken(payload: JWTPayload) {
  const decodedIdToken = payload as DecodedIdToken;
  decodedIdToken.uid = decodedIdToken.sub;
  return decodedIdToken;
}