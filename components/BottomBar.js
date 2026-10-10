import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TokenStore } from "../TokenStore";

const BottomBar = ({ handleModalPress, onLayout }) => {
  const navigation = useNavigation();
  // edge-to-edge라 앱이 시스템 내비게이션 바 뒤까지 그려지므로 그만큼 띄워 준다
  const insets = useSafeAreaInsets();

  // 로그인 여부 확인
  const checkLogin = async (onSuccess) => {
    const token = await TokenStore.getToken();
    console.log("token: " + token);

    if (!token) {
      navigation.navigate("LoginScreen");
    } else {
      onSuccess();
    }
  };

  return (
    // 등록 버튼이 바 위로 돌출되는데, Android는 부모 영역 밖 터치를 받지 않으므로
    // 투명한 wrapper가 돌출 부분까지 감싸고 흰 배경은 아래에 따로 깐다
    <View
      style={[styles.wrapper, { paddingBottom: insets.bottom + 6 }]}
      onLayout={onLayout}
    >
      <View style={styles.background} />

      {/* 내가 올린 글 */}
      <Pressable
        style={styles.tab}
        onPress={() =>
          checkLogin(() => navigation.navigate("MyPostListScreen"))
        }
      >
        <Image source={require("../assets/myPost.png")} style={styles.icon} />
        <Text style={styles.label}>내 글</Text>
      </Pressable>

      {/* 게시글 등록 */}
      <Pressable
        style={styles.tab}
        onPress={() => checkLogin(() => handleModalPress())}
      >
        <View style={styles.addCircle}>
          <Image
            source={require("../assets/addPost.png")}
            style={styles.addIcon}
          />
        </View>
        <Text style={[styles.label, styles.addLabel]}>등록</Text>
      </Pressable>

      {/* 모든 게시글 리스트 */}
      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate("PostListScreen")}
      >
        <Image source={require("../assets/postList.png")} style={styles.icon} />
        <Text style={styles.label}>전체 글</Text>
      </Pressable>
    </View>
  );
};

export default BottomBar;

const ADD_SIZE = 52;
// 흰 배경이 시작되는 높이 = 등록 버튼이 바 위로 튀어나오는 정도
const RAISE = 16;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",

    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  background: {
    position: "absolute",
    top: RAISE,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
    tintColor: "#4b5563",
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: "#4b5563",
  },
  addCircle: {
    width: ADD_SIZE,
    height: ADD_SIZE,
    borderRadius: ADD_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#215294",
    // 흰 테두리로 바에서 파낸 듯한 느낌을 준다
    borderWidth: 4,
    borderColor: "white",
  },
  addIcon: {
    width: 26,
    height: 26,
    resizeMode: "contain",
    tintColor: "#fff",
  },
  addLabel: {
    color: "#215294",
    fontWeight: "600",
  },
});
