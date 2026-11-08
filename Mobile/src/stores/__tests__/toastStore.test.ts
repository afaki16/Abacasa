import { toast, TOAST_DURATION, TOAST_DURATION_WITH_ACTION, useToastStore } from '../toastStore';

describe('toastStore', () => {
  beforeEach(() => useToastStore.setState({ current: null }));

  it('türüyle gösterir; eylemli toast daha uzun kalır', () => {
    toast.success('Harcama kaydedildi');
    expect(useToastStore.getState().current).toMatchObject({
      message: 'Harcama kaydedildi',
      variant: 'success',
      duration: TOAST_DURATION,
    });

    const onPress = jest.fn();
    toast.error('Kaydedilemedi', { action: { label: 'Geri al', onPress } });
    const current = useToastStore.getState().current;
    expect(current).toMatchObject({ variant: 'error', duration: TOAST_DURATION_WITH_ACTION });
    current?.action?.onPress();
    expect(onPress).toHaveBeenCalled();
  });

  it('yeni toast eskisinin yerini alır; eski zamanlayıcı yenisini kapatmaz', () => {
    const first = toast.info('Birinci');
    const second = toast.info('İkinci');
    expect(second).not.toBe(first);

    toast.hide(first);
    expect(useToastStore.getState().current?.message).toBe('İkinci');

    toast.hide(second);
    expect(useToastStore.getState().current).toBeNull();
  });

  it('id verilmeden hide her durumda kapatır; süre özelleştirilebilir', () => {
    toast.info('Bilgi', { duration: 1000 });
    expect(useToastStore.getState().current?.duration).toBe(1000);
    toast.hide();
    expect(useToastStore.getState().current).toBeNull();
  });
});
