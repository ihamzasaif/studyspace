# Security Specification & Threat Model

## 1. Data Invariants
1. **Strict Ownership Invariant**: A user document at `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
2. **Sub-collection Isolation Invariant**: All study data under `/users/{userId}/studyData/{dataId}` strictly inherits ownership from the parent path `{userId}` where `request.auth.uid == userId`.
3. **Identity Spoofing Guard**: Incoming payload `userId` field must match `request.auth.uid`. A user cannot forge data under another user's account ID.
4. **Denial-of-Wallet Guard**: Document IDs must conform to `isValidId()` (<= 128 characters, alphanumeric/dash/underscore). String fields must be size-bounded.
5. **No Blanket Reads**: No global query scraping. Documents are strictly scoped to the owner UID.
6. **Default-Deny Invariant**: All undefined collections and operations are blocked by default catch-all rule `match /{document=**} { allow read, write: if false; }`.

## 2. The Dirty Dozen Payloads (Security Test Cases)
1. **Unauthenticated Read**: Anonymous/unauthenticated request attempting `get` on `/users/user_123` -> EXPECT: PERMISSION_DENIED.
2. **Unauthenticated Write**: Anonymous request attempting `set` on `/users/user_123` -> EXPECT: PERMISSION_DENIED.
3. **Cross-User Snooping**: Authenticated `user_A` attempting to `get` `/users/user_B` -> EXPECT: PERMISSION_DENIED.
4. **Cross-User Data Write**: Authenticated `user_A` attempting to write `/users/user_B/studyData/current` -> EXPECT: PERMISSION_DENIED.
5. **ID Spoofing in Payload**: Authenticated `user_A` writing to `/users/user_A/studyData/current` with payload `{"userId": "user_B"}` -> EXPECT: PERMISSION_DENIED.
6. **ID Poisoning Attack**: Attempting document write with 2000-character junk ID string -> EXPECT: PERMISSION_DENIED.
7. **Collection Traversal / Wildcard List**: Attempting to query the entire `/users` collection with `getDocs()` without owner filtering -> EXPECT: PERMISSION_DENIED.
8. **Subcollection Hijack**: User `user_A` attempting to list `/users/user_B/studyData` -> EXPECT: PERMISSION_DENIED.
9. **Ghost Field Injection**: Adding administrative or unauthorized root-level fields `isAdmin: true` -> EXPECT: PERMISSION_DENIED.
10. **Corrupted Data Type**: Writing integer value for `userId` string -> EXPECT: PERMISSION_DENIED.
11. **Orphaned Write**: Creating studyData document under a non-existent or foreign user ID -> EXPECT: PERMISSION_DENIED.
12. **Malformed Document ID with Special Characters**: Using SQL/command injection strings in path parameter (e.g., `user_A/studyData/../..`) -> EXPECT: PERMISSION_DENIED.
