import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider, useDispatch } from "react-redux";
import { store } from "./Redux/store";

import React, { useEffect } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import api from "./api/api";
import { flushPendingNavigation, navigationRef } from "./navigationRef";
import {
  ensureNotificationChannel,
  handleInitialNotification,
  registerPushToken,
  requestPushPermission,
  subscribeToPushEvents,
} from "./notifications";
import { TokenStore } from "./TokenStore";
import { tokenStorage } from "./tokenStorage";
import { setCategory } from "./Redux/slices/categorySlice";
import { setLocation } from "./Redux/slices/locationSlice";
import AddLostPostScreen from "./screens/AddLostPostScreen";
import AddPostScreen from "./screens/AddPostScreen";
import EditPostScreen from "./screens/EditPostScreen";
import Login from "./screens/Login";
import MainScreen from "./screens/MainScreen";
import MyPostListScreen from "./screens/MyPostListScreen";
import NotificationListScreen from "./screens/NotificationListScreen";
import PostListScreen from "./screens/PostListScreen";
import PostScreen from "./screens/PostScreen";
import UserScreen from "./screens/UserScreen";

const Stack = createNativeStackNavigator();

function AppContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");

        dispatch(setCategory(res.data)); // ✅ Redux에 저장
        console.log("카테고리 불러오기 성공:", res.data);
      } catch (err) {
        console.error("카테고리 불러오기 실패:", err);
      }
    };

    const fetchLocations = async () => {
      try {
        const res = await api.get("/locations");

        dispatch(setLocation(res.data)); // ✅ Redux에 저장
        console.log("장소 목록 불러오기 성공:", res.data);
      } catch (err) {
        console.error("장소 목록 불러오기 실패:", err);
      }
    };

    fetchCategories(); // 앱 실행 시 1회 호출
    fetchLocations();
  }, [dispatch]);

  return (
    <NavigationContainer ref={navigationRef} onReady={flushPendingNavigation}>
      <Stack.Navigator
        initialRouteName="MainScreen"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* 로그인 화면 */}
        <Stack.Screen name="LoginScreen" component={Login} />
        {/* 메인 화면 */}
        <Stack.Screen name="MainScreen" component={MainScreen} />
        {/* 게시글 리스트 화면 */}
        <Stack.Screen name="PostListScreen" component={PostListScreen} />
        {/* 습득 게시글 등록 화면 */}
        <Stack.Screen name="AddPostScreen" component={AddPostScreen} />
        {/* 분실 게시글 등록 화면 */}
        <Stack.Screen name="AddLostPostScreen" component={AddLostPostScreen} />
        {/* 유저 화면 */}
        <Stack.Screen name="UserScreen" component={UserScreen} />
        {/* 내 게시물 리스트 화면*/}
        <Stack.Screen name="MyPostListScreen" component={MyPostListScreen} />
        {/* 게시글 수정 화면*/}
        <Stack.Screen name="EditPostScreen" component={EditPostScreen} />
        {/* 내 게시물 */}
        <Stack.Screen name="PostScreen" component={PostScreen} />
        {/* 알림 목록 화면 */}
        <Stack.Screen
          name="NotificationListScreen"
          component={NotificationListScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    const boot = async () => {
      // 1. 저장된 로그인 토큰 복원 (푸시 토큰 전송이 401로 떨어지지 않도록 먼저 한다)
      const access = await tokenStorage.getAccessTStorage();
      if (access) {
        TokenStore.setToken(access);
        console.log("기존 토큰 복원 완료:", access);
      }

      // 2. Android 알림 채널 생성 (채널이 없으면 알림이 조용히 표시되지 않는다)
      await ensureNotificationChannel();

      // 3. 알림 권한 요청 -> 허용 시 FCM 토큰 발급 후 서버에 저장
      const granted = await requestPushPermission();
      if (granted) {
        if (access) {
          await registerPushToken();
        } else {
          console.log("로그인 전이라 FCM 토큰 등록은 로그인 후에 진행한다.");
        }
      } else {
        console.log("푸시 알림 권한이 거부되었습니다.");
      }

      // 4. 알림 탭으로 앱이 실행된 경우 해당 화면으로 이동
      await handleInitialNotification();
    };

    boot().catch((err) => console.error("앱 초기화 실패:", err));

    // 5. 앱 실행 중 알림 수신/탭/토큰 갱신 리스너 등록
    const unsubscribe = subscribeToPushEvents();
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <Provider store={store}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <AppContent />
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
