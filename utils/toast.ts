import { alert as burntAlert, toast as burntToast } from 'burnt';

export const showSuccessToast = (message: string, subtitle?: string) => {
  burntToast({
    title: message,
    message: subtitle,
    preset: 'done',
    haptic: 'success',
  });
};

export const showErrorToast = (message: string, subtitle?: string) => {
  burntToast({
    title: message,
    message: subtitle,
    preset: 'error',
    haptic: 'error',
  });
};

export const showInfoToast = (message: string, subtitle?: string) => {
  burntToast({
    title: message,
    message: subtitle,
    preset: 'none',
    haptic: 'warning',
  });
};
