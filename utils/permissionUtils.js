const checkPermissions = (user, allowedRoles) => {
  if (!user) {
    throw new Error("Authentication required");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions");
  }

  return true;
};

const isOwnerOrAdmin = (user, ownerId) => {
  if (!user) {
    throw new Error("Authentication required");
  }

  if (user.role !== "admin" && user.id !== ownerId) {
    throw new Error("Not authorized");
  }

  return true;
};

module.exports = {
  checkPermissions,
  isOwnerOrAdmin,
};
