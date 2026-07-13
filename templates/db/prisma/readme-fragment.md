Prisma models `User`, `Session`, `Account`, `Verification` match the Better Auth
adapter exactly. One addition: `User.role` (`enum Role { user, admin }`, default
`user`), wired via Better Auth `user.additionalFields.role` with `input: false`
so clients can't self-assign a role. **No UI reads `role` yet** — it is RBAC
groundwork for later.
