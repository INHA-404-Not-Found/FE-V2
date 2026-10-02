import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const STUDENT_ID_KEY = "student_id";

// 선택: 보안 옵션 (원하면 붙여서 사용)
// iOS: keychainService/accessibility, Android: requireAuthentication 등
const SECURE_OPTS = {
  // requireAuthentication: true, // 잠금 해제 필요하게 하려면 (Android 6+/iOS)
};

export const tokenStorage = {
  saveTStorage: async ({ accessToken, refreshToken }) => {
    if (accessToken != null) {
      await SecureStore.setItemAsync(ACCESS_KEY, accessToken, SECURE_OPTS);
    }
    if (refreshToken != null) {
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken, SECURE_OPTS);
    }
  },

  // 토큰 갱신(/auth/refresh) 요청에 필요해서 로그인 때 같이 저장한다
  saveStudentId: (studentId) =>
    SecureStore.setItemAsync(STUDENT_ID_KEY, String(studentId), SECURE_OPTS),
  getStudentId: () => SecureStore.getItemAsync(STUDENT_ID_KEY),

  getAccessTStorage: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefreshTStorage: () => SecureStore.getItemAsync(REFRESH_KEY),

  clearTStorage: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(STUDENT_ID_KEY);
  },
};
