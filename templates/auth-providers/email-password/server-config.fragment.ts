emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url }) => {
    await sendEmail({
      to: user.email,
      subject: 'Réinitialise ton mot de passe',
      html: `<a href="${url}">Cliquer ici pour réinitialiser ton mot de passe</a>`,
    });
  },
},
emailVerification: {
  sendVerificationEmail: async ({ user, url }) => {
    await sendEmail({
      to: user.email,
      subject: 'Vérifie ton adresse email',
      html: `<a href="${url}">Cliquer ici pour vérifier ton email</a>`,
    });
  },
  sendOnSignUp: true,
},
