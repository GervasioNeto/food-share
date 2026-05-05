import Toast from 'react-native-toast-message';

type Position = 'top' | 'bottom';

export const showToast = {
  success: (title: string, message?: string, position: Position = 'top') =>
    Toast.show({ type: 'success', text1: title, text2: message, position, visibilityTime: 4000 }),

  error: (title: string, message?: string, position: Position = 'top') =>
    Toast.show({ type: 'error', text1: title, text2: message, position, visibilityTime: 4000 }),

  info: (title: string, message?: string, position: Position = 'top') =>
    Toast.show({ type: 'info', text1: title, text2: message, position, visibilityTime: 4000 }),
};

export { Toast };
