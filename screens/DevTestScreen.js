import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api/api";
import DefaultHeader from "../components/DefaultHeader";
import {
  displayNotification,
  getPushToken,
  registerPushToken,
} from "../notifications";
import { TokenStore } from "../TokenStore";

// 개발 빌드 또는 관리자 계정에서만 진입 (UserScreen의 개발자 섹션)
const DevTestScreen = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [registerResult, setRegisterResult] = useState("");
  const [postId, setPostId] = useState("");
  const [refreshResult, setRefreshResult] = useState("");

  useEffect(() => {
    getPushToken()
      .then(setFcmToken)
      .catch((e) => setFcmToken(`조회 실패: ${e?.message}`));
  }, []);

  const handleRegister = async () => {
    setRegisterResult("등록 중...");
    // registerPushToken은 실패해도 throw하지 않고 null을 돌려준다
    const token = await registerPushToken();
    if (token) {
      setFcmToken(token);
      setRegisterResult("토큰 발급 완료 (서버 저장 결과는 콘솔 로그 확인)");
    } else {
      setRegisterResult("토큰 발급 실패 (콘솔 로그 확인)");
    }
  };

  // 실제 FCM payload처럼 data 값은 문자열로 넣는다
  const handleTestNotification = async () => {
    await displayNotification({
      notification: {
        title: "테스트 알림",
        body: postId ? `${postId}번 게시글로 이동` : "알림 목록으로 이동",
      },
      data: postId ? { postId } : {},
    });
  };

  // access token을 망가뜨린 뒤 API를 호출해 401/403 → /auth/refresh → 재요청 흐름을 확인한다
  const handleRefreshTest = async () => {
    setRefreshResult("테스트 중...");
    TokenStore.setToken("invalid-access-token");
    try {
      await api.get("/auth/profile");
      const renewed = TokenStore.getToken();
      setRefreshResult(
        renewed && renewed !== "invalid-access-token"
          ? "성공: 토큰이 갱신되고 원래 요청이 재시도됨"
          : "실패: 요청은 성공했지만 토큰이 갱신되지 않음",
      );
    } catch (e) {
      // 갱신 실패 시 인터셉터가 저장된 토큰을 모두 지운다 (로그아웃 상태)
      setRefreshResult(
        `실패: ${e?.response?.status ?? ""} ${e?.message} (토큰 삭제됨, 다시 로그인 필요)`,
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <DefaultHeader />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>FCM 토큰</Text>
        <View style={styles.card}>
          {/* 길게 눌러 복사해서 Firebase 콘솔 테스트 발송에 사용 */}
          <Text selectable style={styles.tokenText}>
            {fcmToken ?? "조회 중..."}
          </Text>
          <Pressable
            onPress={handleRegister}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnText}>서버에 재등록</Text>
          </Pressable>
          {!!registerResult && (
            <Text style={styles.resultText}>{registerResult}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>알림 탭 이동</Text>
        <View style={styles.card}>
          <TextInput
            value={postId}
            onChangeText={setPostId}
            placeholder="게시글 ID (비우면 알림 목록으로 이동)"
            keyboardType="number-pad"
            style={styles.input}
          />
          <Pressable
            onPress={handleTestNotification}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnText}>테스트 알림 띄우기</Text>
          </Pressable>
          <Text style={styles.resultText}>
            알림이 뜨면 눌러서 해당 화면으로 이동하는지 확인
          </Text>
        </View>

        <Text style={styles.sectionTitle}>토큰 갱신</Text>
        <View style={styles.card}>
          <Pressable
            onPress={handleRefreshTest}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnText}>access token 강제 만료 후 API 호출</Text>
          </Pressable>
          <Text style={styles.resultText}>
            {refreshResult || "자동으로 토큰이 갱신되는지 확인"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DevTestScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F7FA",
  },
  container: {
    paddingBottom: 32,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 22,
    fontSize: 13,
    fontWeight: "600",
    color: "#a8a8a8",
  },
  // UserScreen의 card와 같은 스타일
  card: {
    marginHorizontal: 10,
    padding: 16,
    gap: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  tokenText: {
    fontSize: 12,
    color: "#333",
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 15,
  },
  btn: {
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#215294",
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  resultText: {
    fontSize: 13,
    color: "#6B7280",
  },
});
