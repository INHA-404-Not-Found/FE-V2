import React from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Image as SvgImage, Path, Svg } from "react-native-svg";
import {
  MAP_IMAGE,
  ORIGINAL_HEIGHT,
  ORIGINAL_WIDTH,
  parsePolygon,
} from "./LocationViewBox";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const INITIAL_SCALE = 2.5; // 처음 열 때 건물 주변이 보이도록 확대

// 읽기 전용 캠퍼스 지도: 핀치로 확대/축소, 드래그로 이동하며 zone 하나를 강조
// 지도(Animated.View)는 컨테이너 가운데에 놓이고, translate는 컨테이너 중심 기준 이동량이다.
const LocationMap = ({ zone }) => {
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  // 컨테이너 크기 (지도 폭 = 컨테이너 폭)
  const boxW = useSharedValue(0);
  const boxH = useSharedValue(0);

  // 지도가 화면 밖으로 빠져나가지 않도록 이동 범위 제한
  const clamp = () => {
    "worklet";
    const mapW = boxW.value * scale.value;
    const mapH =
      ((boxW.value * ORIGINAL_HEIGHT) / ORIGINAL_WIDTH) * scale.value;
    const maxX = Math.max(0, (mapW - boxW.value) / 2);
    const maxY = Math.max(0, (mapH - boxH.value) / 2);
    tx.value = Math.min(maxX, Math.max(-maxX, tx.value));
    ty.value = Math.min(maxY, Math.max(-maxY, ty.value));
  };

  // 처음 열 때 강조할 건물이 화면 가운데 오도록 배치
  const handleLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    boxW.value = width;
    boxH.value = height;
    if (!zone?.d) return;
    const poly = parsePolygon(zone.d);
    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    // 원본 좌표 → 지도 중심 기준 화면 좌표
    const ratio = width / ORIGINAL_WIDTH;
    const ox = (cx - ORIGINAL_WIDTH / 2) * ratio;
    const oy = (cy - ORIGINAL_HEIGHT / 2) * ratio;
    scale.value = INITIAL_SCALE;
    tx.value = -ox * INITIAL_SCALE;
    ty.value = -oy * INITIAL_SCALE;
    clamp();
  };

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onChange((e) => {
      tx.value += e.changeX;
      ty.value += e.changeY;
      clamp();
    });

  // 손가락 사이 지점(focal)이 화면에서 고정되도록 확대/축소
  const pinch = Gesture.Pinch().onChange((e) => {
    const next = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, scale.value * e.scaleChange),
    );
    const ds = next / scale.value;
    const fx = e.focalX - boxW.value / 2;
    const fy = e.focalY - boxH.value / 2;
    tx.value = fx - (fx - tx.value) * ds;
    ty.value = fy - (fy - ty.value) * ds;
    scale.value = next;
    clamp();
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
      <View style={styles.container} onLayout={handleLayout}>
        <Animated.View style={[styles.map, animatedStyle]}>
          <Svg
            viewBox={`0 0 ${ORIGINAL_WIDTH} ${ORIGINAL_HEIGHT}`}
            width="100%"
            height="100%"
          >
            <SvgImage
              href={MAP_IMAGE}
              x="0"
              y="0"
              width={ORIGINAL_WIDTH}
              height={ORIGINAL_HEIGHT}
              preserveAspectRatio="xMidYMid meet"
            />
            {zone?.d ? (
              <Path
                d={zone.d}
                fill="rgba(33,143,202,0.5)"
                stroke="#218FCA"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </Svg>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

export default LocationMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    aspectRatio: ORIGINAL_WIDTH / ORIGINAL_HEIGHT,
  },
});
