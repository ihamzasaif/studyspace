import { useEffect, useRef } from 'react';

/**
 * Hook that registers a modal or overlay with browser history.
 * When the user presses the browser Back button or performs Android back gesture,
 * this hook automatically intercepts it and closes the modal instead of navigating away.
 *
 * If the user closes the modal normally (e.g. clicking 'X' or 'Cancel'),
 * the history entry is popped cleanly to keep the navigation stack intact.
 */
export function useBackHandler(
  isOpen: boolean,
  onClose: () => void,
  modalId: string
) {
  const isClosingViaPopstate = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    isClosingViaPopstate.current = false;
    const currentTab = window.history.state?.tab || 'dashboard';

    // Push modal state into browser history
    window.history.pushState(
      { type: 'modal', modalId, tab: currentTab },
      '',
      `#${currentTab}-${modalId}`
    );

    const handlePopState = () => {
      isClosingViaPopstate.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      // If closed manually (e.g. by pressing X or Submit) rather than browser back
      if (!isClosingViaPopstate.current) {
        if (window.history.state?.type === 'modal' && window.history.state?.modalId === modalId) {
          window.history.back();
        }
      }
      isClosingViaPopstate.current = false;
    };
  }, [isOpen, modalId]);
}
