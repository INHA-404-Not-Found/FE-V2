import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

// 네비게이션이 아직 준비되지 않은 상태(앱 콜드 스타트 등)에서 들어온 이동 요청을 잠시 보관한다.
let pendingRoute = null;

/**
 * 화면 이동. NavigationContainer가 아직 마운트되지 않았으면 보관했다가
 * onReady 시점에 flushPendingNavigation()이 대신 실행한다.
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    pendingRoute = { name, params };
  }
}

export function flushPendingNavigation() {
  if (!pendingRoute) return;
  const { name, params } = pendingRoute;
  pendingRoute = null;
  navigationRef.navigate(name, params);
}
