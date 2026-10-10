import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
import {
  hasPushPermission,
  isPushEnabled,
  openPushSettings,
  setPushEnabled,
} from "../notifications";

// 내 정보 화면의 푸시 알림 스위치 상태.
// 앱 설정값(켜기/끄기)과 OS 알림 권한이 둘 다 켜져 있어야 켜짐으로 보여준다.
export function usePushSetting() {
  const [pushOn, setPushOn] = useState(false);
  // 켜려다 권한이 막혀 OS 설정으로 보낸 경우, 돌아왔을 때 이어서 켜기 위해 기억한다
  const waitingForSettings = useRef(false);

  const refresh = useCallback(async () => {
    const [enabled, permitted] = await Promise.all([
      isPushEnabled(),
      hasPushPermission(),
    ]);

    if (waitingForSettings.current && permitted) {
      waitingForSettings.current = false;
      setPushOn(await setPushEnabled(true));
      return;
    }
    setPushOn(enabled && permitted);
  }, []);

  useEffect(() => {
    refresh();
    // OS 설정에서 권한을 바꾸고 돌아오면 다시 확인한다
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const togglePush = async (next) => {
    setPushOn(next);
    try {
      const applied = await setPushEnabled(next);
      setPushOn(applied);
      if (next && !applied) {
        // 권한을 거부한 뒤엔 시스템 팝업이 다시 뜨지 않으므로 설정 화면으로 안내한다
        Alert.alert(
          "알림 권한이 꺼져 있어요",
          "휴대폰 설정에서 알림을 허용하면 푸시 알림을 받을 수 있어요.",
          [
            { text: "취소", style: "cancel" },
            {
              text: "설정 열기",
              onPress: () => {
                waitingForSettings.current = true;
                openPushSettings();
              },
            },
          ],
        );
      }
    } catch (e) {
      console.error("알림 설정 변경 실패:", e?.message);
      setPushOn(!next);
      alert("알림 설정을 변경하지 못했습니다.");
    }
  };

  return { pushOn, togglePush };
}
