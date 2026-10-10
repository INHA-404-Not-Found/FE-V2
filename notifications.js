import notifee, {
  AndroidImportance,
  AuthorizationStatus as NotifeeAuthorizationStatus,
  EventType,
} from "@notifee/react-native";
import { getApp } from "@react-native-firebase/app";
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from "@react-native-firebase/messaging";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import api from "./api/api";
import { navigate } from "./navigationRef";

// Android 8(API 26)+ 는 채널이 없으면 알림을 하나도 표시하지 않는다. 에러도 나지 않고 조용히 사라진다.
export const ANDROID_CHANNEL_ID = "default";

const messagingInstance = () => getMessaging(getApp());

/** 알림 채널 생성. 같은 id로 여러 번 호출해도 안전하다. */
export async function ensureNotificationChannel() {
  if (Platform.OS !== "android") return;

  await notifee.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: "기본 알림",
    importance: AndroidImportance.HIGH,
    vibration: true,
  });
}

/** 알림 권한 요청. Android 13+의 POST_NOTIFICATIONS 런타임 권한도 여기서 처리된다. */
export async function requestPushPermission() {
  if (Platform.OS === "android") {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === NotifeeAuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === NotifeeAuthorizationStatus.PROVISIONAL
    );
  }

  const status = await requestPermission(messagingInstance());
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

// 설정 화면의 알림 켜기/끄기 값. 저장된 값이 없으면 켜진 것으로 본다.
const PUSH_ENABLED_KEY = "push_enabled";

export async function isPushEnabled() {
  return (await SecureStore.getItemAsync(PUSH_ENABLED_KEY)) !== "false";
}

/**
 * 알림 켜기/끄기. 끄면 서버에서 이 계정의 FCM 토큰을 지워 푸시가 오지 않게 한다.
 * 실제로 적용된 상태를 돌려준다. (권한 거부 시 false)
 */
export async function setPushEnabled(enabled) {
  if (enabled) {
    const granted = await requestPushPermission();
    if (!granted) return false;
    await SecureStore.setItemAsync(PUSH_ENABLED_KEY, "true");
    await registerPushToken();
    return true;
  }

  await SecureStore.setItemAsync(PUSH_ENABLED_KEY, "false");
  await api.delete("/fcm/token");
  return false;
}

/** FCM 토큰을 백엔드에 저장한다. (Expo 푸시 토큰과 다른 값이다) */
async function sendTokenToServer(token) {
  if (!token) return;
  // 사용자가 알림을 끈 경우 앱 시작/로그인/토큰 갱신 때 다시 등록하지 않는다
  if (!(await isPushEnabled())) return;

  try {
    const res = await api.post("/fcm/token", { token });
    console.log("FCM 토큰 저장 성공:", res.data);
  } catch (error) {
    console.error(
      "FCM 토큰 저장 실패:",
      error?.response?.status,
      error?.message
    );
  }
}

/** 현재 기기의 FCM 토큰 조회 (서버 등록 없이) */
export const getPushToken = () => getToken(messagingInstance());

/**
 * 권한 요청 -> 토큰 발급 -> 서버 저장.
 * 로그인 토큰이 복원된 뒤에 호출해야 /fcm/token 이 401로 떨어지지 않는다.
 */
export async function registerPushToken() {
  try {
    const token = await getToken(messagingInstance());
    console.log("FCM 토큰 발급 완료:", token);
    await sendTokenToServer(token);
    return token;
  } catch (error) {
    console.error("FCM 토큰 발급 실패:", error?.message);
    return null;
  }
}

/** foreground에서는 OS가 알림을 자동으로 띄우지 않으므로 직접 표시한다. */
export async function displayNotification(remoteMessage) {
  const { notification, data } = remoteMessage ?? {};

  await notifee.displayNotification({
    title: notification?.title ?? data?.title ?? "알림",
    body: notification?.body ?? data?.message ?? "",
    data: data ?? {},
    android: {
      channelId: ANDROID_CHANNEL_ID,
      smallIcon: "ic_launcher",
      pressAction: { id: "default" },
    },
  });
}

/**
 * 알림 탭 처리. 앱 내 알림 목록(components/Notification.js)의 onPress와 동일하게 맞춘다.
 * data 필드 이름은 백엔드 발송 payload에 맞춰 확인 필요.
 */
export async function openNotificationTarget(data) {
  if (!data) return;

  try {
    let postId = data.postId;

    // postId가 없으면 알림 목록과 같은 방식으로 link를 조회해서 얻는다.
    if (!postId && data.link) {
      const res = await api.get(data.link);
      postId = res.data?.postId;
    }

    if (data.notificationId) {
      await api
        .patch(`notifications/${data.notificationId}/read`)
        .catch((err) => console.log("알림 읽음 처리 생략:", err?.message));
    }

    if (postId) {
      navigate("PostScreen", postId);
    } else {
      navigate("NotificationListScreen");
    }
  } catch (err) {
    console.error("푸시 알림 클릭 처리 실패:", err);
    navigate("NotificationListScreen");
  }
}

/** 앱이 실행 중일 때 쓰는 리스너들. 해제 함수를 돌려준다. */
export function subscribeToPushEvents() {
  const messaging = messagingInstance();

  const unsubscribeOnMessage = onMessage(messaging, async (remoteMessage) => {
    console.log("푸시 수신 (foreground):", remoteMessage);
    await displayNotification(remoteMessage);
  });

  const unsubscribeTokenRefresh = onTokenRefresh(messaging, (token) => {
    console.log("FCM 토큰 갱신:", token);
    sendTokenToServer(token);
  });

  // 백그라운드 상태에서 트레이 알림을 탭해 앱이 다시 떠올랐을 때
  const unsubscribeOpened = onNotificationOpenedApp(messaging, (remoteMessage) => {
    console.log("푸시 알림 탭 (background):", remoteMessage);
    openNotificationTarget(remoteMessage?.data);
  });

  // notifee가 직접 띄운 foreground 알림의 탭
  const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      openNotificationTarget(detail.notification?.data);
    }
  });

  return () => {
    unsubscribeOnMessage();
    unsubscribeTokenRefresh();
    unsubscribeOpened();
    unsubscribeNotifee();
  };
}

/** 앱이 완전히 종료된 상태에서 알림 탭으로 실행된 경우 */
export async function handleInitialNotification() {
  const remoteMessage = await getInitialNotification(messagingInstance());
  if (remoteMessage) {
    console.log("푸시 알림 탭 (종료 상태):", remoteMessage);
    await openNotificationTarget(remoteMessage.data);
    return;
  }

  const initial = await notifee.getInitialNotification();
  if (initial) {
    await openNotificationTarget(initial.notification?.data);
  }
}
