/**
 * FILE: frontend/src/utils/messageNavigation.js
 * PURPOSE: Helper function to navigate to messages page with pre-selected user
 */

/**
 * Navigate to messages page with a specific user selected
 * @param {string} userId - The ID of the user to chat with
 * @param {function} navigate - React Router's navigate function
 */
export const navigateToMessage = (userId, navigate) => {
  if (!userId) {
    console.error('User ID is required to navigate to messages');
    return;
  }
  
  navigate(`/messages?userId=${userId}`);
};

/**
 * Alternative: Direct navigation with user object
 * @param {object} user - The user object to chat with
 * @param {function} navigate - React Router's navigate function
 */
export const openChatWithUser = (user, navigate) => {
  if (!user || !user._id) {
    console.error('Valid user object is required');
    return;
  }
  
  navigate(`/messages?userId=${user._id}`);
};