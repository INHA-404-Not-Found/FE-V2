import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import appConfig from "../app.json";
import DefaultHeader from "../components/DefaultHeader";
import { useAuth } from "../hooks/useAuth";
import { usePushSetting } from "../hooks/usePushSetting";

// 설정 목록 한 줄: 왼쪽 라벨 + 오른쪽 값 (onPress가 있으면 > 표시, right가 있으면 그걸 표시)
const SettingRow = ({ label, value, onPress, right }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
  >
    <Text style={styles.rowLabel}>{label}</Text>
    {value != null && <Text style={styles.rowValue}>{value}</Text>}
    {right}
    {onPress && (
      <Image source={require("../assets/prev.png")} style={styles.chevron} />
    )}
  </Pressable>
);

const UserScreen = () => {
  const navigation = useNavigation();
  const myInfo = useSelector((state) => state.my.info);
  const { logout } = useAuth();
  const { pushOn, togglePush } = usePushSetting();

  return (
    <SafeAreaView style={styles.safe} edge={["top"]}>
      <DefaultHeader />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>계정</Text>
        <View style={styles.card}>
          <SettingRow label="이메일" value={myInfo?.email ?? "-"} />
          <SettingRow label="학번" value={myInfo?.studentId ?? "-"} />
          <SettingRow
            label="이메일 변경"
            onPress={() => alert("이메일 변경은 준비 중입니다.")}
          />
        </View>

        <Text style={styles.sectionTitle}>알림</Text>
        <View style={styles.card}>
          <SettingRow
            label="푸시 알림"
            right={
              <Switch
                trackColor={{ false: "#d9d9d9", true: "#215294" }}
                thumbColor="#ffffff"
                value={pushOn}
                onValueChange={togglePush}
                disabled={!myInfo}
              />
            }
          />
        </View>

        {(__DEV__ || myInfo?.role === "ADMIN") && (
          <>
            <Text style={styles.sectionTitle}>개발자</Text>
            <View style={styles.card}>
              <SettingRow
                label="테스트 페이지"
                onPress={() => navigation.navigate("DevTestScreen")}
              />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>앱 정보</Text>
        <View style={styles.card}>
          <SettingRow label="버전" value={appConfig.expo.version} />
        </View>

        <View style={[styles.card, { marginTop: 24 }]}>
          {myInfo ? (
            <Pressable
              onPress={() => logout()}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={styles.logoutText}>로그아웃</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => navigation.navigate("LoginScreen")}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={styles.loginText}>로그인</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserScreen;

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
  // 게시글 상세(PostScreen)의 contentCard와 같은 카드 스타일
  card: {
    marginHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  rowPressed: {
    backgroundColor: "#f2f6ff",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  rowValue: {
    fontSize: 15,
    color: "#6B7280",
  },
  chevron: {
    width: 16,
    height: 16,
    tintColor: "#a8a8a8",
    transform: [{ rotate: "180deg" }],
  },
  logoutText: {
    fontSize: 15,
    color: "#fe2828",
  },
  loginText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#215294",
  },
});
