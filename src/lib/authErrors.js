export const getFriendlyErrorMessage = (error) => {
  const code = error?.code || error?.message || "";
  
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
    return "Invalid email or password. Please try again.";
  }
  
  if (code.includes('auth/email-already-in-use')) {
    return "This email is already registered. Try logging in instead.";
  }
  
  if (code.includes('auth/weak-password')) {
    return "Password should be at least 6 characters long.";
  }
  
  if (code.includes('auth/invalid-email')) {
    return "Please enter a valid email address.";
  }

  if (code.includes('auth/too-many-requests')) {
    return "Too many failed attempts. Please try again later.";
  }

  if (code.includes('auth/network-request-failed')) {
    return "Network error. Please check your internet connection.";
  }

  // Default fallback if we don't recognize the code
  return "An unexpected error occurred. Please try again.";
};
