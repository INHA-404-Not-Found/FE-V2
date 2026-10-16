import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Line, Path, Rect } from "react-native-svg";

// 로고가 바뀌면 이 두 색만 브랜드 톤에 맞춰 고친다
const PLACEHOLDER_BG = "#EEF2F8";
const PLACEHOLDER_STROKE = "#B4C3D6";

// 게시글 이미지가 없을 때 보여 주는 보관함 상자 아이콘 (눈에 덜 띄게 연한 톤)
const PostImagePlaceholder = () => {
  return (
    <View style={styles.container}>
      <Svg width="40%" height="40%" viewBox="0 0 24 24" fill="none">
        <Rect
          x={3}
          y={4}
          width={18}
          height={4}
          rx={1}
          stroke={PLACEHOLDER_STROKE}
          strokeWidth={1.5}
        />
        <Path
          d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"
          stroke={PLACEHOLDER_STROKE}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <Line
          x1={10}
          y1={12}
          x2={14}
          y2={12}
          stroke={PLACEHOLDER_STROKE}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

export default PostImagePlaceholder;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: PLACEHOLDER_BG,
    justifyContent: "center",
    alignItems: "center",
  },
});
