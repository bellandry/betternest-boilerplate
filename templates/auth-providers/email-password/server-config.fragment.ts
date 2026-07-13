emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url }) => {
    // eslint-disable-next-line no-console
    console.log('[auth] sendResetPassword triggered for', user.email);
    await sendEmail({
      to: user.email,
      subject: 'Réinitialise ton mot de passe',
      html: `<a href="${url}">Cliquer ici pour réinitialiser ton mot de passe</a>`,
    });
  },
},
emailVerification: {
  sendVerificationEmail: async ({ user, url }) => {
    // eslint-disable-next-line no-console
    console.log('[auth] sendVerificationEmail triggered for', user.email);
    await sendEmail({
      to: user.email,
      subject: 'Vérifie ton adresse email',
      html: `<a href="${url}">Cliquer ici pour vérifier ton email</a>`,
    });
  },
  sendOnSignUp: true,
},
