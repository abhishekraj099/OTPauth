const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  return value;
};

const serializeUser = (user) => {
  if (!user) return null;
  const data = typeof user.data === 'function' ? user.data() : user;
  if (!data) return null;

  return {
    id: user.id || data.id,
    email: data.email,
    isEmailVerified: Boolean(data.isEmailVerified),
    isActive: data.isActive !== false,
    isDeleted: Boolean(data.isDeleted),
    lastLoginAt: toDate(data.lastLoginAt),
    loginCount: data.loginCount || 0,
    metadata: data.metadata || {},
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
};

module.exports = serializeUser;
