emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url }) => {
    // eslint-disable-next-line no-console
    console.log('[auth] sendResetPassword triggered for', user.email);
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      html: `<a href="${url}">Click here to reset your password</a>`,
    });
  },
},
emailVerification: {
  sendVerificationEmail: async ({ user, url }) => {
    // eslint-disable-next-line no-console
    console.log('[auth] sendVerificationEmail triggered for', user.email);
    await sendEmail({
      to: user.email,
      subject: 'Verify your email address',
      html: `<a href="${url}">Click here to verify your email</a>`,
    });
  },
  // The admin seed sets this internal flag because it verifies the account itself.
  sendOnSignUp: process.env.BETTERNEST_ADMIN_SEED !== 'true',
},
