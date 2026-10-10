import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import { G, Path, Svg, Image as SvgImage } from "react-native-svg";
import {
  CAMPUS_ZONES,
  isInside,
  MAP_IMAGE,
  ORIGINAL_HEIGHT,
  ORIGINAL_WIDTH,
  parsePolygon,
} from "../constants/campusMap";

const FIXED_SCALE = 2;
const vbW = ORIGINAL_WIDTH / FIXED_SCALE;
const vbH = ORIGINAL_HEIGHT / FIXED_SCALE;

const SPEED = 3; // 원하는 배율 (1 = 기본속도, 2 = 두배 빠름)

const ZONE_POLYGONS = CAMPUS_ZONES.filter((z) => z.d).map((z) => ({
  zone: z,
  poly: parsePolygon(z.d),
}));

const LocationViewBox = ({ selected, setSelected }) => {
  // viewBox 좌상단을 React state로
  const [vb, setVb] = React.useState({ x: 0, y: 0 });

  // 제스처 시작점(SharedValue는 계산용으로만)
  const startVbX = useSharedValue(0);
  const startVbY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      startVbX.value = vb.x;
      startVbY.value = vb.y;
    })
    .onUpdate((e) => {
      const dx = (e.translationX / FIXED_SCALE) * SPEED;
      const dy = (e.translationY / FIXED_SCALE) * SPEED;

      const minX = 0;
      const minY = 0;
      const maxX = ORIGINAL_WIDTH - vbW;
      const maxY = ORIGINAL_HEIGHT - vbH;

      const nx = Math.max(minX, Math.min(maxX, startVbX.value - dx));
      const ny = Math.max(minY, Math.min(maxY, startVbY.value - dy));

      // JS 상태로 반영 (여기가 핵심)
      runOnJS(setVb)({ x: nx, y: ny });
    });

  const handlePress = (z) => {
    setSelected(z.id === selected?.id ? null : z);
  };

  // SVG 요소의 onPress는 GestureDetector 안에서 전달되지 않을 수 있어,
  // 탭 좌표를 지도 좌표로 바꿔 어느 구역인지 직접 찾는다.
  const [svgWidth, setSvgWidth] = React.useState(0);
  const handleTap = (x, y) => {
    if (!svgWidth) return;
    const ratio = vbW / svgWidth;
    const mx = vb.x + x * ratio;
    const my = vb.y + y * ratio;
    const hit = ZONE_POLYGONS.find(({ poly }) => isInside(mx, my, poly));
    if (hit) handlePress(hit.zone);
  };

  const tap = Gesture.Tap().onEnd((e, success) => {
    if (success) runOnJS(handleTap)(e.x, e.y);
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <GestureDetector gesture={Gesture.Simultaneous(pan, tap)}>
          <Svg
            // 고정 2배 확대: vbW/vbH로 구현
            viewBox={`${vb.x} ${vb.y} ${vbW} ${vbH}`}
            width="100%"
            style={{ aspectRatio: ORIGINAL_WIDTH / ORIGINAL_HEIGHT }}
            onLayout={(e) => setSvgWidth(e.nativeEvent.layout.width)}
          >
            <SvgImage
              href={MAP_IMAGE}
              x="0"
              y="0"
              width={ORIGINAL_WIDTH}
              height={ORIGINAL_HEIGHT}
              preserveAspectRatio="xMidYMid meet"
            />
            {CAMPUS_ZONES.map((z) =>
              z.d ? (
                <G key={z.id}>
                  <Path
                    d={z.d}
                    fill={
                      z.id === selected?.id
                        ? "rgba(33,143,202,0.5)"
                        : "rgba(33,143,202,0.01)"
                    }
                    stroke="#218FCA"
                    strokeWidth={z.id === selected?.id ? 2 : 0}
                    vectorEffect="non-scaling-stroke"
                  />
                </G>
              ) : null,
            )}
          </Svg>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
};

export default LocationViewBox;

const styles = StyleSheet.create({
  locationSelectMask: {
    width: 380,
    height: 230,
    marginVertical: 15,
  },
  locationMapImg: {
    width: "100%",
    height: "100%",
  },
  container: { paddingTop: 18, paddingHorizontal: 5, alignItems: "center" },
  title: { marginBottom: 12, fontSize: 16, fontWeight: "600" },
  // 화면 너비에 맞춰 자동 비율: 289/152
  mapWrap: { width: "100%", aspectRatio: ORIGINAL_WIDTH / ORIGINAL_HEIGHT },
});
