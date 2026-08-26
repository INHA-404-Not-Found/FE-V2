import notifee from "@notifee/react-native";
import { getApp } from "@react-native-firebase/app";
import {
  getMessaging,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { registerRootComponent } from "expo";
import App from "./App";

// RNFB 요구사항: 백그라운드 핸들러는 컴포넌트 밖, 앱 진입점 최상단에서 등록해야 한다.
setBackgroundMessageHandler(getMessaging(getApp()), async (remoteMessage) => {
  console.log("푸시 수신 (background):", remoteMessage);
  // notification 필드가 있는 메시지는 OS가 트레이에 자동 표시한다.
  // data-only 메시지도 표시하려면 여기서 notifee.displayNotification()을 호출한다.
});

// 백그라운드에서의 알림 탭은 앱이 뜬 뒤 onNotificationOpenedApp / getInitialNotification이 처리한다.
notifee.onBackgroundEvent(async () => {});

registerRootComponent(App);
